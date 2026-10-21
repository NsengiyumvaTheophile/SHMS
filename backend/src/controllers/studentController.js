const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { generateCode, getStudentBalance } = require('../utils/helpers');
const { isEmail, isPassword, isPhone, isNonEmpty, isIntInRange, GENDERS } = require('../utils/validation');

async function listStudents(req, res) {
  try {
    const { q, status, hostelId, roomId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { studentId: { contains: q } },
        { registrationNo: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { phone: { contains: q } },
      ];
    }
    if (hostelId || roomId) {
      where.allocations = {
        some: {
          status: { in: ['ACTIVE', 'CHECKED_IN'] },
          ...(roomId ? { roomId: Number(roomId) } : {}),
          ...(hostelId ? { room: { hostelId: Number(hostelId) } } : {}),
        },
      };
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, username: true, isActive: true } },
        allocations: {
          where: { status: { in: ['ACTIVE', 'CHECKED_IN'] } },
          include: { room: { include: { hostel: true } } },
          take: 1,
          orderBy: { allocationDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getStudent(req, res) {
  try {
    const id = Number(req.params.id);
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, isActive: true } },
        hostelRequests: { orderBy: { requestDate: 'desc' } },
        allocations: {
          include: { room: { include: { hostel: true } }, checkIn: true, checkOut: true },
          orderBy: { allocationDate: 'desc' },
        },
        feeAssignments: { include: { fee: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
        maintenanceRequests: { orderBy: { submittedAt: 'desc' } },
      },
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (req.user.role === 'STUDENT' && req.student.id !== student.id) {
      return res.status(403).json({ message: 'You can only view your own profile' });
    }

    const balance = await getStudentBalance(prisma, student.id);
    res.json({ ...student, balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createStudent(req, res) {
  try {
    const {
      firstName,
      lastName,
      gender,
      phone,
      address,
      program,
      department,
      yearOfStudy,
      email,
      username,
      password,
      studentId,
      registrationNo,
    } = req.body;

    if (!isNonEmpty(firstName) || !isNonEmpty(lastName) || !gender || !isEmail(email) || !isPassword(password)) {
      return res.status(400).json({
        message: 'First name, last name, gender, a valid email, and a password of at least 8 characters are required',
      });
    }
    if (!GENDERS.includes(gender)) {
      return res.status(400).json({ message: 'Gender must be Male or Female' });
    }
    if (!isPhone(phone)) {
      return res.status(400).json({ message: 'Phone number format is invalid' });
    }
    if (yearOfStudy && !isIntInRange(Number(yearOfStudy), 1, 6)) {
      return res.status(400).json({ message: 'Year of study must be between 1 and 6' });
    }

    const sid = studentId || generateCode('STU');
    const reg = registrationNo || generateCode('REG');
    const uname = username || sid.toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: uname,
          email: email.trim(),
          passwordHash,
          role: 'STUDENT',
        },
      });
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: sid,
          registrationNo: reg,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          gender,
          phone: phone ? String(phone).trim() : null,
          address,
          program,
          department,
          yearOfStudy: yearOfStudy ? Number(yearOfStudy) : null,
        },
        include: { user: { select: { id: true, email: true, username: true } } },
      });
      return student;
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_STUDENT',
      entity: 'Student',
      entityId: result.id,
      details: `${result.firstName} ${result.lastName}`,
    });

    res.status(201).json(result);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Duplicate student ID, registration number, username, or email' });
    }
    res.status(500).json({ message: err.message });
  }
}

async function updateStudent(req, res) {
  try {
    const id = Number(req.params.id);
    const allowed = [
      'firstName',
      'lastName',
      'gender',
      'phone',
      'address',
      'program',
      'department',
      'yearOfStudy',
      'studentId',
      'registrationNo',
      'status',
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined && req.body[key] !== '') data[key] = req.body[key];
    }
    if (data.yearOfStudy !== undefined) {
      if (!isIntInRange(Number(data.yearOfStudy), 1, 6)) {
        return res.status(400).json({ message: 'Year of study must be between 1 and 6' });
      }
      data.yearOfStudy = Number(data.yearOfStudy);
    }
    if (data.gender && !GENDERS.includes(data.gender)) {
      return res.status(400).json({ message: 'Gender must be Male or Female' });
    }
    if (data.phone !== undefined && !isPhone(data.phone)) {
      return res.status(400).json({ message: 'Phone number format is invalid' });
    }

    const student = await prisma.student.update({ where: { id }, data });
    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: id,
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deactivateStudent(req, res) {
  try {
    const id = Number(req.params.id);
    const activeAllocation = await prisma.allocation.findFirst({
      where: { studentId: id, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
    });
    if (activeAllocation) {
      return res.status(400).json({
        message: 'This student still has an active room. Check them out before deactivating the account.',
      });
    }
    const student = await prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: false },
    });
    await logAudit({
      userId: req.user.id,
      action: 'DEACTIVATE_STUDENT',
      entity: 'Student',
      entityId: id,
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function activateStudent(req, res) {
  try {
    const id = Number(req.params.id);
    const student = await prisma.student.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
    await prisma.user.update({
      where: { id: student.userId },
      data: { isActive: true },
    });
    await logAudit({
      userId: req.user.id,
      action: 'ACTIVATE_STUDENT',
      entity: 'Student',
      entityId: id,
    });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function myProfile(req, res) {
  try {
    req.params.id = String(req.student.id);
    return getStudent(req, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  myProfile,
};
