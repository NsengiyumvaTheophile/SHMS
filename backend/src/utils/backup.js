const fs = require('fs');
const path = require('path');

function createBackup() {
  const dbPath = path.join(__dirname, '../../prisma/dev.db');
  const backupDir = path.resolve(process.env.BACKUP_DIR || path.join(__dirname, '../../backups'));

  if (!fs.existsSync(dbPath)) {
    console.error('Database file not found:', dbPath);
    process.exit(1);
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupDir, `shms-backup-${stamp}.db`);
  fs.copyFileSync(dbPath, dest);
  console.log('Backup created:', dest);
  return dest;
}

if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
