const prisma = require('../lib/prisma');
const crypto = require('crypto');
const { sendConfirmationEmail } = require('../services/mail.service');

// Helper: generar slots disponibles
const generateSlots = (startTime, endTime, durationMinutes, existingReservations) => {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;

  while (current + durationMinutes <= end) {
    const slotStart = `${String(Math.floor(current/60)).padStart(2,'0')}:${String(current%60).padStart(2,'0')}`;
    const slotEnd = `${String(Math.floor((current+durationMinutes)/60)).padStart(2,'0')}:${String((current+durationMinutes)%60).padStart(2,'0')}`;

    const isOccupied = existingReservations.some(r => {
      const rStart = new Date(r.startTime).getHours() * 60 + new Date(r.startTime).getMinutes();
      const rEnd = new Date(r.endTime).getHours() * 60 + new Date(r.endTime).getMinutes();
      return current < rEnd && (current + durationMinutes) > rStart;
    });

    slots.push({ startTime: slotStart, endTime: slotEnd, available: !isOccupied });
    current += durationMinutes;
  }
  return slots;
};

// GET /api/reservations/slots?businessId=&serviceId=&employeeId=&date=
const getSlots = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, date } = req.query;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const dayOfWeek = new Date(date).getDay();
    const schedule = await prisma.schedule.findFirst({
      where: { businessId, dayOfWeek, isActive: true }
    });
    if (!schedule) return res.json({ slots: [], message: 'No hay atención este día' });

    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd   = new Date(`${date}T23:59:59`);
    const existing = await prisma.reservation.findMany({
      where: {
        businessId,
        employeeId: employeeId || undefined,
        status: { not: 'CANCELADA' },
        startTime: { gte: dayStart, lte: dayEnd }
      }
    });

    const slots = generateSlots(schedule.startTime, schedule.endTime, service.duration, existing);
    res.json({ slots });
  } catch (err) {
    console.error('Error getSlots:', err);
    res.status(500).json({ message: 'Error al obtener slots' });
  }
};

// POST /api/reservations — HU7 cliente registrado
const createReservation = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, notes } = req.body;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const start = new Date(startTime);
    const end   = new Date(start.getTime() + service.duration * 60000);

    // Verificar disponibilidad
    const conflict = await prisma.reservation.findFirst({
      where: {
        businessId, employeeId: employeeId || undefined,
        status: { not: 'CANCELADA' },
        OR: [{ startTime: { lt: end }, endTime: { gt: start } }]
      }
    });
    if (conflict) return res.status(409).json({ message: 'El horario ya no está disponible' });

    const reservation = await prisma.reservation.create({
      data: {
        businessId, serviceId,
        clientId: req.user.id,
        employeeId: employeeId || null,
        startTime: start, endTime: end, notes,
        price: service.price,
        status: 'PENDIENTE'
      },
      include: { service: true, business: true, employee: true }
    });

    // Confirmación por correo (HU14)
    const client = await prisma.user.findUnique({ where: { id: req.user.id } });
    await sendConfirmationEmail(client.email, reservation);

    res.status(201).json(reservation);
  } catch (err) {
    console.error('Error createReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
};

// POST /api/reservations/guest — HU8 sin cuenta
const createGuestReservation = async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, guestName, guestEmail, guestPhone, notes } = req.body;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const start = new Date(startTime);
    const end   = new Date(start.getTime() + service.duration * 60000);
    const accessCode = crypto.randomInt(100000, 999999).toString();

    const reservation = await prisma.reservation.create({
      data: {
        businessId, serviceId,
        employeeId: employeeId || null,
        startTime: start, endTime: end, notes,
        guestName, guestEmail, guestPhone,
        accessCode, status: 'PENDIENTE',
        price: service.price
      },
      include: { service: true, business: true }
    });

    await sendConfirmationEmail(guestEmail, reservation, accessCode);
    res.status(201).json({ message: 'Reserva creada', accessCode });
  } catch (err) {
    console.error('Error createGuestReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
};

// POST /api/reservations/business/:businessId/manual — HU12 admin
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

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);

    const conflict = await prisma.reservation.findFirst({
      where: {
        businessId,
        employeeId: employeeId || undefined,
        status: { not: 'CANCELADA' },
        startTime: { lt: end },
        endTime: { gt: start }
      }
    });
    if (conflict) return res.status(409).json({ message: 'El horario ya no está disponible' });

    let accessCode = null;
    if (!clientId) {
      accessCode = crypto.randomInt(100000, 999999).toString();
    }

    const reservation = await prisma.reservation.create({
      data: {
        businessId,
        serviceId,
        clientId: clientId || null,
        employeeId: employeeId || null,
        startTime: start,
        endTime: end,
        notes: notes || null,
        guestName: clientId ? null : guestName,
        guestEmail: clientId ? null : guestEmail,
        guestPhone: clientId ? null : guestPhone,
        accessCode,
        price: service.price,
        status: 'PENDIENTE'
      },
      include: {
        service: true,
        business: true,
        employee: true,
        client: true
      }
    });

    if (clientId && reservation.client?.email) {
      await sendConfirmationEmail(reservation.client.email, reservation);
    } else if (!clientId && guestEmail) {
      await sendConfirmationEmail(guestEmail, reservation, accessCode);
    }

    res.status(201).json({ reservation, accessCode });
  } catch (err) {
    console.error('Error createAdminReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva manual' });
  }
};

// GET /api/reservations/clients/search?q=... — HU12 helper
const searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    const term = (q || '').trim();

    if (term.length < 2) {
      return res.json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        role: 'CLIENTE',
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { email: { contains: term, mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json(users);
  } catch (err) {
    console.error('Error searchClients:', err);
    res.status(500).json({ message: 'Error al buscar clientes' });
  }
};

// GET /api/reservations/my — HU10 historial cliente
const getMyReservations = async (req, res) => {
  try {
    const { status, businessId } = req.query;
    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { clientId: req.user.id },
          ...(req.user.email ? [{ guestEmail: req.user.email }] : [])
        ],
        ...(status && { status }),
        ...(businessId && { businessId })
      },
      include: { service: true, business: true, employee: true },
      orderBy: { startTime: 'desc' }
    });
    res.json(reservations);
  } catch (err) {
    console.error('Error getMyReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

// GET /api/reservations/employee — HU11 agenda empleado
const getEmployeeReservations = async (req, res) => {
  try {
    const { date } = req.query;
    const where = { employeeId: req.user.id, status: { not: 'CANCELADA' } };
    if (date) {
      where.startTime = {
        gte: new Date(`${date}T00:00:00`),
        lte: new Date(`${date}T23:59:59`)
      };
    }
    const reservations = await prisma.reservation.findMany({
      where,
      include: { service: true, client: { select: { name: true, email: true } } },
      orderBy: { startTime: 'asc' }
    });
    res.json(reservations);
  } catch (err) {
    console.error('Error getEmployeeReservations:', err);
    res.status(500).json({ message: 'Error al obtener agenda' });
  }
};

// GET /api/reservations/business/:businessId — HU12 admin
const getBusinessReservations = async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = { businessId: req.params.businessId };
    if (status) where.status = status;
    if (date) {
      where.startTime = {
        gte: new Date(`${date}T00:00:00`),
        lte: new Date(`${date}T23:59:59`)
      };
    }
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        service: true,
        employee: { select: { name: true } },
        client: { select: { name: true, email: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    res.json(reservations);
  } catch (err) {
    console.error('Error getBusinessReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
};

// PATCH /api/reservations/:id/cancel — HU9
const cancelReservation = async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    // Política: solo hasta 2 horas antes
    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2)
      return res.status(400).json({ message: 'No puedes cancelar con menos de 2 horas de anticipación' });

    await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status: 'CANCELADA' }
    });
    res.json({ message: 'Reserva cancelada' });
  } catch (err) {
    console.error('Error cancelReservation:', err);
    res.status(500).json({ message: 'Error al cancelar reserva' });
  }
};

// PATCH /api/reservations/:id/reschedule — HU9
const rescheduleReservation = async (req, res) => {
  try {
    const { startTime } = req.body;
    const reservation = await prisma.reservation.findUnique({
      where: { id: req.params.id },
      include: { service: true }
    });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });

    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2)
      return res.status(400).json({ message: 'No puedes reprogramar con menos de 2 horas de anticipación' });

    const start = new Date(startTime);
    const end   = new Date(start.getTime() + reservation.service.duration * 60000);

    await prisma.reservation.update({
      where: { id: req.params.id },
      data: { startTime: start, endTime: end }
    });
    res.json({ message: 'Reserva reprogramada' });
  } catch (err) {
    console.error('Error rescheduleReservation:', err);
    res.status(500).json({ message: 'Error al reprogramar' });
  }
};

// PATCH /api/reservations/:id/status — HU12 admin
const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await prisma.reservation.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json(reservation);
  } catch (err) {
    console.error('Error updateReservationStatus:', err);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
};

// GET /api/reservations/metrics/:businessId — HU13
const getMetrics = async (req, res) => {
  try {
    const { businessId } = req.params;
    const today = new Date();
    const startOfDay  = new Date(today.setHours(0,0,0,0));
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth= new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalDay, totalWeek, totalMonth, cancelled, byEmployee] = await Promise.all([
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfDay } } }),
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfWeek } } }),
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfMonth } } }),
      prisma.reservation.count({ where: { businessId, status: 'CANCELADA', startTime: { gte: startOfMonth } } }),
      prisma.reservation.groupBy({
        by: ['employeeId'],
        where: { businessId, startTime: { gte: startOfMonth }, status: { not: 'CANCELADA' } },
        _count: { id: true }
      })
    ]);

    res.json({
      today: totalDay,
      week: totalWeek,
      month: totalMonth,
      cancellationRate: totalMonth > 0 ? ((cancelled / totalMonth) * 100).toFixed(1) : 0,
      byEmployee
    });
  } catch (err) {
    console.error('Error getMetrics:', err);
    res.status(500).json({ message: 'Error al obtener métricas' });
  }
};

// GET /api/reservations/export/:businessId?format=xlsx|pdf — HU25
const exportReservations = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { format = 'xlsx', startDate, endDate } = req.query;

    let where = { businessId, status: { not: 'CANCELADA' } };
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(startDate);
      if (endDate) where.startTime.lte = new Date(`${endDate}T23:59:59`);
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        service: { select: { name: true, price: true } },
        employee: { select: { name: true } },
        client: { select: { name: true, email: true } }
      },
      orderBy: { startTime: 'desc' }
    });

    const data = reservations.map(r => ({
      'Fecha': new Date(r.startTime).toLocaleDateString('es-EC'),
      'Hora': new Date(r.startTime).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      'Servicio': r.service?.name || 'N/A',
      'Precio': r.price || r.service?.price || 0,
      'Cliente': r.client?.name || r.guestName || 'Invitado',
      'Email': r.client?.email || r.guestEmail || 'N/A',
      'Teléfono': r.client?.email ? '' : (r.guestPhone || 'N/A'),
      'Empleado': r.employee?.name || 'No asignado',
      'Estado': r.status
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
      data.slice(0, 50).forEach(row => {
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

// GET /api/reservations/income/:businessId?period=month — HU26
const getIncomeReport = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = 'month' } = req.query;

    let startDate;
    const now = new Date();
    if (period === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        businessId,
        status: 'COMPLETADA',
        startTime: { gte: startDate }
      },
      include: { service: true }
    });

    let totalIncome = 0;
    const byService = {};
    const byDay = {};

    reservations.forEach(r => {
      const price = r.price || r.service?.price || 0;
      totalIncome += price;

      const serviceName = r.service?.name || 'Otro';
      byService[serviceName] = (byService[serviceName] || 0) + price;

      const dayKey = new Date(r.startTime).toLocaleDateString('es-EC');
      byDay[dayKey] = (byDay[dayKey] || 0) + price;
    });

    res.json({
      period,
      startDate: startDate.toISOString(),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalReservations: reservations.length,
      averagePerReservation: reservations.length > 0
        ? parseFloat((totalIncome / reservations.length).toFixed(2)) : 0,
      byService,
      byDay
    });
  } catch (err) {
    console.error('Error getIncomeReport:', err);
    res.status(500).json({ message: 'Error al obtener reporte de ingresos' });
  }
};

module.exports = {
  getSlots, createReservation, createGuestReservation,
  createAdminReservation,
  searchClients,
  getMyReservations, getEmployeeReservations, getBusinessReservations,
  cancelReservation, rescheduleReservation, updateReservationStatus, getMetrics,
  exportReservations, getIncomeReport
};
