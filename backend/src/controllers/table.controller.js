const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { sendTableConfirmationEmail } = require('../services/mail.service');

const prisma = new PrismaClient();

const getTables = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, time } = req.query;

    const tables = await prisma.restaurantTable.findMany({
      where: { businessId, active: true },
      orderBy: { number: 'asc' }
    });

    if (!date || !time) {
      return res.json(tables.map((table) => ({ ...table, status: 'available', reservation: null })));
    }

    const reservations = await prisma.tableReservation.findMany({
      where: {
        businessId,
        date,
        status: { not: 'CANCELADA' }
      }
    });

    const [queryHour, queryMinute] = time.split(':').map(Number);
    const currentMinutes = queryHour * 60 + queryMinute;

    const payload = tables.map((table) => {
      const reservation = reservations.find((item) => item.tableId === table.id);
      let status = 'available';

      if (reservation) {
        const [reservationHour, reservationMinute] = reservation.time.split(':').map(Number);
        const reservationMinutes = reservationHour * 60 + reservationMinute;
        const diff = reservationMinutes - currentMinutes;
        status = diff > 0 && diff <= 30 ? 'soon' : 'busy';
      }

      return { ...table, status, reservation: reservation || null };
    });

    res.json(payload);
  } catch (error) {
    console.error('Error getTables:', error);
    res.status(500).json({ message: 'Error al obtener mesas' });
  }
};

const reserveTable = async (req, res) => {
  try {
    const { tableId, businessId, date, time, guests, occasion, clientId, guestName, guestEmail, guestPhone } = req.body;

    if (!tableId || !businessId || !date || !time || !guests) {
      return res.status(400).json({ message: 'Mesa, negocio, fecha, hora y número de personas son requeridos' });
    }

    const conflict = await prisma.tableReservation.findFirst({
      where: {
        tableId,
        date,
        time,
        status: { not: 'CANCELADA' }
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Esta mesa ya está reservada para esa fecha y hora' });
    }

    if (!clientId && (!guestName || !guestEmail || !guestPhone)) {
      return res.status(400).json({ message: 'Completa los datos del invitado o inicia sesión' });
    }

    const table = await prisma.restaurantTable.findUnique({ where: { id: tableId } });
    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    const accessCode = clientId ? null : crypto.randomInt(100000, 999999).toString();

    const reservation = await prisma.tableReservation.create({
      data: {
        tableId,
        businessId,
        date,
        time,
        guests: parseInt(guests, 10),
        occasion: occasion || null,
        clientId: clientId || null,
        guestName: guestName || null,
        guestEmail: guestEmail || null,
        guestPhone: guestPhone || null,
        accessCode
      },
      include: { table: true }
    });

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true }
    });

    const email = clientId
      ? (await prisma.user.findUnique({ where: { id: clientId }, select: { email: true } }))?.email
      : guestEmail;

    if (email) {
      await sendTableConfirmationEmail(email, { ...reservation, business }, accessCode);
    }

    res.status(201).json({ message: 'Reserva de mesa confirmada', reservation, accessCode });
  } catch (error) {
    console.error('Error reserveTable:', error);
    res.status(500).json({ message: 'Error al reservar mesa' });
  }
};

const createTable = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { number, capacity, posX, posY, shape } = req.body;

    const table = await prisma.restaurantTable.create({
      data: {
        businessId,
        number: parseInt(number, 10),
        capacity: parseInt(capacity, 10),
        posX: Number.isFinite(Number(posX)) ? parseFloat(posX) : 10,
        posY: Number.isFinite(Number(posY)) ? parseFloat(posY) : 10,
        shape: shape || 'round'
      }
    });

    res.status(201).json(table);
  } catch (error) {
    console.error('Error createTable:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: `La mesa número ${req.body.number} ya existe` });
    }
    res.status(500).json({ message: 'Error al crear mesa' });
  }
};

const updateTable = async (req, res) => {
  try {
    const table = await prisma.restaurantTable.update({
      where: { id: req.params.tableId },
      data: req.body
    });

    res.json(table);
  } catch (error) {
    console.error('Error updateTable:', error);
    res.status(500).json({ message: 'Error al actualizar mesa' });
  }
};

const deleteTable = async (req, res) => {
  try {
    await prisma.restaurantTable.update({
      where: { id: req.params.tableId },
      data: { active: false }
    });

    res.json({ message: 'Mesa eliminada' });
  } catch (error) {
    console.error('Error deleteTable:', error);
    res.status(500).json({ message: 'Error al eliminar mesa' });
  }
};

module.exports = { getTables, reserveTable, createTable, updateTable, deleteTable };