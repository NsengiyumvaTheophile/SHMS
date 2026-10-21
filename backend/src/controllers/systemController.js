const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prisma');
const { logAudit } = require('../utils/audit');
const { createBackup } = require('../utils/backup');

async function listAuditLogs(req, res) {
  try {
    const { q, limit } = req.query;
    const where = q
      ? {
          OR: [
            { action: { contains: q } },
            { entity: { contains: q } },
            { details: { contains: q } },
          ],
        }
      : {};
    const logs = await prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, username: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: Number(limit) || 200,
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listSettings(req, res) {
  try {
    const settings = await prisma.systemSetting.findMany();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function upsertSetting(req, res) {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ message: 'key is required' });
    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_SETTING',
      entity: 'SystemSetting',
      entityId: setting.id,
      details: key,
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function backupDatabase(req, res) {
  try {
    const dest = createBackup();
    await logAudit({
      userId: req.user.id,
      action: 'DATABASE_BACKUP',
      entity: 'System',
      details: dest,
    });
    res.json({ message: 'Backup created successfully', path: dest });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function listBackups(req, res) {
  try {
    const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../backups'));
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const full = path.join(backupDir, f);
        const stat = fs.statSync(full);
        return { name: f, size: stat.size, createdAt: stat.mtime };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function restoreBackup(req, res) {
  try {
    const { fileName } = req.body;
    if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ message: 'Invalid backup file name' });
    }
    const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../backups'));
    const src = path.join(backupDir, fileName);
    const dbPath = path.join(__dirname, '../../prisma/dev.db');
    if (!fs.existsSync(src)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    // Safety backup before restore
    createBackup();
    fs.copyFileSync(src, dbPath);

    await logAudit({
      userId: req.user.id,
      action: 'DATABASE_RESTORE',
      entity: 'System',
      details: fileName,
    });

    res.json({
      message: 'Database restored. Restart the server to ensure a clean connection.',
      restoredFrom: fileName,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  listAuditLogs,
  listSettings,
  upsertSetting,
  backupDatabase,
  listBackups,
  restoreBackup,
};
