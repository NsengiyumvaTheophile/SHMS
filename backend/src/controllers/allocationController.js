const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { getRoomOccupancy, syncRoomAvailability } = require('../utils/helpers');
const { hostelFitsStudent } = require('../utils/validation');

async function listAllocations(req, res) {
  try {
    const { status, roomId, hostelId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (roomId) where.roomId = Number(roomId);
    if (hostelId) where.room = { hostelId: Number(hostelId) };
    if (req.user.role === 'STUDENT') where.studentId = req.student.id;

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        student: true,
        room: { include: { hostel: true } },
        request: true,
        checkIn: true,
        checkOut: true,
        allocatedBy: { select: { id: true, username: true } },
      },
      orderBy: { allocationDate: 'desc' },
    });
    res.json(allocations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createAllocation(req, res) {
  try {
    const { requestId, studentId, roomId, notes } = req.body;
    if (!roomId || (!requestId && !studentId)) {
      return res.status(400).json({ message: 'Select a student and an available room' });
    }

    let request = null;
    if (requestId) {
      request = await prisma.hostelRequest.findUnique({
        where: { id: Number(requestId) },
        include: { allocation: true, student: true },
      });
      if (!request) return res.status(404).json({ message: 'Request not found' });
    } else {
      request = await prisma.hostelRequest.findFirst({
        where: {
          studentId: Number(studentId),
          status: 'APPROVED',
          allocation: { is: null },
        },
        include: { allocation: true, student: true },
      });
      if (!request) {
        return res.status(400).json({
          message: 'No approved hostel request found for this student. Approve a request first.',
        });
      }
    }
    if (request.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Only approved requests can be allocated' });
    }
    if (request.allocation) {
      return res.status(400).json({ message: 'This request already has an allocation' });
    }

    const existingActive = await prisma.allocation.findFirst({
      where: {
        studentId: request.studentId,
        status: { in: ['ACTIVE', 'CHECKED_IN'] },
      },
    });
    if (existingActive) {
      return res.status(400).json({ message: 'Student already has an active allocation' });
    }
    if (request.student.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Inactive students cannot be allocated a room' });
    }

    const occ = await getRoomOccupancy(prisma, Number(roomId));
    if (!occ) return res.status(404).json({ message: 'Room not found' });
    if (occ.room.status === 'INACTIVE' || occ.room.status === 'MAINTENANCE') {
      return res.status(400).json({ message: 'Room is not available for allocation' });
    }
    if (occ.isFull) {
      return res.status(400).json({
        message: `Room is full. Capacity: ${occ.capacity}, Occupied: ${occ.occupied}`,
      });
    }
    const targetRoom = await prisma.room.findUnique({
      where: { id: Number(roomId) },
      include: { hostel: true },
    });
    if (!targetRoom.hostel.isActive) {
      return res.status(400).json({ message: 'This hostel is inactive' });
    }
    if (!hostelFitsStudent(targetRoom.hostel, request.student)) {
      return res.status(400).json({
        message: 'This hostel does not match the student gender. Choose a different available room.',
      });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      const created = await tx.allocation.create({
        data: {
          studentId: request.studentId,
          roomId: Number(roomId),
          requestId: request.id,
          allocatedById: req.user.id,
          notes,
          status: 'ACTIVE',
        },
        include: {
          student: true,
          room: { include: { hostel: true } },
          request: true,
        },
      });

      await syncRoomAvailability(tx, Number(roomId));
      return created;
    });

    await logAudit({
      userId: req.user.id,
      action: 'ALLOCATE_ROOM',
      entity: 'Allocation',
      entityId: allocation.id,
      details: `Student ${allocation.student.studentId} -> Room ${allocation.room.roomNumber}`,
    });

    res.status(201).json(allocation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function checkIn(req, res) {
  try {
    const { allocationId, notes } = req.body;
    if (!allocationId) return res.status(400).json({ message: 'allocationId is required' });
    const allocation = await prisma.allocation.findUnique({
      where: { id: Number(allocationId) },
      include: { checkIn: true, room: { include: { hostel: true } }, student: true },
    });
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (allocation.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Only ACTIVE allocations can check in' });
    }
    if (allocation.checkIn) {
      return res.status(400).json({ message: 'Student already checked in' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const checkIn = await tx.checkIn.create({
        data: { allocationId: allocation.id, notes },
      });
      const updated = await tx.allocation.update({
        where: { id: allocation.id },
        data: { status: 'CHECKED_IN' },
        include: { student: true, room: { include: { hostel: true } }, checkIn: true },
      });
      return { checkIn, allocation: updated };
    });

    await logAudit({
      userId: req.user.id,
      action: 'CHECK_IN',
      entity: 'Allocation',
      entityId: allocation.id,
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function checkOut(req, res) {
  try {
    const { allocationId, reason, notes } = req.body;
    const allocation = await prisma.allocation.findUnique({
      where: { id: Number(allocationId) },
      include: { checkOut: true, checkIn: true },
    });
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (allocation.status !== 'CHECKED_IN') {
      return res.status(400).json({ message: 'Only checked-in students can check out' });
    }
    if (allocation.checkOut) {
      return res.status(400).json({ message: 'Already checked out' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const checkOut = await tx.checkOut.create({
        data: { allocationId: allocation.id, reason, notes },
      });
      const updated = await tx.allocation.update({
        where: { id: allocation.id },
        data: { status: 'CHECKED_OUT' },
        include: {
          student: true,
          room: { include: { hostel: true } },
          checkIn: true,
          checkOut: true,
        },
      });

      await syncRoomAvailability(tx, allocation.roomId);
      return { checkOut, allocation: updated };
    });

    await logAudit({
      userId: req.user.id,
      action: 'CHECK_OUT',
      entity: 'Allocation',
      entityId: allocation.id,
      details: reason || '',
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function transferAllocation(req, res) {
  try {
    const { roomId, notes } = req.body;
    const allocationId = Number(req.params.id);
    if (!roomId) return res.status(400).json({ message: 'Select a different available room' });

    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
      include: { student: true, room: { include: { hostel: true } } },
    });
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (!['ACTIVE', 'CHECKED_IN'].includes(allocation.status)) {
      return res.status(400).json({ message: 'Only current allocations can be moved to another room' });
    }
    if (allocation.roomId === Number(roomId)) {
      return res.status(400).json({ message: 'Choose a different room from the current one' });
    }

    const occ = await getRoomOccupancy(prisma, Number(roomId));
    if (!occ) return res.status(404).json({ message: 'Room not found' });
    if (occ.room.status === 'INACTIVE' || occ.room.status === 'MAINTENANCE') {
      return res.status(400).json({ message: 'Room is not available for allocation' });
    }
    if (occ.isFull) {
      return res.status(400).json({
        message: `Room is full. Capacity: ${occ.capacity}, Occupied: ${occ.occupied}`,
      });
    }
    const targetRoom = await prisma.room.findUnique({
      where: { id: Number(roomId) },
      include: { hostel: true },
    });
    if (!targetRoom.hostel.isActive) {
      return res.status(400).json({ message: 'This hostel is inactive' });
    }
    if (!hostelFitsStudent(targetRoom.hostel, allocation.student)) {
      return res.status(400).json({
        message: 'This hostel does not match the student gender. Choose a different available room.',
      });
    }

    const previousRoomId = allocation.roomId;
    const updated = await prisma.$transaction(async (tx) => {
      const moved = await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          roomId: Number(roomId),
          notes: notes || allocation.notes,
        },
        include: {
          student: true,
          room: { include: { hostel: true } },
          checkIn: true,
          checkOut: true,
        },
      });
      await syncRoomAvailability(tx, previousRoomId);
      await syncRoomAvailability(tx, Number(roomId));
      return moved;
    });

    await logAudit({
      userId: req.user.id,
      action: 'TRANSFER_ROOM',
      entity: 'Allocation',
      entityId: allocation.id,
      details: `${allocation.student.studentId} from ${allocation.room.roomNumber} to ${updated.room.roomNumber}`,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function cancelAllocation(req, res) {
  try {
    const allocationId = Number(req.params.id);
    const { reason, notes } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id: allocationId },
      include: { student: true, room: true, request: true },
    });
    if (!allocation) return res.status(404).json({ message: 'Allocation not found' });
    if (['CHECKED_OUT', 'CANCELLED'].includes(allocation.status)) {
      return res.status(400).json({ message: 'This allocation is already cancelled or completed' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.allocation.update({
        where: { id: allocation.id },
        data: {
          status: 'CANCELLED',
          notes: notes || reason || 'Cancelled by admin due to non-attendance or withdrawal',
        },
        include: {
          student: true,
          room: { include: { hostel: true } },
          request: true,
        },
      });

      if (cancelled.requestId) {
        await tx.hostelRequest.update({
          where: { id: cancelled.requestId },
          data: {
            status: 'CANCELLED',
            decisionDate: new Date(),
            decisionNote: reason || 'Cancelled by admin due to non-attendance or withdrawal',
            reviewedById: req.user.id,
          },
        });
      }

      await syncRoomAvailability(tx, allocation.roomId);
      return cancelled;
    });

    await logAudit({
      userId: req.user.id,
      action: 'CANCEL_ALLOCATION',
      entity: 'Allocation',
      entityId: allocation.id,
      details: `${allocation.student.studentId} - ${reason || 'non-attendance'}`,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listAllocations, createAllocation, checkIn, checkOut, transferAllocation, cancelAllocation };
