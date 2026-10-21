const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { getRoomOccupancy, syncRoomAvailability } = require('../utils/helpers');

async function listRooms(req, res) {
  try {
    const { hostelId, status, availableOnly } = req.query;
    const where = {};
    if (hostelId) where.hostelId = Number(hostelId);
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        hostel: true,
        allocations: {
          where: { status: { in: ['ACTIVE', 'CHECKED_IN'] } },
          include: {
            student: { select: { id: true, studentId: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ hostelId: 'asc' }, { roomNumber: 'asc' }],
    });

    let result = await Promise.all(
      rooms.map(async (room) => {
        const occ = await getRoomOccupancy(prisma, room.id);
        return {
          ...room,
          occupied: occ.occupied,
          available: occ.available,
          isFull: occ.isFull,
        };
      })
    );

    if (availableOnly === 'true') {
      result = result.filter((r) => r.available > 0 && r.status !== 'INACTIVE' && r.status !== 'MAINTENANCE');
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getRoom(req, res) {
  try {
    const id = Number(req.params.id);
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hostel: true,
        allocations: {
          where: { status: { in: ['ACTIVE', 'CHECKED_IN'] } },
          include: { student: true },
        },
      },
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const occ = await getRoomOccupancy(prisma, id);
    res.json({ ...room, occupied: occ.occupied, available: occ.available, isFull: occ.isFull });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createRoom(req, res) {
  try {
    const { hostelId, roomNumber, capacity, status } = req.body;
    if (!hostelId || !String(roomNumber || '').trim() || !capacity) {
      return res.status(400).json({ message: 'hostelId, roomNumber and capacity are required' });
    }
    if (!Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
      return res.status(400).json({ message: 'Capacity must be a whole number of at least 1' });
    }
    const hostel = await prisma.hostel.findUnique({ where: { id: Number(hostelId) } });
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });
    if (!hostel.isActive) return res.status(400).json({ message: 'Cannot add a room to an inactive hostel' });
    const allowedStatus = ['AVAILABLE', 'MAINTENANCE', 'INACTIVE', 'FULL'];
    if (status && !allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Invalid room status' });
    }

    const room = await prisma.room.create({
      data: {
        hostelId: Number(hostelId),
        roomNumber: String(roomNumber).trim(),
        capacity: Number(capacity),
        status: status || 'AVAILABLE',
      },
      include: { hostel: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_ROOM',
      entity: 'Room',
      entityId: room.id,
      details: `${room.hostel.name} - ${room.roomNumber}`,
    });

    res.status(201).json(room);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Room number already exists in this hostel' });
    }
    res.status(500).json({ message: err.message });
  }
}

async function updateRoom(req, res) {
  try {
    const id = Number(req.params.id);
    const data = {};
    for (const key of ['hostelId', 'roomNumber', 'capacity', 'status']) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    if (data.capacity !== undefined) {
      data.capacity = Number(data.capacity);
      const occ = await getRoomOccupancy(prisma, id);
      if (data.capacity < occ.occupied) {
        return res.status(400).json({
          message: `Cannot set capacity below current occupancy (${occ.occupied})`,
        });
      }
    }
    if (data.hostelId !== undefined) data.hostelId = Number(data.hostelId);

    const room = await prisma.room.update({ where: { id }, data, include: { hostel: true } });
    if (data.capacity !== undefined && room.status !== 'MAINTENANCE' && room.status !== 'INACTIVE') {
      await syncRoomAvailability(prisma, id);
    }
    await logAudit({ userId: req.user.id, action: 'UPDATE_ROOM', entity: 'Room', entityId: id });
    const occ = await getRoomOccupancy(prisma, id);
    res.json({ ...room, occupied: occ.occupied, available: occ.available, isFull: occ.isFull });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Room number already exists in this hostel' });
    }
    res.status(500).json({ message: err.message });
  }
}

async function deleteRoom(req, res) {
  try {
    const id = Number(req.params.id);
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hostel: true,
        _count: { select: { allocations: true, requests: true } },
      },
    });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const occupied = await prisma.allocation.count({
      where: { roomId: id, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
    });
    if (occupied > 0) {
      return res.status(400).json({
        message: `Cannot delete room ${room.roomNumber}. ${occupied} student(s) are still assigned. Move them first.`,
      });
    }

    if (room._count.allocations > 0 || room._count.requests > 0) {
      await prisma.room.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
      if (room._count.requests > 0) {
        await prisma.hostelRequest.updateMany({
          where: { preferredRoomId: id },
          data: { preferredRoomId: null },
        });
      }

      await logAudit({
        userId: req.user.id,
        action: 'DEACTIVATE_ROOM',
        entity: 'Room',
        entityId: id,
        details: `${room.hostel.name} - ${room.roomNumber} (history preserved as inactive)`,
      });

      return res.json({
        message: `Room ${room.roomNumber} was deactivated because it has historical allocation data.`,
      });
    }

    await prisma.room.delete({ where: { id } });
    await logAudit({
      userId: req.user.id,
      action: 'DELETE_ROOM',
      entity: 'Room',
      entityId: id,
      details: `${room.hostel.name} - ${room.roomNumber}`,
    });
    res.json({ message: `Room ${room.roomNumber} deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listRooms, getRoom, createRoom, updateRoom, deleteRoom };
