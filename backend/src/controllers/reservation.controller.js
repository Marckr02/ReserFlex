const supabase = require('../lib/supabase');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../services/mail.service');

const generateSlots = (startTime, endTime, durationMinutes, existingReservations) => {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  while (current + durationMinutes <= end) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, '0')}:${String((current + durationMinutes) % 60).padStart(2, '0')}`;

    const isOccupied = existingReservations.some((r) => {
      const rStart = new Date(r.startTime).getHours() * 60 + new Date(r.startTime).getMinutes();
      const rEnd = new Date(r.endTime).getHours() * 60 + new Date(r.endTime).getMinutes();
      return current < rEnd && current + durationMinutes > rStart;
    });

    slots.push({ startTime: slotStart, endTime: slotEnd, available: !isOccupied });
    current += durationMinutes;
  }
  return slots;
};

const getSlots = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, date } = req.query;

    const { data: services } = await supabase.from('Service').select('*').eq('id', serviceId).limit(1);
    const service = services?.[0];
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const dayOfWeek = new Date(date).getDay();

    const { data: schedules } = await supabase
      .from('Schedule')
      .select('*')
      .eq('businessId', businessId)
      .eq('dayOfWeek', dayOfWeek)
      .eq('isActive', true)
      .limit(1);

    const schedule = schedules?.[0];
    if (!schedule) return res.json({ slots: [], message: 'No hay atención este día' });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);

    let query = supabase
      .from('Reservation')
      .select('startTime, endTime')
      .eq('businessId', businessId)
      .neq('status', 'CANCELADA')
      .gte('startTime', dayStart.toISOString())
      .lte('startTime', dayEnd.toISOString());

    if (employeeId) query = query.eq('employeeId', employeeId);

    const { data: existing } = await query;

    const slots = generateSlots(schedule.startTime, schedule.endTime, service.duration, existing || []);
    res.json({ slots });
  } catch (err) {
    console.error('Error getSlots:', err);
    res.status(500).json({ message: 'Error al obtener slots' });
  }
};

const createReservation = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, notes } = req.body;

    const { data: services } = await supabase.from('Service').select('*').eq('id', serviceId).limit(1);
    const service = services?.[0];
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    let query = supabase
      .from('Reservation')
      .select('id')
      .eq('businessId', businessId)
      .neq('status', 'CANCELADA')
      .lt('startTime', end.toISOString())
      .gt('endTime', start.toISOString());

    if (employeeId) query = query.eq('employeeId', employeeId);

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'El horario ya no está disponible' });
    }

    const { data: reservation, error } = await supabase
      .from('Reservation')
      .insert({
        businessId,
        serviceId,
        clientId: req.user.id,
        employeeId: employeeId || null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes,
        price: service.price,
        status: 'PENDIENTE',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando reserva:', error);
      return res.status(500).json({ message: 'Error al crear reserva' });
    }

    const { data: users } = await supabase.from('User').select('email').eq('id', req.user.id).limit(1);
    const client = users?.[0];
    if (client) await sendConfirmationEmail(client.email, reservation);

    res.status(201).json(reservation);
  } catch (err) {
    console.error('Error createReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
};

const createGuestReservation = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, guestName, guestEmail, guestPhone, notes } = req.body;

    const { data: services } = await supabase.from('Service').select('*').eq('id', serviceId).limit(1);
    const service = services?.[0];
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const accessCode = crypto.randomInt(100000, 999999).toString();

    const { data: reservation, error } = await supabase
      .from('Reservation')
      .insert({
        businessId,
        serviceId,
        employeeId: employeeId || null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes,
        guestName,
        guestEmail,
        guestPhone,
        accessCode,
        status: 'PENDIENTE',
        price: service.price,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando reserva invitado:', error);
      return res.status(500).json({ message: 'Error al crear reserva' });
    }

    await sendConfirmationEmail(guestEmail, reservation, accessCode);
    res.status(201).json({ message: 'Reserva creada', accessCode });
  } catch (err) {
    console.error('Error createGuestReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
};

const createAdminReservation = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { serviceId, employeeId, startTime, notes, clientId, guestName, guestEmail, guestPhone } = req.body;

    if (req.user.role === 'ADMIN_NEGOCIO' && req.user.businessId !== businessId) {
      return res.status(403).json({ message: 'No puedes crear reservas para otro negocio' });
    }

    if (!serviceId || !startTime) {
      return res.status(400).json({ message: 'Servicio y horario son requeridos' });
    }

    if (!clientId && (!guestName || !guestEmail || !guestPhone)) {
      return res.status(400).json({ message: 'Debes seleccionar cliente o completar datos de invitado' });
    }

    const { data: services } = await supabase.from('Service').select('*').eq('id', serviceId).limit(1);
    const service = services?.[0];
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    let query = supabase
      .from('Reservation')
      .select('id')
      .eq('businessId', businessId)
      .neq('status', 'CANCELADA')
      .lt('startTime', end.toISOString())
      .gt('endTime', start.toISOString());

    if (employeeId) query = query.eq('employeeId', employeeId);

    const { data: existing } = await query.limit(1);

    if (existing && existing.length > 0) {
      return res.status(409).json({ message: 'El horario ya no está disponible' });
    }

    let accessCode = null;
    if (!clientId) {
      accessCode = crypto.randomInt(100000, 999999).toString();
    }

    const { data: reservation, error } = await supabase
      .from('Reservation')
      .insert({
        businessId,
        serviceId,
        clientId: clientId || null,
        employeeId: employeeId || null,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: notes || null,
        guestName: clientId ? null : guestName,
        guestEmail: clientId ? null : guestEmail,
        guestPhone: clientId ? null : guestPhone,
        accessCode,
        price: service.price,
        status: 'PENDIENTE',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando reserva admin:', error);
      return res.status(500).json({ message: 'Error al crear reserva manual' });
    }

    if (clientId) {
      const { data: clientUser } = await supabase.from('User').select('email').eq('id', clientId).single();
      if (clientUser?.email) await sendConfirmationEmail(clientUser.email, reservation);
    } else if (guestEmail) {
      await sendConfirmationEmail(guestEmail, reservation, accessCode);
    }

    res.status(201).json({ reservation, accessCode });
  } catch (err) {
    console.error('Error createAdminReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva manual' });
  }
};

const searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    const term = (q || '').trim();

    if (term.length < 2) {
      return res.json([]);
    }

    const { data: users } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('role', 'CLIENTE')
      .or(`name.ilike.%${term}%,email.ilike.%${term}%`)
      .order('createdAt', { ascending: false })
      .limit(10);

    res.json(users || []);
  } catch (err) {
    console.error('Error searchClients:', err);
    res.status(500).json({ message: 'Error al buscar clientes' });
  }
};

const getMyReservations = async (req, res) => {
  try {
    const { status, businessId } = req.query;

    let query = supabase
      .from('Reservation')
      .select('*')
      .or(`clientId.eq.${req.user.id}`)
      .order('startTime', { ascending: false });

    if (status) query = query.eq('status', status);
    if (businessId) query = query.eq('businessId', businessId);

    const { data: reservations } = await query;
    res.json(reservations || []);
  } catch (err) {
    console.error('Error getMyReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

const getEmployeeReservations = async (req, res) => {
  try {
    const { date } = req.query;
    const userId = req.user.id;

    let query = supabase
      .from('Reservation')
      .select('*, service(*), client:UserId!ClientId(*), employee:UserId!EmployeeId(*)')
      .eq('employeeId', userId)
      .neq('status', 'CANCELADA')
      .order('startTime', { ascending: true });

    if (date) {
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();
      query = query.gte('startTime', dayStart).lte('startTime', dayEnd);
    }

    const { data: reservations } = await query;
    res.json(reservations || []);
  } catch (err) {
    console.error('Error getEmployeeReservations:', err);
    res.status(500).json({ message: 'Error al obtener agenda' });
  }
};

const getBusinessReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const { businessId } = req.params;

    let query = supabase
      .from('Reservation')
      .select('*, service:ServiceId(*), employee:EmployeeId(*), client:ClientId(*)')
      .eq('businessId', businessId)
      .order('startTime', { ascending: true });

    if (status) query = query.eq('status', status);
    if (date) {
      const dayStart = new Date(`${date}T00:00:00`).toISOString();
      const dayEnd = new Date(`${date}T23:59:59`).toISOString();
      query = query.gte('startTime', dayStart).lte('startTime', dayEnd);
    }

    const { data: reservations } = await query;
    res.json(reservations || []);
  } catch (err) {
    console.error('Error getBusinessReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { data: reservations } = await supabase.from('Reservation').select('*').eq('id', req.params.id).limit(1);

    const reservation = reservations?.[0];
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2) {
      return res.status(400).json({ message: 'No puedes cancelar con menos de 2 horas de anticipación' });
    }

    const { error } = await supabase.from('Reservation').update({ status: 'CANCELADA' }).eq('id', req.params.id);

    if (error) {
      console.error('Error cancelando reserva:', error);
      return res.status(500).json({ message: 'Error al cancelar' });
    }

    res.json({ message: 'Reserva cancelada' });
  } catch (err) {
    console.error('Error cancelReservation:', err);
    res.status(500).json({ message: 'Error al cancelar' });
  }
};

const rescheduleReservation = async (req, res) => {
  try {
    const { startTime } = req.body;

    const { data: reservations } = await supabase.from('Reservation').select('*, service:ServiceId(*)').eq('id', req.params.id).limit(1);

    const reservation = reservations?.[0];
    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2) {
      return res.status(400).json({ message: 'No puedes reprogramar con menos de 2 horas de anticipación' });
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + (reservation.service?.duration || 0) * 60000);

    const { error } = await supabase
      .from('Reservation')
      .update({ startTime: start.toISOString(), endTime: end.toISOString() })
      .eq('id', req.params.id);

    if (error) {
      console.error('Error reprogramando reserva:', error);
      return res.status(500).json({ message: 'Error al reprogramar' });
    }

    res.json({ message: 'Reserva reprogramada' });
  } catch (err) {
    console.error('Error rescheduleReservation:', err);
    res.status(500).json({ message: 'Error al reprogramar' });
  }
};

const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const { data: reservation, error } = await supabase
      .from('Reservation')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando estado:', error);
      return res.status(500).json({ message: 'Error al actualizar estado' });
    }

    res.json(reservation);
  } catch (err) {
    console.error('Error updateReservationStatus:', err);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

const getMetrics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const { count: totalDay } = await supabase
      .from('Reservation')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId)
      .gte('startTime', startOfDay);

    const { count: totalWeek } = await supabase
      .from('Reservation')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId)
      .gte('startTime', startOfWeek.toISOString());

    const { count: totalMonth } = await supabase
      .from('Reservation')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId)
      .gte('startTime', startOfMonth.toISOString());

    const { count: cancelledCount } = await supabase
      .from('Reservation')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId)
      .eq('status', 'CANCELADA')
      .gte('startTime', startOfMonth.toISOString());

    const { data: byEmployeeData } = await supabase
      .from('Reservation')
      .select('employeeId')
      .eq('businessId', businessId)
      .gte('startTime', startOfMonth.toISOString())
      .neq('status', 'CANCELADA');

    const byEmployeeMap = {};
    (byEmployeeData || []).forEach((r) => {
      if (r.employeeId) {
        byEmployeeMap[r.employeeId] = (byEmployeeMap[r.employeeId] || 0) + 1;
      }
    });
    const byEmployee = Object.entries(byEmployeeMap).map(([employeeId, count]) => ({ employeeId, count }));

    res.json({
      today: totalDay || 0,
      week: totalWeek || 0,
      month: totalMonth || 0,
      cancellationRate: totalMonth > 0 ? ((cancelledCount / totalMonth) * 100).toFixed(1) : 0,
      byEmployee,
    });
  } catch (err) {
    console.error('Error getMetrics:', err);
    res.status(500).json({ message: 'Error al obtener métricas' });
  }
};

const exportReservations = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { format = 'xlsx', startDate, endDate } = req.query;

    let query = supabase
      .from('Reservation')
      .select('*, service:ServiceId(*), employee:EmployeeId(*), client:ClientId(*)')
      .neq('status', 'CANCELADA')
      .eq('businessId', businessId);

    if (startDate || endDate) {
      if (startDate) query = query.gte('startTime', new Date(startDate).toISOString());
      if (endDate) query = query.lte('startTime', new Date(`${endDate}T23:59:59`).toISOString());
    }

    const { data: reservations } = await query.order('startTime', { ascending: false });

    const data = (reservations || []).map((r) => ({
      Fecha: new Date(r.startTime).toLocaleDateString('es-EC'),
      Hora: new Date(r.startTime).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      Servicio: r.service?.name || 'N/A',
      Precio: r.price || r.service?.price || 0,
      Cliente: r.client?.name || r.guestName || 'Invitado',
      Email: r.client?.email || r.guestEmail || 'N/A',
      Telefono: r.client?.email ? '' : r.guestPhone || 'N/A',
      Empleado: r.employee?.name || 'No asignado',
      Estado: r.status,
    }));

    if (format === 'xlsx') {
      const XLSX = require('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas');
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Disposition', 'attachment; filename=reservas.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    }

    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader('Content-Disposition', 'attachment; filename=reservas.pdf');
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(res);

      doc.fontSize(20).text('Reporte de Reservas', { align: 'center' });
      doc.fontSize(12).text(`Generado: ${new Date().toLocaleDateString('es-EC')}`, { align: 'center' });
      doc.moveDown(2);

      const tableTop = doc.y;
      const colWidths = [70, 60, 100, 60, 80];
      const headers = ['Fecha', 'Hora', 'Servicio', 'Precio', 'Cliente'];

      doc.fontSize(10).font('Helvetica-Bold');
      let x = 50;
      headers.forEach((h, i) => {
        doc.text(h, x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });

      doc.font('Helvetica').fontSize(9);
      let y = tableTop + 20;
      data.slice(0, 50).forEach((row) => {
        if (y > 700) { doc.addPage(); y = 50; }
        x = 50;
        const values = [row.Fecha, row.Hora, row.Servicio, `$${row.Precio}`, row.Cliente];
        values.forEach((v, i) => {
          doc.text(v.toString().substring(0, 20), x, y, { width: colWidths[i], align: 'left' });
          x += colWidths[i];
        });
        y += 18;
      });

      doc.end();
      return;
    }

    res.status(400).json({ message: 'Formato no soportado. Use xlsx o pdf' });
  } catch (err) {
    console.error('Error exportReservations:', err);
    res.status(500).json({ message: 'Error al exportar reservas' });
  }
};

const getIncomeReport = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = 'month' } = req.query;

    let startDate;
    const now = new Date();
    if (period === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      startDate = startDate.toISOString();
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }

    const { data: reservations } = await supabase
      .from('Reservation')
      .select('*, service:ServiceId(*)')
      .eq('businessId', businessId)
      .eq('status', 'COMPLETADA')
      .gte('startTime', startDate);

    let totalIncome = 0;
    const byService = {};
    const byDay = {};

    (reservations || []).forEach((r) => {
      const price = r.price || r.service?.price || 0;
      totalIncome += price;

      const serviceName = r.service?.name || 'Otro';
      byService[serviceName] = (byService[serviceName] || 0) + price;

      const dayKey = new Date(r.startTime).toLocaleDateString('es-EC');
      byDay[dayKey] = (byDay[dayKey] || 0) + price;
    });

    res.json({
      period,
      startDate,
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalReservations: reservations?.length || 0,
      averagePerReservation: reservations?.length > 0 ? parseFloat((totalIncome / reservations.length).toFixed(2)) : 0,
      byService,
      byDay,
    });
  } catch (err) {
    console.error('Error getIncomeReport:', err);
    res.status(500).json({ message: 'Error al obtener reporte de ingresos' });
  }
};

module.exports = {
  getSlots,
  createReservation,
  createGuestReservation,
  createAdminReservation,
  searchClients,
  getMyReservations,
  getEmployeeReservations,
  getBusinessReservations,
  cancelReservation,
  rescheduleReservation,
  updateReservationStatus,
  getMetrics,
  exportReservations,
  getIncomeReport,
};
