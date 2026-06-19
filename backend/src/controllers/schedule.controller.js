const prisma = require('../lib/prisma');

// GET /api/schedules/:businessId
const getSchedules = async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: { businessId: req.params.businessId },
      orderBy: { dayOfWeek: 'asc' }
    });
    res.json(schedules);
  } catch (err) {
    console.error('Error getSchedules:', err);
    res.status(500).json({ message: 'Error al obtener horarios' });
  }
};

// PUT /api/schedules/:businessId — upsert completo de la semana
const upsertSchedules = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { schedules } = req.body; // array de { dayOfWeek, startTime, endTime, isActive }

    const ops = schedules.map(s =>
      prisma.schedule.upsert({
        where: { businessId_dayOfWeek: { businessId, dayOfWeek: s.dayOfWeek } },
        update: { startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
        create: { businessId, ...s }
      })
    );
    await prisma.$transaction(ops);
    res.json({ message: 'Horarios actualizados correctamente' });
  } catch (err) {
    console.error('Error upsertSchedules:', err);
    res.status(500).json({ message: 'Error al guardar horarios' });
  }
};

module.exports = { getSchedules, upsertSchedules };
