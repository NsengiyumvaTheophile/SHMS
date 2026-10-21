const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { isEmail, isPassword, isNonEmpty } = require('../utils/validation');

async function listUsers(req, res) {
  try {
    const { q, role } = req.query;
    const where = {};
    if (role) where.role = role;
    if (q) {
      where.OR = [
        { username: { contains: q } },
        { email: { contains: q } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, password, role } = req.body;
    if (!isNonEmpty(username, 3) || !isEmail(email) || !isPassword(password) || !role) {
      return res.status(400).json({
        message: 'Username (3+ characters), a valid email, a password of at least 8 characters, and a role are required',
      });
    }
    if (!['SYSTEM_ADMIN', 'HOSTEL_ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Create student accounts from the Students page so a student profile is created' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, role },
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
      details: `Created ${role} user ${username}`,
    });

    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
}

async function updateUser(req, res) {
  try {
    const id = Number(req.params.id);
    const { email, role, isActive, password } = req.body;
    if (id === req.user.id && isActive === false) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    if (email !== undefined && !isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (password && !isPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (role && !['SYSTEM_ADMIN', 'HOSTEL_ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role' });
    }
    if (isActive === false) {
      const target = await prisma.user.findUnique({ where: { id } });
      if (target?.role === 'SYSTEM_ADMIN') {
        const remaining = await prisma.user.count({
          where: { role: 'SYSTEM_ADMIN', isActive: true, id: { not: id } },
        });
        if (remaining < 1) {
          return res.status(400).json({ message: 'Keep at least one active system administrator' });
        }
      }
    }
    const data = {};
    if (email !== undefined) data.email = email.trim();
    if (role !== undefined) data.role = role;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, email: true, role: true, isActive: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: id,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listUsers, createUser, updateUser };
