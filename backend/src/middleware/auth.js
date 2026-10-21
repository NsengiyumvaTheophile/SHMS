const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied for this role' });
    }
    next();
  };
}

async function attachStudent(req, res, next) {
  if (req.user.role !== 'STUDENT') return next();
  const student = await prisma.student.findUnique({ where: { userId: req.user.id } });
  if (!student) {
    return res.status(403).json({ message: 'Student profile not found' });
  }
  req.student = student;
  next();
}

module.exports = { authenticate, authorize, attachStudent };
