const supabase = require('../lib/supabase');

const getSchedules = async (req, res) => {
  try {
    const { data: schedules } = await supabase
      .from('Schedule')
      .select('*')
      .eq('businessId', req.params.businessId)
      .order('dayOfWeek', { ascending: true });

    res.json(schedules);
  } catch (err) {
    console.error('Error getSchedules:', err);
    res.status(500).json({ message: 'Error al obtener horarios' });
  }
};

const upsertSchedules = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { schedules } = req.body;

    const ops = schedules.map((s) =>
      supabase
        .from('Schedule')
        .upsert(
          { businessId, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive },
          { onConflict: 'businessId,dayOfWeek' }
        )
    );

    await Promise.all(ops);
    res.json({ message: 'Horarios actualizados correctamente' });
  } catch (err) {
    console.error('Error upsertSchedules:', err);
    res.status(500).json({ message: 'Error al guardar horarios' });
  }
};

module.exports = { getSchedules, upsertSchedules };
