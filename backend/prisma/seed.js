const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SHMS database...');

  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.studentFee.deleteMany();
  await prisma.hostelFee.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.checkOut.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.hostelRequest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostel.deleteMany();
  await prisma.student.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const systemAdmin = await prisma.user.create({
    data: {
      username: 'sysadmin',
      email: 'sysadmin@rpmusanze.ac.rw',
      passwordHash,
      role: 'SYSTEM_ADMIN',
    },
  });

  const hostelAdmin = await prisma.user.create({
    data: {
      username: 'hosteladmin',
      email: 'hosteladmin@rpmusanze.ac.rw',
      passwordHash,
      role: 'HOSTEL_ADMIN',
    },
  });

  const studentUser1 = await prisma.user.create({
    data: {
      username: 'student1',
      email: 'student1@student.rpmusanze.ac.rw',
      passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          studentId: 'STU-001',
          registrationNo: 'REG-2026-001',
          firstName: 'Jean',
          lastName: 'Uwimana',
          gender: 'Male',
          phone: '0788000001',
          address: 'Musanze',
          program: 'Information Technology',
          department: 'ICT',
          yearOfStudy: 2,
        },
      },
    },
    include: { student: true },
  });

  const studentUser2 = await prisma.user.create({
    data: {
      username: 'student2',
      email: 'student2@student.rpmusanze.ac.rw',
      passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          studentId: 'STU-002',
          registrationNo: 'REG-2026-002',
          firstName: 'Aline',
          lastName: 'Mukamana',
          gender: 'Female',
          phone: '0788000002',
          address: 'Musanze',
          program: 'Civil Engineering',
          department: 'Engineering',
          yearOfStudy: 1,
        },
      },
    },
    include: { student: true },
  });

  const studentUser3 = await prisma.user.create({
    data: {
      username: 'student3',
      email: 'student3@student.rpmusanze.ac.rw',
      passwordHash,
      role: 'STUDENT',
      student: {
        create: {
          studentId: 'STU-003',
          registrationNo: 'REG-2026-003',
          firstName: 'Eric',
          lastName: 'Niyonsenga',
          gender: 'Male',
          phone: '0788000003',
          program: 'Business Management',
          department: 'Business',
          yearOfStudy: 3,
        },
      },
    },
    include: { student: true },
  });

  const boysHostel = await prisma.hostel.create({
    data: {
      name: 'Muhabura Boys Hostel',
      location: 'RP Musanze Main Campus',
      description: 'Male student accommodation',
    },
  });

  const girlsHostel = await prisma.hostel.create({
    data: {
      name: 'Sabyinyo Girls Hostel',
      location: 'RP Musanze Main Campus',
      description: 'Female student accommodation',
    },
  });

  const rooms = await Promise.all([
    prisma.room.create({ data: { hostelId: boysHostel.id, roomNumber: 'B101', capacity: 4 } }),
    prisma.room.create({ data: { hostelId: boysHostel.id, roomNumber: 'B102', capacity: 2 } }),
    prisma.room.create({ data: { hostelId: boysHostel.id, roomNumber: 'B103', capacity: 4 } }),
    prisma.room.create({ data: { hostelId: girlsHostel.id, roomNumber: 'G101', capacity: 4 } }),
    prisma.room.create({ data: { hostelId: girlsHostel.id, roomNumber: 'G102', capacity: 3 } }),
  ]);

  const feeBoys = await prisma.hostelFee.create({
    data: {
      name: 'Boys Hostel Semester Fee',
      amount: 50000,
      hostelId: boysHostel.id,
      academicYear: '2025/2026',
      description: 'Standard hostel fee for male hostel',
    },
  });

  const feeGirls = await prisma.hostelFee.create({
    data: {
      name: 'Girls Hostel Semester Fee',
      amount: 50000,
      hostelId: girlsHostel.id,
      academicYear: '2025/2026',
      description: 'Standard hostel fee for female hostel',
    },
  });

  await prisma.studentFee.create({
    data: { studentId: studentUser1.student.id, feeId: feeBoys.id },
  });

  await prisma.payment.create({
    data: {
      studentId: studentUser1.student.id,
      amount: 10000,
      paymentMethod: 'MOBILE_MONEY',
      referenceNumber: 'MOMO-DEMO-001',
      notes: 'Manually verified payment proof',
      recordedById: hostelAdmin.id,
      status: 'CONFIRMED',
    },
  });

  await prisma.hostelRequest.create({
    data: {
      requestNumber: 'HR-SEED0001',
      studentId: studentUser2.student.id,
      preferredHostelId: girlsHostel.id,
      reason: 'Need campus accommodation',
      status: 'PENDING',
    },
  });

  await prisma.hostelRequest.create({
    data: {
      requestNumber: 'HR-SEED0002',
      studentId: studentUser3.student.id,
      preferredHostelId: boysHostel.id,
      reason: 'Approved for room allocation demo',
      status: 'APPROVED',
      decisionDate: new Date(),
      reviewedById: hostelAdmin.id,
      decisionNote: 'Approved for hostel placement',
    },
  });

  await prisma.systemSetting.createMany({
    data: [
      { key: 'institution_name', value: 'RP Musanze College' },
      { key: 'system_name', value: 'Student Hostel Management System' },
      { key: 'academic_year', value: '2025/2026' },
      { key: 'backup_retention_days', value: '30' },
      { key: 'admin_office', value: 'Hostel Administration Office, RP Musanze College' },
      { key: 'admin_phone', value: '+250 788 300 000' },
      { key: 'admin_email', value: 'hosteladmin@rpmusanze.ac.rw' },
      { key: 'admin_hours', value: 'Monday–Friday, 08:00–17:00' },
    ],
  });

  console.log('Seed completed.');
  console.log('Demo logins (password for all: Password123!)');
  console.log('  System Admin : sysadmin');
  console.log('  Hostel Admin : hosteladmin');
  console.log('  Student      : student1 / student2 / student3');
  console.log(`Rooms created: ${rooms.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
