const prisma = require('../utils/prisma');
const { getRoomOccupancy, getStudentBalance } = require('../utils/helpers');

async function adminDashboard(req, res) {
  try {
    const [
      totalStudents,
      totalHostels,
      rooms,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      checkedIn,
      checkedOut,
      pendingMaintenance,
      fees,
      payments,
    ] = await Promise.all([
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.hostel.count({ where: { isActive: true } }),
      prisma.room.findMany(),
      prisma.hostelRequest.count({ where: { status: 'PENDING' } }),
      prisma.hostelRequest.count({ where: { status: 'APPROVED' } }),
      prisma.hostelRequest.count({ where: { status: 'REJECTED' } }),
      prisma.allocation.count({ where: { status: 'CHECKED_IN' } }),
      prisma.allocation.count({ where: { status: 'CHECKED_OUT' } }),
      prisma.maintenanceRequest.count({ where: { status: 'PENDING' } }),
      prisma.studentFee.findMany({ include: { fee: true } }),
      prisma.payment.findMany({ where: { status: 'CONFIRMED' } }),
    ]);

    let totalCapacity = 0;
    let occupiedSpaces = 0;
    for (const room of rooms) {
      const occ = await getRoomOccupancy(prisma, room.id);
      totalCapacity += occ.capacity;
      occupiedSpaces += occ.occupied;
    }

    const totalFees = fees.reduce((s, a) => s + a.fee.amount, 0);
    const totalPayments = payments.reduce((s, p) => s + p.amount, 0);

    res.json({
      totalStudents,
      totalHostels,
      totalRooms: rooms.length,
      totalCapacity,
      occupiedSpaces,
      availableSpaces: totalCapacity - occupiedSpaces,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      checkedIn,
      checkedOut,
      totalFees,
      totalPayments,
      outstandingBalances: totalFees - totalPayments,
      pendingMaintenance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function studentDashboard(req, res) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.student.id },
    });

    const [latestRequest, allocation, maintenance, balance] = await Promise.all([
      prisma.hostelRequest.findFirst({
        where: { studentId: student.id },
        orderBy: { requestDate: 'desc' },
        include: { preferredHostel: true },
      }),
      prisma.allocation.findFirst({
        where: { studentId: student.id, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
        include: { room: { include: { hostel: true } }, checkIn: true },
        orderBy: { allocationDate: 'desc' },
      }),
      prisma.maintenanceRequest.findMany({
        where: { studentId: student.id },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
      getStudentBalance(prisma, student.id),
    ]);

    res.json({
      student,
      latestRequest,
      allocation,
      hostel: allocation?.room?.hostel || null,
      room: allocation?.room || null,
      fees: balance.totalFee,
      amountPaid: balance.totalPaid,
      outstandingBalance: balance.outstandingBalance,
      maintenance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { adminDashboard, studentDashboard };
