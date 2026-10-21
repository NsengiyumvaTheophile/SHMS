const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { generateCode } = require('../utils/helpers');
const { isNonEmpty, MAINTENANCE_STATUSES } = require('../utils/validation');

async function listMaintenance(req, res) {
  try {
    const { status, q } = req.query;
    const where = {};
    if (status) where.status = status;
    if (req.user.role === 'STUDENT') where.studentId = req.student.id;
    if (q) {
      where.OR = [
        { requestNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const items = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        student: true,
        handledBy: { select: { id: true, username: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function createMaintenance(req, res) {
  try {
    const studentId = req.user.role === 'STUDENT' ? req.student.id : Number(req.body.studentId);
    const { title, description } = req.body;
    if (!studentId || Number.isNaN(studentId)) {
      return res.status(400).json({ message: 'Student is required' });
    }
    if (!isNonEmpty(title, 3) || !isNonEmpty(description, 8)) {
      return res.status(400).json({ message: 'Provide a title and a clear description of the problem' });
    }
    const allocated = await prisma.allocation.findFirst({
      where: { studentId, status: { in: ['ACTIVE', 'CHECKED_IN'] } },
    });
    if (req.user.role === 'STUDENT' && !allocated) {
      return res.status(400).json({ message: 'You can submit maintenance after you have been allocated a room' });
    }

    const item = await prisma.maintenanceRequest.create({
      data: {
        requestNumber: generateCode('MR'),
        studentId,
        title: title.trim(),
        description: description.trim(),
        status: 'PENDING',
      },
      include: { student: true },
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_MAINTENANCE',
      entity: 'MaintenanceRequest',
      entityId: item.id,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateMaintenance(req, res) {
  try {
    const id = Number(req.params.id);
    const { status, actionsTaken } = req.body;
    if (status && !MAINTENANCE_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid maintenance status' });
    }
    if (status === 'COMPLETED' && !isNonEmpty(actionsTaken, 3)) {
      return res.status(400).json({ message: 'Describe the actions taken before marking maintenance as completed' });
    }
    const data = {};
    if (status) data.status = status;
    if (actionsTaken !== undefined) data.actionsTaken = actionsTaken;
    data.handledById = req.user.id;
    if (status === 'COMPLETED') data.completedAt = new Date();

    const item = await prisma.maintenanceRequest.update({
      where: { id },
      data,
      include: {
        student: true,
        handledBy: { select: { id: true, username: true } },
      },
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_MAINTENANCE',
      entity: 'MaintenanceRequest',
      entityId: id,
      details: status || '',
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { listMaintenance, createMaintenance, updateMaintenance };
