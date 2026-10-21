const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { getRoomOccupancy } = require('../utils/helpers');
const { isNonEmpty } = require('../utils/validation');

async function listHostels(req, res) {
  try {
    const { activeOnly } = req.query;
    const where = activeOnly === 'true' ? { isActive: true } : {};
    const hostels = await prisma.hostel.findMany({
      where,
      include: { rooms: true, _count: { select: { rooms: true } } },
      orderBy: { name: 'asc' },
    });

    const withOccupancy = await Promise.all(
      hostels.map(async (h) => {
        let capacity = 0;
        let occupied = 0;
        for (const room of h.rooms) {
          const occ = await getRoomOccupancy(prisma, room.id);
          capacity += occ.capacity;
          occupied += occ.occupied;
        }
        return {
          ...h,
          rooms: undefined,
          roomCount: h._count.rooms,
          capacity,
          occupied,
          available: capacity - occupied,
        };
      })
    );

    res.json(withOccupancy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getHostel(req, res) {
  try {
    const id = Number(req.params.id);
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    const rooms = await Promise.all(
      hostel.rooms.map(async (room) => {
        const occ = await getRoomOccupancy(prisma, room.id);
        return { ...room, occupied: occ.occupied, available: occ.available, isFull: occ.isFull };
      })
    );

    res.json({ ...hostel, rooms });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createHostel(req, res) {
  try {
    const { name, location, description } = req.body;
    if (!isNonEmpty(name, 2)) return res.status(400).json({ message: 'Hostel name is required' });
    const hostel = await prisma.hostel.create({
      data: {
        name: name.trim(),
        location: location ? String(location).trim() : null,
        description: description ? String(description).trim() : null,
      },
    });
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_HOSTEL',
      entity: 'Hostel',
      entityId: hostel.id,
      details: name,
    });
    res.status(201).json(hostel);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'Hostel name already exists' });
    res.status(500).json({ message: err.message });
  }
}

async function updateHostel(req, res) {
  try {
    const id = Number(req.params.id);
    const data = {};
    for (const key of ['name', 'location', 'description', 'isActive']) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const hostel = await prisma.hostel.update({ where: { id }, data });
    await logAudit({ userId: req.user.id, action: 'UPDATE_HOSTEL', entity: 'Hostel', entityId: id });
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteHostel(req, res) {
  try {
    const id = Number(req.params.id);
    const hostel = await prisma.hostel.findUnique({
      where: { id },
      include: { rooms: true },
    });
    if (!hostel) return res.status(404).json({ message: 'Hostel not found' });

    for (const room of hostel.rooms) {
      const occ = await getRoomOccupancy(prisma, room.id);
      if (occ.occupied > 0) {
        return res.status(400).json({
          message: `Cannot delete ${hostel.name}. Room ${room.roomNumber} still has assigned students.`,
        });
      }
    }

    const allocationHistory = await prisma.allocation.count({
      where: { room: { hostelId: id } },
    });
    if (allocationHistory > 0) {
      await prisma.hostel.update({
        where: { id },
        data: { isActive: false },
      });
      await prisma.room.updateMany({
        where: { hostelId: id },
        data: { status: 'INACTIVE' },
      });
      await prisma.hostelRequest.updateMany({
        where: { preferredHostelId: id },
        data: { preferredHostelId: null },
      });
      await prisma.hostelFee.updateMany({
        where: { hostelId: id },
        data: { hostelId: null },
      });

      await logAudit({
        userId: req.user.id,
        action: 'DEACTIVATE_HOSTEL',
        entity: 'Hostel',
        entityId: id,
        details: `${hostel.name} - deactivated after allocation history`,
      });
      return res.json({ message: `${hostel.name} was deactivated because it has allocation history.`, });
    }

    await prisma.hostelRequest.updateMany({
      where: { preferredHostelId: id },
      data: { preferredHostelId: null },
    });
    await prisma.hostelFee.updateMany({
      where: { hostelId: id },
      data: { hostelId: null },
    });
    await prisma.room.deleteMany({ where: { hostelId: id } });
    await prisma.hostel.delete({ where: { id } });

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_HOSTEL',
      entity: 'Hostel',
      entityId: id,
      details: hostel.name,
    });
    res.json({ message: `${hostel.name} deleted` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listHostels, getHostel, createHostel, updateHostel, deleteHostel };
