const prisma = require('../utils/prisma');
const { getRoomOccupancy } = require('../utils/helpers');

async function overview(req, res) {
  try {
    const hostels = await prisma.hostel.findMany({
      where: { isActive: true },
      include: { rooms: true, _count: { select: { rooms: true } } },
      orderBy: { name: 'asc' },
    });

    const hostelSummaries = await Promise.all(
      hostels.map(async (h) => {
        let capacity = 0;
        let occupied = 0;
        for (const room of h.rooms) {
          const occ = await getRoomOccupancy(prisma, room.id);
          capacity += occ.capacity;
          occupied += occ.occupied;
        }
        return {
          id: h.id,
          name: h.name,
          location: h.location,
          description: h.description,
          roomCount: h._count.rooms,
          capacity,
          occupied,
          available: Math.max(capacity - occupied, 0),
        };
      })
    );

    const settings = await prisma.systemSetting.findMany();
    const settingMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    res.json({
      institution: settingMap.institution_name || 'RP Musanze College',
      system: settingMap.system_name || 'Student Hostel Management System',
      academicYear: settingMap.academic_year || '2025/2026',
      contact: {
        office: settingMap.admin_office || 'Hostel Administration Office, RP Musanze College',
        phone: settingMap.admin_phone || '+250 788 300 000',
        email: settingMap.admin_email || 'hosteladmin@rpmusanze.ac.rw',
        hours: settingMap.admin_hours || 'Monday–Friday, 08:00–17:00',
      },
      hostels: hostelSummaries,
      totals: hostelSummaries.reduce(
        (acc, h) => {
          acc.hostels += 1;
          acc.rooms += h.roomCount;
          acc.capacity += h.capacity;
          acc.occupied += h.occupied;
          acc.available += h.available;
          return acc;
        },
        { hostels: 0, rooms: 0, capacity: 0, occupied: 0, available: 0 }
      ),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = { overview };
