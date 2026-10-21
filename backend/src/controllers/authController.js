const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { isEmail, isPassword, isNonEmpty } = require('../utils/validation');

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

async function login(req, res) {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!isNonEmpty(usernameOrEmail) || !password) {
      return res.status(400).json({ message: 'Username/email and password are required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      },
      include: { student: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials or inactive account' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    await logAudit({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress: req.ip,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        student: user.student,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { student: true },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      student: user.student,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !isPassword(newPassword)) {
      return res.status(400).json({ message: 'Current password and a new password of at least 8 characters are required' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'New password must be different from the current password' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await logAudit({ userId: user.id, action: 'CHANGE_PASSWORD', entity: 'User', entityId: user.id });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;
    if (!isEmail(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    const user = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) {
      return res.json({ message: 'If the account exists, a reset token has been generated' });
    }

    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // No email/SMS in v1 — return token for demo/admin use
    res.json({
      message: 'Password reset token generated (demo mode — no email notifications)',
      resetToken: token,
      expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !isPassword(newPassword)) {
      return res.status(400).json({ message: 'Reset token and a new password of at least 8 characters are required' });
    }
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.used || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } }),
    ]);

    await logAudit({ userId: record.userId, action: 'RESET_PASSWORD', entity: 'User', entityId: record.userId });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function logout(req, res) {
  await logAudit({
    userId: req.user.id,
    action: 'LOGOUT',
    entity: 'User',
    entityId: req.user.id,
    ipAddress: req.ip,
  });
  res.json({ message: 'Logged out successfully' });
}

module.exports = {
  login,
  me,
  changePassword,
  requestPasswordReset,
  resetPassword,
  logout,
};
