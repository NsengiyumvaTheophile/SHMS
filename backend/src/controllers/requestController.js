const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { generateCode } = require('../utils/helpers');

async function listRequests(req, res) {
  try {
    const { status, q } = req.query;
    const where = {};
    if (status) where.status = status;

    if (req.user.role === 'STUDENT') {
      where.studentId = req.student.id;
    }

    if (q) {
      where.OR = [
        { requestNumber: { contains: q } },
        { student: { firstName: { contains: q } } },
        { student: { lastName: { contains: q } } },
        { student: { studentId: { contains: q } } },
      ];
    }

    const requests = await prisma.hostelRequest.findMany({
      where,
      include: {
        student: true,
        preferredHostel: true,
        preferredRoom: { include: { hostel: true } },
        reviewedBy: { select: { id: true, username: true } },
        allocation: { include: { room: { include: { hostel: true } } } },
      },
      orderBy: { requestDate: 'desc' },
    });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createRequest(req, res) {
  try {
    const studentId = req.user.role === 'STUDENT' ? req.student.id : Number(req.body.studentId);
    const { preferredHostelId, preferredRoomId, reason } = req.body;

    if (!studentId || Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Student is required' });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ message: 'Please provide a reason for the hostel request' });
    }

    let hostelId = preferredHostelId ? Number(preferredHostelId) : null;
    let roomId = preferredRoomId ? Number(preferredRoomId) : null;

    if (hostelId) {
      const hostel = await prisma.hostel.findUnique({ where: { id: hostelId } });
      if (!hostel || !hostel.isActive) {
        return res.status(400).json({ message: 'Selected hostel is not available' });
      }
    }

    if (roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId }, include: { hostel: true } });
      if (!room) return res.status(400).json({ message: 'Selected room was not found' });
      if (room.status === 'INACTIVE' || room.status === 'MAINTENANCE') {
        return res.status(400).json({ message: 'Selected room is not available' });
      }
      if (hostelId && room.hostelId !== hostelId) {
        return res.status(400).json({ message: 'Selected room does not belong to the chosen hostel' });
      }
      hostelId = hostelId || room.hostelId;
    }

    const active = await prisma.hostelRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (active) {
      return res.status(400).json({
        message: 'You already have an active hostel request (Pending or Approved)',
      });
    }

    const activeAllocation = await prisma.allocation.findFirst({
      where: { studentId, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
    });
    if (activeAllocation) {
      return res.status(400).json({ message: 'Student already has an active room allocation' });
    }

    const request = await prisma.hostelRequest.create({
      data: {
        requestNumber: generateCode('HR'),
        studentId,
        preferredHostelId: hostelId,
        preferredRoomId: roomId,
        reason: reason ? String(reason).trim() : null,
        status: 'PENDING',
      },
      include: { student: true, preferredHostel: true, preferredRoom: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_HOSTEL_REQUEST',
      entity: 'HostelRequest',
      entityId: request.id,
      details: request.requestNumber,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function reviewRequest(req, res) {
  try {
    const id = Number(req.params.id);
    const { status, decisionNote } = req.body;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Status must be APPROVED or REJECTED' });
    }

    const existing = await prisma.hostelRequest.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Request not found' });
    if (existing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending requests can be reviewed' });
    }

    const request = await prisma.hostelRequest.update({
      where: { id },
      data: {
        status,
        decisionNote,
        decisionDate: new Date(),
        reviewedById: req.user.id,
      },
      include: {
        student: true,
        preferredHostel: true,
        reviewedBy: { select: { id: true, username: true } },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: status === 'APPROVED' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST',
      entity: 'HostelRequest',
      entityId: id,
      details: request.requestNumber,
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function cancelRequest(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.hostelRequest.findUnique({
      where: { id },
      include: { allocation: true },
    });
    if (!existing) return res.status(404).json({ message: 'Request not found' });

    if (req.user.role === 'STUDENT' && existing.studentId !== req.student.id) {
      return res.status(403).json({ message: 'You can only cancel your own request' });
    }

    if (existing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending requests can be cancelled' });
    }
    if (existing.allocation) {
      return res.status(400).json({ message: 'This request already has an allocation' });
    }

    const request = await prisma.hostelRequest.update({
      where: { id },
      data: { status: 'CANCELLED', decisionDate: new Date(), decisionNote: 'Cancelled by requester' },
      include: { student: true, preferredHostel: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CANCEL_HOSTEL_REQUEST',
      entity: 'HostelRequest',
      entityId: id,
      details: request.requestNumber,
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function cancelRequestByAdmin(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.hostelRequest.findUnique({
      where: { id },
      include: { allocation: true },
    });
    if (!existing) return res.status(404).json({ message: 'Request not found' });

    if (!['APPROVED', 'PENDING'].includes(existing.status)) {
      return res.status(400).json({ message: 'Only approved or pending requests can be cancelled by admin' });
    }

    const request = await prisma.$transaction(async (tx) => {
      if (existing.allocation) {
        await tx.allocation.update({
          where: { id: existing.allocation.id },
          data: { status: 'CANCELLED', notes: 'Cancelled by admin due to non-attendance or withdrawal' },
        });
      }

      return tx.hostelRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          decisionDate: new Date(),
          decisionNote: 'Cancelled by admin due to non-attendance or withdrawal',
          reviewedById: req.user.id,
        },
        include: { student: true, preferredHostel: true, allocation: true },
      });
    });

    await logAudit({
      userId: req.user.id,
      action: 'ADMIN_CANCEL_REQUEST',
      entity: 'HostelRequest',
      entityId: id,
      details: request.requestNumber,
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listRequests, createRequest, reviewRequest, cancelRequest, cancelRequestByAdmin };
