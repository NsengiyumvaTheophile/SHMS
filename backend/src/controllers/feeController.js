const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { getStudentBalance } = require('../utils/helpers');
const { isNonEmpty, isPositiveNumber } = require('../utils/validation');

async function listFees(req, res) {
  try {
    const fees = await prisma.hostelFee.findMany({
      include: { hostel: true, _count: { select: { assignments: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(fees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createFee(req, res) {
  try {
    const { name, amount, hostelId, academicYear, description } = req.body;
    if (!isNonEmpty(name) || !isPositiveNumber(amount)) {
      return res.status(400).json({ message: 'Fee name and an amount greater than zero are required' });
    }
    const fee = await prisma.hostelFee.create({
      data: {
        name,
        amount: Number(amount),
        hostelId: hostelId ? Number(hostelId) : null,
        academicYear,
        description,
      },
    });
    await logAudit({
      userId: req.user.id,
      action: 'CREATE_FEE',
      entity: 'HostelFee',
      entityId: fee.id,
    });
    res.status(201).json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateFee(req, res) {
  try {
    const id = Number(req.params.id);
    const data = { ...req.body };
    if (data.amount !== undefined) {
      if (!isPositiveNumber(data.amount)) {
        return res.status(400).json({ message: 'Fee amount must be greater than zero' });
      }
      data.amount = Number(data.amount);
    }
    if (data.hostelId !== undefined) data.hostelId = data.hostelId ? Number(data.hostelId) : null;
    const fee = await prisma.hostelFee.update({ where: { id }, data });
    await logAudit({ userId: req.user.id, action: 'UPDATE_FEE', entity: 'HostelFee', entityId: id });
    res.json(fee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function assignFee(req, res) {
  try {
    const { studentId, feeId, notes } = req.body;
    if (!studentId || !feeId) {
      return res.status(400).json({ message: 'studentId and feeId are required' });
    }
    const student = await prisma.student.findUnique({ where: { id: Number(studentId) } });
    const fee = await prisma.hostelFee.findUnique({ where: { id: Number(feeId) } });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Cannot assign a fee to an inactive student' });
    }
    if (!fee) return res.status(404).json({ message: 'Fee not found' });
    if (!fee.isActive) return res.status(400).json({ message: 'This fee is inactive' });
    const assignment = await prisma.studentFee.create({
      data: {
        studentId: Number(studentId),
        feeId: Number(feeId),
        notes,
      },
      include: { fee: true, student: true },
    });
    await logAudit({
      userId: req.user.id,
      action: 'ASSIGN_FEE',
      entity: 'StudentFee',
      entityId: assignment.id,
    });
    res.status(201).json(assignment);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'This fee is already assigned to the student' });
    }
    res.status(500).json({ message: err.message });
  }
}

async function studentAccount(req, res) {
  try {
    const studentId =
      req.user.role === 'STUDENT' ? req.student.id : Number(req.params.studentId || req.query.studentId);
    if (!studentId) return res.status(400).json({ message: 'studentId is required' });

    if (req.user.role === 'STUDENT' && req.student.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const balance = await getStudentBalance(prisma, studentId);
    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listFees, createFee, updateFee, assignFee, studentAccount };
