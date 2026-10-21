function generateCode(prefix) {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `${prefix}-${ts}${rand}`;
}

async function getRoomOccupancy(prisma, roomId) {
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) return null;

  const occupied = await prisma.allocation.count({
    where: {
      roomId,
      status: { in: ['ACTIVE', 'CHECKED_IN'] },
    },
  });

  return {
    room,
    capacity: room.capacity,
    occupied,
    available: Math.max(room.capacity - occupied, 0),
    isFull: occupied >= room.capacity,
  };
}

async function syncRoomAvailability(client, roomId) {
  const room = await client.room.findUnique({ where: { id: roomId } });
  if (!room) return null;
  if (room.status === 'MAINTENANCE' || room.status === 'INACTIVE') return room;

  const occupied = await client.allocation.count({
    where: { roomId, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
  });

  return client.room.update({
    where: { id: roomId },
    data: { status: occupied >= room.capacity ? 'FULL' : 'AVAILABLE' },
  });
}

async function getStudentBalance(prisma, studentId) {
  const feeAssignments = await prisma.studentFee.findMany({
    where: { studentId },
    include: { fee: true },
  });
  const totalFee = feeAssignments.reduce((sum, a) => sum + a.fee.amount, 0);

  const payments = await prisma.payment.findMany({
    where: { studentId, status: 'CONFIRMED' },
  });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    totalFee,
    totalPaid,
    outstandingBalance: totalFee - totalPaid,
    feeAssignments,
    payments,
  };
}

module.exports = {
  generateCode,
  getRoomOccupancy,
  syncRoomAvailability,
  getStudentBalance,
};
