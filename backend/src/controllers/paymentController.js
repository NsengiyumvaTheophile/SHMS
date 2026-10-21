const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { getStudentBalance } = require('../utils/helpers');
const { isPositiveNumber, PAYMENT_METHODS } = require('../utils/validation');

async function listPayments(req, res) {
  try {
    const { studentId, q } = req.query;
    const where = {};
    if (req.user.role === 'STUDENT') {
      where.studentId = req.student.id;
    } else if (studentId) {
      where.studentId = Number(studentId);
    }
    if (q) {
      where.OR = [
        { referenceNumber: { contains: q } },
        { student: { firstName: { contains: q } } },
        { student: { lastName: { contains: q } } },
        { student: { studentId: { contains: q } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: true,
        recordedBy: { select: { id: true, username: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Manual payment verification & recording only.
 * No online gateway. No payment-proof upload.
 * Admin verifies physical proof outside the system, then records here.
 */
async function recordPayment(req, res) {
  try {
    const { studentId, amount, paymentDate, paymentMethod, referenceNumber, notes } = req.body;
    if (!studentId || amount === undefined || !paymentMethod) {
      return res.status(400).json({ message: 'studentId, amount and paymentMethod are required' });
    }
    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ message: 'Amount must be greater than zero' });
    }
    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const current = await getStudentBalance(prisma, Number(studentId));
    if (current.totalFee <= 0) {
      return res.status(400).json({ message: 'No hostel fee is assigned to this student yet' });
    }
    if (Number(amount) - current.outstandingBalance > 0.009) {
      return res.status(400).json({
        message: `Amount exceeds outstanding balance (${current.outstandingBalance} RWF)`,
      });
    }

    const payment = await prisma.payment.create({
      data: {
        studentId: Number(studentId),
        amount: Number(amount),
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod,
        referenceNumber,
        notes,
        recordedById: req.user.id,
        status: 'CONFIRMED',
      },
      include: {
        student: true,
        recordedBy: { select: { id: true, username: true } },
      },
    });

    const balance = await getStudentBalance(prisma, Number(studentId));

    await logAudit({
      userId: req.user.id,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment.id,
      details: `Amount ${amount} for student ${student.studentId}`,
    });

    res.status(201).json({ payment, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listPayments, recordPayment };
