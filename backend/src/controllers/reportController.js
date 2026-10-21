const prisma = require('../utils/prisma');
const { getRoomOccupancy, getStudentBalance } = require('../utils/helpers');

async function generateReport(req, res) {
  try {
    const { type } = req.params;
    const { status, hostelId, from, to } = req.query;
    const dateFilter = {};
    if (from || to) {
      dateFilter.gte = from ? new Date(from) : undefined;
      dateFilter.lte = to ? new Date(to) : undefined;
    }

    switch (type) {
      case 'students': {
        const data = await prisma.student.findMany({
          where: status ? { status } : {},
          include: { user: { select: { email: true, username: true } } },
          orderBy: { lastName: 'asc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'hostels': {
        const data = await prisma.hostel.findMany({ include: { _count: { select: { rooms: true } } } });
        return res.json({ type, count: data.length, data });
      }
      case 'rooms': {
        const rooms = await prisma.room.findMany({
          where: hostelId ? { hostelId: Number(hostelId) } : {},
          include: { hostel: true },
        });
        const data = await Promise.all(
          rooms.map(async (r) => {
            const occ = await getRoomOccupancy(prisma, r.id);
            return { ...r, occupied: occ.occupied, available: occ.available };
          })
        );
        return res.json({ type, count: data.length, data });
      }
      case 'requests':
      case 'approved-requests':
      case 'rejected-requests': {
        const s =
          type === 'approved-requests'
            ? 'APPROVED'
            : type === 'rejected-requests'
              ? 'REJECTED'
              : status;
        const data = await prisma.hostelRequest.findMany({
          where: {
            ...(s ? { status: s } : {}),
            ...(from || to ? { requestDate: dateFilter } : {}),
          },
          include: { student: true, preferredHostel: true, reviewedBy: { select: { username: true } } },
          orderBy: { requestDate: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'occupancy': {
        const rooms = await prisma.room.findMany({
          where: hostelId ? { hostelId: Number(hostelId) } : {},
          include: { hostel: true },
        });
        const data = await Promise.all(
          rooms.map(async (r) => {
            const occ = await getRoomOccupancy(prisma, r.id);
            return {
              hostel: r.hostel.name,
              roomNumber: r.roomNumber,
              capacity: occ.capacity,
              occupied: occ.occupied,
              available: occ.available,
              status: occ.isFull ? 'FULL' : 'AVAILABLE',
            };
          })
        );
        return res.json({ type, count: data.length, data });
      }
      case 'allocations': {
        const data = await prisma.allocation.findMany({
          where: {
            ...(status ? { status } : {}),
            ...(hostelId ? { room: { hostelId: Number(hostelId) } } : {}),
          },
          include: { student: true, room: { include: { hostel: true } } },
          orderBy: { allocationDate: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'check-ins': {
        const data = await prisma.checkIn.findMany({
          include: {
            allocation: {
              include: { student: true, room: { include: { hostel: true } } },
            },
          },
          orderBy: { checkInDate: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'check-outs': {
        const data = await prisma.checkOut.findMany({
          include: {
            allocation: {
              include: { student: true, room: { include: { hostel: true } } },
            },
          },
          orderBy: { checkOutDate: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'fees': {
        const data = await prisma.hostelFee.findMany({ include: { hostel: true, assignments: true } });
        return res.json({ type, count: data.length, data });
      }
      case 'payments': {
        const data = await prisma.payment.findMany({
          where: from || to ? { paymentDate: dateFilter } : {},
          include: { student: true, recordedBy: { select: { username: true } } },
          orderBy: { paymentDate: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'outstanding': {
        const students = await prisma.student.findMany({ where: { status: 'ACTIVE' } });
        const data = [];
        for (const s of students) {
          const bal = await getStudentBalance(prisma, s.id);
          if (bal.outstandingBalance > 0) {
            data.push({
              studentId: s.studentId,
              name: `${s.firstName} ${s.lastName}`,
              totalFee: bal.totalFee,
              totalPaid: bal.totalPaid,
              outstandingBalance: bal.outstandingBalance,
            });
          }
        }
        return res.json({ type, count: data.length, data });
      }
      case 'maintenance': {
        const data = await prisma.maintenanceRequest.findMany({
          where: status ? { status } : {},
          include: { student: true, handledBy: { select: { username: true } } },
          orderBy: { submittedAt: 'desc' },
        });
        return res.json({ type, count: data.length, data });
      }
      case 'statistics': {
        const totalStudents = await prisma.student.count();
        const totalHostels = await prisma.hostel.count();
        const totalRooms = await prisma.room.count();
        return res.json({
          type,
          data: { totalStudents, totalHostels, totalRooms },
        });
      }
      default:
        return res.status(400).json({
          message:
            'Unknown report type. Use: students, hostels, rooms, requests, approved-requests, rejected-requests, occupancy, allocations, check-ins, check-outs, fees, payments, outstanding, maintenance, statistics',
        });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { generateReport };
