const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const prisma = global.prisma || new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'No autenticado' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Acceso denegado' });
  next();
};

const normalizeSlug = (value) =>
  value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

const sendEmail = (to, subject, htmlContent) => new Promise((resolve, reject) => {
  const body = JSON.stringify({
    sender: { name: 'ReserFlex', email: process.env.BREVO_SENDER_EMAIL || 'marco2002rios@gmail.com' },
    to: [{ email: to }],
    subject,
    htmlContent
  });
  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(body)
    }
  };
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => res.statusCode >= 200 && res.statusCode < 300 ? resolve(data) : reject(new Error(`Brevo ${res.statusCode}: ${data}`)));
  });
  req.on('error', reject);
  req.write(body);
  req.end();
});

const emailHtml = (title, body, linkText, link) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #2563eb;">${title}</h2>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">${body}</div>
    ${link ? `<a href="${link}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${linkText}</a>` : ''}
    <p style="color: #6b7280; font-size: 14px;">Si no solicitaste esto, ignora el correo.</p>
  </div>`;

const sendVerificationEmail = async (to, token) => {
  await sendEmail(to, 'Verifica tu cuenta en ReserFlex', emailHtml('Bienvenido a ReserFlex', '<p>Haz clic para verificar tu cuenta:</p>', 'Verificar mi cuenta', `${process.env.FRONTEND_URL}/verify?token=${token}`));
};

const sendCredentialsEmail = async (to, password) => {
  const body = `<p>Ya puedes acceder al panel.</p><div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;"><p><strong>Correo:</strong> ${to}</p><p><strong>Contraseña temporal:</strong> ${password}</p></div><p style="color: #dc2626;">Cambia tu contraseña al iniciar sesión.</p>`;
  await sendEmail(to, 'Credenciales de acceso — ReserFlex', emailHtml('Tu cuenta ha sido creada', body, null, null));
};

const sendResetEmail = async (to, token) => {
  await sendEmail(to, 'Restablece tu contraseña — ReserFlex', emailHtml('Restablecer contraseña', '<p>Haz clic (expira en 60 min):</p>', 'Restablecer contraseña', `${process.env.FRONTEND_URL}/reset-password?token=${token}`));
};

const sendConfirmationEmail = async (to, reservation, accessCode = null) => {
  const fecha = new Date(reservation.startTime).toLocaleString('es-EC', { dateStyle: 'full', timeStyle: 'short', timeZone: 'America/Guayaquil' });
  const body = `
    <p><strong>Negocio:</strong> ${reservation.business?.name || ''}</p>
    <p><strong>Servicio:</strong> ${reservation.service?.name || ''}</p>
    <p><strong>Fecha y hora:</strong> ${fecha}</p>
    ${reservation.employee ? `<p><strong>Empleado:</strong> ${reservation.employee.name}</p>` : ''}
    ${accessCode ? `<p><strong>Código de acceso:</strong> ${accessCode}</p>` : ''}`;
  await sendEmail(to, '¡Tu reserva está confirmada! — ReserFlex', emailHtml('¡Reserva confirmada!', body, 'Ver mis reservas', `${process.env.FRONTEND_URL}/mis-reservas`));
};

const sendTableConfirmationEmail = async (to, reservation, accessCode = null) => {
  const body = `
    <p><strong>Negocio:</strong> ${reservation.business?.name || ''}</p>
    <p><strong>Mesa:</strong> ${reservation.table?.number ? `Mesa ${reservation.table.number}` : ''}</p>
    <p><strong>Fecha:</strong> ${reservation.date || ''}</p>
    <p><strong>Hora:</strong> ${reservation.time || ''}</p>
    <p><strong>Personas:</strong> ${reservation.guests || ''}</p>
    ${reservation.occasion ? `<p><strong>Ocasión:</strong> ${reservation.occasion}</p>` : ''}
    ${accessCode ? `<p><strong>Código de acceso:</strong> ${accessCode}</p>` : ''}`;
  await sendEmail(to, '¡Tu reserva de mesa está confirmada! — ReserFlex', emailHtml('¡Reserva de mesa confirmada!', body, 'Ver mis reservas', `${process.env.FRONTEND_URL}/mis-reservas`));
};

const generateSlots = (startTime, endTime, durationMinutes, existingReservations) => {
  const slots = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + durationMinutes <= end) {
    const slotStart = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`;
    const slotEnd = `${String(Math.floor((current + durationMinutes) / 60)).padStart(2, '0')}:${String((current + durationMinutes) % 60).padStart(2, '0')}`;
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

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Todos los campos son requeridos' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'El correo ya está registrado' });
    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.create({ data: { name, email, password: hashed, verifyToken } });
    await sendVerificationEmail(email, verifyToken);
    res.status(201).json({ message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.' });
  } catch (error) {
    console.error('register:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.get('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Token requerido' });
    const user = await prisma.user.findFirst({ where: { verifyToken: token } });
    if (!user) return res.status(400).json({ message: 'Token inválido' });
    await prisma.user.update({ where: { id: user.id }, data: { verified: true, verifyToken: null } });
    res.json({ message: 'Correo verificado exitosamente' });
  } catch (error) {
    console.error('verify:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales no válidas' });
    if (!user.verified && user.role !== 'SUPER_ADMIN') return res.status(401).json({ message: 'Debes verificar tu correo primero' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Credenciales no válidas' });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name, businessId: user.businessId || null }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({
      token, id: user.id, role: user.role, name: user.name, email: user.email,
      businessId: user.businessId || null,
      businessType: user.businessId ? (await prisma.business.findUnique({ where: { id: user.businessId }, select: { type: true } }))?.type || null : null
    });
  } catch (error) {
    console.error('login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ message: 'Si el correo existe recibirás un enlace' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetExpires } });
    await sendResetEmail(email, resetToken);
    res.json({ message: 'Si el correo existe recibirás un enlace' });
  } catch (err) {
    console.error('forgot:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetExpires: { gt: new Date() } } });
    if (!user) return res.status(400).json({ message: 'El enlace expiró o es inválido' });
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetExpires: null } });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('reset:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.patch('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    const validCurrent = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrent) return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('change:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// BUSINESS
app.post('/api/business', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, type, address, logoUrl, adminEmail, adminName } = req.body;
    if (!name || !type || !address || !adminEmail || !adminName) return res.status(400).json({ message: 'Todos los campos son requeridos' });
    const slug = normalizeSlug(name);
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ message: 'Ya existe un negocio con ese nombre' });
    const business = await prisma.business.create({ data: { name, slug, type, address, logoUrl } });
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);
    await prisma.user.create({ data: { name: adminName, email: adminEmail, password: hashed, role: 'ADMIN_NEGOCIO', verified: true, businessId: business.id } });
    await sendCredentialsEmail(adminEmail, tempPassword);
    res.status(201).json({ message: 'Negocio creado exitosamente', business: { id: business.id, name: business.name, slug: business.slug, url: `/reservas/${business.slug}` } });
  } catch (error) {
    console.error('createBusiness:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
});

app.get('/api/business', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({ select: { id: true, name: true, slug: true, type: true, active: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json(businesses);
  } catch (error) {
    console.error('getAllBusinesses:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/business/public', async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({ where: { active: true }, select: { id: true, name: true, slug: true, type: true, address: true }, orderBy: { name: 'asc' } });
    res.json(businesses);
  } catch (error) {
    console.error('getPublicBusinesses:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.get('/api/business/check-slug', async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) return res.status(400).json({ message: 'El nombre es requerido' });
    const slug = normalizeSlug(name);
    const existing = await prisma.business.findUnique({ where: { slug } });
    res.json({ slug, available: !existing });
  } catch (error) {
    console.error('checkSlug:', error);
    res.status(500).json({ message: 'Error al verificar slug' });
  }
});

app.get('/api/business/slug/:slug', async (req, res) => {
  try {
    const business = await prisma.business.findFirst({ where: { slug: req.params.slug, active: true }, select: { id: true, name: true, type: true, address: true, logoUrl: true } });
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    res.json(business);
  } catch (error) {
    console.error('getBusinessBySlug:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

app.patch('/api/business/:id/toggle', authenticate, authorize('SUPER_ADMIN'), async (req, res) => {
  try {
    const business = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });
    const updated = await prisma.business.update({ where: { id: req.params.id }, data: { active: !business.active } });
    res.json({ message: `Negocio ${updated.active ? 'activado' : 'desactivado'}`, active: updated.active });
  } catch (err) {
    console.error('toggleBusiness:', err);
    res.status(500).json({ message: 'Error al actualizar negocio' });
  }
});

app.get('/api/business/:id/photos', async (req, res) => {
  try {
    const photos = await prisma.businessPhoto.findMany({ where: { businessId: req.params.id }, orderBy: { order: 'asc' } });
    res.json(photos);
  } catch (error) {
    console.error('getBusinessPhotos:', error);
    res.status(500).json({ message: 'Error al obtener fotos' });
  }
});

// SCHEDULES
app.get('/api/schedules/:businessId', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({ where: { businessId: req.params.businessId }, orderBy: { dayOfWeek: 'asc' } });
    res.json(schedules);
  } catch (err) {
    console.error('getSchedules:', err);
    res.status(500).json({ message: 'Error al obtener horarios' });
  }
});

app.put('/api/schedules/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { schedules } = req.body;
    const ops = schedules.map(s => prisma.schedule.upsert({ where: { businessId_dayOfWeek: { businessId: req.params.businessId, dayOfWeek: s.dayOfWeek } }, update: { startTime: s.startTime, endTime: s.endTime, isActive: s.isActive }, create: { businessId: req.params.businessId, ...s } }));
    await prisma.$transaction(ops);
    res.json({ message: 'Horarios actualizados correctamente' });
  } catch (err) {
    console.error('upsertSchedules:', err);
    res.status(500).json({ message: 'Error al guardar horarios' });
  }
});

// SERVICES
app.get('/api/services/:businessId', async (req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { businessId: req.params.businessId, active: true }, include: { employeeServices: { select: { employee: { select: { id: true, name: true } } } } }, orderBy: { name: 'asc' } });
    res.json(services);
  } catch (err) {
    console.error('getServices:', err);
    res.status(500).json({ message: 'Error al obtener servicios' });
  }
});

app.post('/api/services/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    if (!name || !price || !duration) return res.status(400).json({ message: 'Nombre, precio y duración son requeridos' });
    const service = await prisma.service.create({ data: { businessId: req.params.businessId, name, description, price: +price, duration: +duration } });
    res.status(201).json(service);
  } catch (err) {
    console.error('createService:', err);
    res.status(500).json({ message: 'Error al crear servicio' });
  }
});

app.put('/api/services/:serviceId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const service = await prisma.service.update({ where: { id: req.params.serviceId }, data: req.body });
    res.json(service);
  } catch (err) {
    console.error('updateService:', err);
    res.status(500).json({ message: 'Error al actualizar servicio' });
  }
});

app.delete('/api/services/:serviceId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.service.update({ where: { id: req.params.serviceId }, data: { active: false } });
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    console.error('deleteService:', err);
    res.status(500).json({ message: 'Error al eliminar servicio' });
  }
});

// EMPLOYEES
app.get('/api/employees/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const employees = await prisma.user.findMany({ where: { businessId: req.params.businessId, role: 'EMPLEADO' }, select: { id: true, name: true, email: true, employeeServices: { select: { service: { select: { id: true, name: true } } } } } });
    res.json(employees);
  } catch (err) {
    console.error('getEmployees:', err);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
});

app.post('/api/employees/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { name, email } = req.body;
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);
    const employee = await prisma.user.create({ data: { name, email, password: hashed, role: 'EMPLEADO', verified: true, businessId: req.params.businessId } });
    await sendCredentialsEmail(email, tempPassword);
    res.status(201).json({ message: 'Empleado creado', id: employee.id });
  } catch (err) {
    console.error('createEmployee:', err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'El correo ya está registrado' });
    res.status(500).json({ message: 'Error al crear empleado' });
  }
});

app.put('/api/employees/:employeeId/services', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { serviceIds } = req.body;
    await prisma.employeeService.deleteMany({ where: { employeeId: req.params.employeeId } });
    if (serviceIds.length > 0) await prisma.employeeService.createMany({ data: serviceIds.map(serviceId => ({ employeeId: req.params.employeeId, serviceId })) });
    res.json({ message: 'Servicios asignados correctamente' });
  } catch (err) {
    console.error('assignServices:', err);
    res.status(500).json({ message: 'Error al asignar servicios' });
  }
});

// RESERVATIONS
app.get('/api/reservations/slots', async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, date } = req.query;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    const dayOfWeek = new Date(date).getDay();
    const schedule = await prisma.schedule.findFirst({ where: { businessId, dayOfWeek, isActive: true } });
    if (!schedule) return res.json({ slots: [], message: 'No hay atención este día' });
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59`);
    const existing = await prisma.reservation.findMany({ where: { businessId, employeeId: employeeId || undefined, status: { not: 'CANCELADA' }, startTime: { gte: dayStart, lte: dayEnd } } });
    const slots = generateSlots(schedule.startTime, schedule.endTime, service.duration, existing);
    res.json({ slots });
  } catch (err) {
    console.error('getSlots:', err);
    res.status(500).json({ message: 'Error al obtener slots' });
  }
});

app.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, notes } = req.body;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const conflict = await prisma.reservation.findFirst({ where: { businessId, employeeId: employeeId || undefined, status: { not: 'CANCELADA' }, OR: [{ startTime: { lt: end }, endTime: { gt: start } }] } });
    if (conflict) return res.status(409).json({ message: 'El horario ya no está disponible' });
    const reservation = await prisma.reservation.create({ data: { businessId, serviceId, clientId: req.user.id, employeeId: employeeId || null, startTime: start, endTime: end, notes, price: service.price, status: 'PENDIENTE' }, include: { service: true, business: true, employee: true } });
    const client = await prisma.user.findUnique({ where: { id: req.user.id } });
    await sendConfirmationEmail(client.email, reservation);
    res.status(201).json(reservation);
  } catch (err) {
    console.error('createReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
});

app.post('/api/reservations/guest', async (req, res) => {
  try {
    const { businessId, serviceId, employeeId, startTime, guestName, guestEmail, guestPhone, notes } = req.body;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const accessCode = crypto.randomInt(100000, 999999).toString();
    const reservation = await prisma.reservation.create({ data: { businessId, serviceId, employeeId: employeeId || null, startTime: start, endTime: end, notes, guestName, guestEmail, guestPhone, accessCode, status: 'PENDIENTE', price: service.price }, include: { service: true, business: true } });
    await sendConfirmationEmail(guestEmail, reservation, accessCode);
    res.status(201).json({ message: 'Reserva creada', accessCode });
  } catch (err) {
    console.error('createGuestReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
});

app.post('/api/reservations/business/:businessId/manual', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { serviceId, employeeId, startTime, notes, clientId, guestName, guestEmail, guestPhone } = req.body;
    if (req.user.role === 'ADMIN_NEGOCIO' && req.user.businessId !== businessId) return res.status(403).json({ message: 'No puedes crear reservas para otro negocio' });
    if (!serviceId || !startTime) return res.status(400).json({ message: 'Servicio y horario son requeridos' });
    if (!clientId && (!guestName || !guestEmail || !guestPhone)) return res.status(400).json({ message: 'Debes seleccionar cliente o completar datos de invitado' });
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Servicio no encontrado' });
    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60000);
    const conflict = await prisma.reservation.findFirst({ where: { businessId, employeeId: employeeId || undefined, status: { not: 'CANCELADA' }, startTime: { lt: end }, endTime: { gt: start } } });
    if (conflict) return res.status(409).json({ message: 'El horario ya no está disponible' });
    let accessCode = null;
    if (!clientId) accessCode = crypto.randomInt(100000, 999999).toString();
    const reservation = await prisma.reservation.create({ data: { businessId, serviceId, clientId: clientId || null, employeeId: employeeId || null, startTime: start, endTime: end, notes: notes || null, guestName: clientId ? null : guestName, guestEmail: clientId ? null : guestEmail, guestPhone: clientId ? null : guestPhone, accessCode, price: service.price, status: 'PENDIENTE' }, include: { service: true, business: true, employee: true, client: true } });
    if (clientId && reservation.client?.email) await sendConfirmationEmail(reservation.client.email, reservation);
    else if (!clientId && guestEmail) await sendConfirmationEmail(guestEmail, reservation, accessCode);
    res.status(201).json({ reservation, accessCode });
  } catch (err) {
    console.error('createAdminReservation:', err);
    res.status(500).json({ message: 'Error al crear reserva manual' });
  }
});

app.get('/api/reservations/clients/search', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { q } = req.query;
    const term = (q || '').trim();
    if (term.length < 2) return res.json([]);
    const users = await prisma.user.findMany({ where: { role: 'CLIENTE', OR: [{ name: { contains: term, mode: 'insensitive' } }, { email: { contains: term, mode: 'insensitive' } }] }, select: { id: true, name: true, email: true }, orderBy: { createdAt: 'desc' }, take: 10 });
    res.json(users);
  } catch (err) {
    console.error('searchClients:', err);
    res.status(500).json({ message: 'Error al buscar clientes' });
  }
});

app.get('/api/reservations/my', authenticate, async (req, res) => {
  try {
    const { status, businessId } = req.query;
    const reservations = await prisma.reservation.findMany({ where: { OR: [{ clientId: req.user.id }, ...(req.user.email ? [{ guestEmail: req.user.email }] : [])], ...(status && { status }), ...(businessId && { businessId }) }, include: { service: true, business: true, employee: true }, orderBy: { startTime: 'desc' } });
    res.json(reservations);
  } catch (err) {
    console.error('getMyReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
});

app.get('/api/reservations/employee', authenticate, authorize('EMPLEADO'), async (req, res) => {
  try {
    const { date } = req.query;
    const where = { employeeId: req.user.id, status: { not: 'CANCELADA' } };
    if (date) { where.startTime = { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) }; }
    const reservations = await prisma.reservation.findMany({ where, include: { service: true, client: { select: { name: true, email: true } } }, orderBy: { startTime: 'asc' } });
    res.json(reservations);
  } catch (err) {
    console.error('getEmployeeReservations:', err);
    res.status(500).json({ message: 'Error al obtener agenda' });
  }
});

app.get('/api/reservations/business/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { date, status } = req.query;
    const where = { businessId: req.params.businessId };
    if (status) where.status = status;
    if (date) { where.startTime = { gte: new Date(`${date}T00:00:00`), lte: new Date(`${date}T23:59:59`) }; }
    const reservations = await prisma.reservation.findMany({ where, include: { service: true, employee: { select: { name: true } }, client: { select: { name: true, email: true } } }, orderBy: { startTime: 'asc' } });
    res.json(reservations);
  } catch (err) {
    console.error('getBusinessReservations:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
});

app.patch('/api/reservations/:id/cancel', authenticate, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2) return res.status(400).json({ message: 'No puedes cancelar con menos de 2 horas de anticipación' });
    await prisma.reservation.update({ where: { id: req.params.id }, data: { status: 'CANCELADA' } });
    res.json({ message: 'Reserva cancelada' });
  } catch (err) {
    console.error('cancelReservation:', err);
    res.status(500).json({ message: 'Error al cancelar' });
  }
});

app.patch('/api/reservations/:id/reschedule', authenticate, async (req, res) => {
  try {
    const { startTime } = req.body;
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id }, include: { service: true } });
    if (!reservation) return res.status(404).json({ message: 'Reserva no encontrada' });
    const hoursUntil = (new Date(reservation.startTime) - new Date()) / 3600000;
    if (hoursUntil < 2) return res.status(400).json({ message: 'No puedes reprogramar con menos de 2 horas' });
    const start = new Date(startTime);
    const end = new Date(start.getTime() + reservation.service.duration * 60000);
    await prisma.reservation.update({ where: { id: req.params.id }, data: { startTime: start, endTime: end } });
    res.json({ message: 'Reserva reprogramada' });
  } catch (err) {
    console.error('rescheduleReservation:', err);
    res.status(500).json({ message: 'Error al reprogramar' });
  }
});

app.patch('/api/reservations/:id/status', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await prisma.reservation.update({ where: { id: req.params.id }, data: { status } });
    res.json(reservation);
  } catch (err) {
    console.error('updateStatus:', err);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

app.get('/api/reservations/metrics/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [totalDay, totalWeek, totalMonth, cancelled, byEmployee] = await Promise.all([
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfDay } } }),
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfWeek } } }),
      prisma.reservation.count({ where: { businessId, startTime: { gte: startOfMonth } } }),
      prisma.reservation.count({ where: { businessId, status: 'CANCELADA', startTime: { gte: startOfMonth } } }),
      prisma.reservation.groupBy({ by: ['employeeId'], where: { businessId, startTime: { gte: startOfMonth }, status: { not: 'CANCELADA' } }, _count: { id: true } })
    ]);
    res.json({ today: totalDay, week: totalWeek, month: totalMonth, cancellationRate: totalMonth > 0 ? ((cancelled / totalMonth) * 100).toFixed(1) : 0, byEmployee });
  } catch (err) {
    console.error('getMetrics:', err);
    res.status(500).json({ message: 'Error al obtener métricas' });
  }
});

app.get('/api/reservations/export/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { format = 'xlsx', startDate, endDate } = req.query;
    let where = { businessId, status: { not: 'CANCELADA' } };
    if (startDate || endDate) { where.startTime = {}; if (startDate) where.startTime.gte = new Date(startDate); if (endDate) where.startTime.lte = new Date(`${endDate}T23:59:59`); }
    const reservations = await prisma.reservation.findMany({ where, include: { service: { select: { name: true, price: true } }, employee: { select: { name: true } }, client: { select: { name: true, email: true } } }, orderBy: { startTime: 'desc' } });
    const data = reservations.map(r => ({
      Fecha: new Date(r.startTime).toLocaleDateString('es-EC'),
      Hora: new Date(r.startTime).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      Servicio: r.service?.name || 'N/A',
      Precio: r.price || r.service?.price || 0,
      Cliente: r.client?.name || r.guestName || 'Invitado',
      Email: r.client?.email || r.guestEmail || 'N/A',
      Teléfono: r.client?.email ? '' : (r.guestPhone || 'N/A'),
      Empleado: r.employee?.name || 'No asignado',
      Estado: r.status
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
      doc.fontSize(10).font('Helvetica-Bold');
      const headers = ['Fecha', 'Hora', 'Servicio', 'Precio', 'Cliente'];
      const colWidths = [70, 60, 100, 60, 80];
      let x = 50;
      headers.forEach((h, i) => { doc.text(h, x, 50, { width: colWidths[i], align: 'left' }); x += colWidths[i]; });
      doc.font('Helvetica').fontSize(9);
      let y = 70;
      data.slice(0, 50).forEach(row => {
        if (y > 700) { doc.addPage(); y = 50; }
        x = 50;
        [row.Fecha, row.Hora, row.Servicio, `$${row.Precio}`, row.Cliente].forEach((v, i) => { doc.text(v.toString().substring(0, 20), x, y, { width: colWidths[i], align: 'left' }); x += colWidths[i]; });
        y += 18;
      });
      doc.end();
      return;
    }

    res.status(400).json({ message: 'Formato no soportado. Use xlsx o pdf' });
  } catch (err) {
    console.error('exportReservations:', err);
    res.status(500).json({ message: 'Error al exportar reservas' });
  }
});

app.get('/api/reservations/income/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { businessId } = req.params;
    const { period = 'month' } = req.query;
    let startDate;
    const now = new Date();
    if (period === 'day') { startDate = new Date(now.setHours(0, 0, 0, 0)); }
    else if (period === 'week') { startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); }
    else { startDate = new Date(now.getFullYear(), now.getMonth(), 1); }
    const reservations = await prisma.reservation.findMany({ where: { businessId, status: 'COMPLETADA', startTime: { gte: startDate } }, include: { service: true } });
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
    res.json({ period, startDate: startDate.toISOString(), totalIncome: parseFloat(totalIncome.toFixed(2)), totalReservations: reservations.length, averagePerReservation: reservations.length > 0 ? parseFloat((totalIncome / reservations.length).toFixed(2)) : 0, byService, byDay });
  } catch (err) {
    console.error('getIncomeReport:', err);
    res.status(500).json({ message: 'Error al obtener reporte de ingresos' });
  }
});

// TABLES
app.get('/api/tables/:businessId', async (req, res) => {
  try {
    const { date, time } = req.query;
    const tables = await prisma.restaurantTable.findMany({ where: { businessId: req.params.businessId, active: true }, orderBy: { number: 'asc' } });
    if (!date || !time) return res.json(tables.map(t => ({ ...t, status: 'available', reservation: null })));
    const reservations = await prisma.tableReservation.findMany({ where: { businessId: req.params.businessId, date, status: { not: 'CANCELADA' } } });
    const [queryHour, queryMinute] = time.split(':').map(Number);
    const currentMinutes = queryHour * 60 + queryMinute;
    res.json(tables.map(table => {
      const reservation = reservations.find(item => item.tableId === table.id);
      let status = 'available';
      if (reservation) {
        const [rh, rm] = reservation.time.split(':').map(Number);
        const diff = rh * 60 + rm - currentMinutes;
        status = diff > 0 && diff <= 30 ? 'soon' : 'busy';
      }
      return { ...table, status, reservation: reservation || null };
    }));
  } catch (error) {
    console.error('getTables:', error);
    res.status(500).json({ message: 'Error al obtener mesas' });
  }
});

app.post('/api/tables/reserve', async (req, res) => {
  try {
    const { tableId, businessId, date, time, guests, occasion, clientId, guestName, guestEmail, guestPhone } = req.body;
    if (!tableId || !businessId || !date || !time || !guests) return res.status(400).json({ message: 'Mesa, negocio, fecha, hora y número de personas son requeridos' });
    const conflict = await prisma.tableReservation.findFirst({ where: { tableId, date, time, status: { not: 'CANCELADA' } } });
    if (conflict) return res.status(409).json({ message: 'Esta mesa ya está reservada para esa fecha y hora' });
    if (!clientId && (!guestName || !guestEmail || !guestPhone)) return res.status(400).json({ message: 'Completa los datos del invitado o inicia sesión' });
    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) return res.status(404).json({ message: 'Mesa no encontrada' });
    const accessCode = clientId ? null : crypto.randomInt(100000, 999999).toString();
    const reservation = await prisma.tableReservation.create({ data: { tableId, businessId, date, time, guests: parseInt(guests, 10), occasion: occasion || null, clientId: clientId || null, guestName: guestName || null, guestEmail: guestEmail || null, guestPhone: guestPhone || null, accessCode }, include: { table: true } });
    const business = await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } });
    const email = clientId ? (await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } }))?.email : guestEmail;
    if (email) await sendTableConfirmationEmail(email, { ...reservation, business }, accessCode);
    res.status(201).json({ message: 'Reserva de mesa confirmada', reservation, accessCode });
  } catch (error) {
    console.error('reserveTable:', error);
    res.status(500).json({ message: 'Error al reservar mesa' });
  }
});

app.post('/api/tables/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { number, capacity, posX, posY, shape } = req.body;
    const table = await prisma.restaurantTable.create({ data: { businessId: req.params.businessId, number: parseInt(number, 10), capacity: parseInt(capacity, 10), posX: Number.isFinite(Number(posX)) ? parseFloat(posX) : 10, posY: Number.isFinite(Number(posY)) ? parseFloat(posY) : 10, shape: shape || 'round' } });
    res.status(201).json(table);
  } catch (error) {
    console.error('createTable:', error);
    if (error.code === 'P2002') return res.status(409).json({ message: `La mesa número ${req.body.number} ya existe` });
    res.status(500).json({ message: 'Error al crear mesa' });
  }
});

app.put('/api/tables/:tableId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const table = await prisma.restaurantTable.update({ where: { id: req.params.tableId }, data: req.body });
    res.json(table);
  } catch (error) {
    console.error('updateTable:', error);
    res.status(500).json({ message: 'Error al actualizar mesa' });
  }
});

app.delete('/api/tables/:tableId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    await prisma.restaurantTable.update({ where: { id: req.params.tableId }, data: { active: false } });
    res.json({ message: 'Mesa eliminada' });
  } catch (error) {
    console.error('deleteTable:', error);
    res.status(500).json({ message: 'Error al eliminar mesa' });
  }
});

// REVIEWS
app.post('/api/reviews', authenticate, async (req, res) => {
  try {
    const { reservationId, rating, comment } = req.body;
    const clientId = req.user.id;
    if (!reservationId || !rating) return res.status(400).json({ message: 'Reservación y calificación son requeridas' });
    if (rating < 1 || rating > 5) return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5' });
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId }, include: { business: true } });
    if (!reservation) return res.status(404).json({ message: 'Reservación no encontrada' });
    if (reservation.clientId !== clientId) return res.status(403).json({ message: 'No puedes reseñar una reservación que no te pertenece' });
    if (reservation.status !== 'COMPLETADA') return res.status(400).json({ message: 'Solo puedes reseñar reservaciones completadas' });
    const existing = await prisma.review.findUnique({ where: { reservationId } });
    if (existing) return res.status(409).json({ message: 'Ya existe una reseña para esta reservación' });
    const review = await prisma.review.create({ data: { reservationId, businessId: reservation.businessId, rating: parseInt(rating), comment }, include: { reservation: { include: { service: true } } } });
    res.status(201).json({ message: 'Reseña creada exitosamente', review });
  } catch (error) {
    console.error('createReview:', error);
    res.status(500).json({ message: 'Error al crear la reseña' });
  }
});

app.get('/api/reviews/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where: { businessId }, include: { reservation: { include: { client: { select: { id: true, name: true } }, service: { select: { id: true, name: true } } } } }, orderBy: { createdAt: 'desc' }, skip, take: parseInt(limit) }),
      prisma.review.count({ where: { businessId } })
    ]);
    const reviewsWithReply = reviews.map(review => ({ ...review, clientName: review.reservation?.client?.name || review.reservation?.guestName || 'Cliente', serviceName: review.reservation?.service?.name || 'Servicio' }));
    res.json({ reviews: reviewsWithReply, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    console.error('getReviewsByBusiness:', error);
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
});

app.get('/api/reviews/business/:businessId/stats', async (req, res) => {
  try {
    const { businessId } = req.params;
    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({ where: { businessId }, select: { rating: true } }),
      prisma.review.aggregate({ where: { businessId }, _avg: { rating: true }, _count: true })
    ]);
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => { ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1; });
    res.json({ averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0, totalReviews: stats._count, ratingDistribution });
  } catch (error) {
    console.error('getReviewStats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

app.patch('/api/reviews/:id/reply', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (!reply || !reply.trim()) return res.status(400).json({ message: 'La respuesta es requerida' });
    const review = await prisma.review.findUnique({ where: { id }, include: { business: true } });
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    if (req.user.role === 'ADMIN_NEGOCIO' && review.businessId !== req.user.businessId) return res.status(403).json({ message: 'No tienes permiso para responder a esta reseña' });
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN_NEGOCIO') return res.status(403).json({ message: 'Solo el administrador del negocio puede responder' });
    const updated = await prisma.review.update({ where: { id }, data: { reply: reply.trim() } });
    res.json({ message: 'Respuesta agregada exitosamente', review: updated });
  } catch (error) {
    console.error('replyToReview:', error);
    res.status(500).json({ message: 'Error al responder la reseña' });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    const secret = process.env.SEED_SECRET;
    if (secret && req.headers['x-vercel-secret'] !== secret) return res.status(403).json({ message: 'No autorizado' });
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'superadmin@reservflex.com' },
      update: {},
      create: { id: crypto.randomUUID(), name: 'Super Admin', email: 'superadmin@reservflex.com', password: hashedPassword, role: 'SUPER_ADMIN', verified: true, createdAt: new Date() }
    });
    res.json({ message: 'Seed ejecutado correctamente', userId: user.id });
  } catch (error) {
    console.error('seed:', error);
    res.status(500).json({ message: 'Error en seed', error: error.message });
  }
});

module.exports = app;
