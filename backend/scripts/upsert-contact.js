const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = [
    { key: 'admin_office', value: 'Hostel Administration Office, RP Musanze College' },
    { key: 'admin_phone', value: '+250 788 300 000' },
    { key: 'admin_email', value: 'hosteladmin@rpmusanze.ac.rw' },
    { key: 'admin_hours', value: 'Monday–Friday, 08:00–17:00' },
  ];
  for (const r of rows) {
    await prisma.systemSetting.upsert({
      where: { key: r.key },
      update: { value: r.value },
      create: r,
    });
  }
  console.log('Contact settings upserted');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
