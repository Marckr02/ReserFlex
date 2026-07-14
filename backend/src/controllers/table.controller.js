const supabase = require('../lib/supabase');
const crypto = require('crypto');
const { sendTableConfirmationEmail } = require('../services/mail.service');

const getTables = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { date, time } = req.query;

    const { data: tables } = await supabase
      .from('RestaurantTable')
      .select('*')
      .eq('businessId', businessId)
      .eq('active', true)
      .order('number', { ascending: true });

    if (!date || !time) {
      return res.json(tables.map((table) => ({ ...table, status: 'available', reservation: null })));
    }

    const { data: reservations } = await supabase
      .from('TableReservation')
      .select('*')
      .eq('businessId', businessId)
      .eq('date', date)
      .neq('status', 'CANCELADA');

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

    const { data: existingReservations } = await supabase
      .from('TableReservation')
      .select('*')
      .eq('tableId', tableId)
      .eq('date', date)
      .eq('time', time)
      .neq('status', 'CANCELADA');

    const existing = existingReservations?.[0];

    if (existing) {
      return res.status(409).json({ message: 'Esta mesa ya está reservada para esa fecha y hora' });
    }

    if (!clientId && (!guestName || !guestEmail || !guestPhone)) {
      return res.status(400).json({ message: 'Completa los datos del invitado o inicia sesión' });
    }

    const { data: table } = await supabase.from('RestaurantTable').select('*').eq('id', tableId).single();

    if (!table) {
      return res.status(404).json({ message: 'Mesa no encontrada' });
    }

    const accessCode = clientId ? null : crypto.randomInt(100000, 999999).toString();

    const { data: reservation, error } = await supabase
      .from('TableReservation')
      .insert({
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
        accessCode,
      })
      .select()
      .single();

    if (error) {
      console.error('Error reservando mesa:', error);
      return res.status(500).json({ message: 'Error al reservar mesa' });
    }

    const { data: business } = await supabase.from('Business').select('name').eq('id', businessId).single();

    const email = clientId
      ? (await supabase.from('User').select('email').eq('id', clientId).single()).data?.email
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

    const { data: table, error } = await supabase
      .from('RestaurantTable')
      .insert({
        businessId,
        number: parseInt(number, 10),
        capacity: parseInt(capacity, 10),
        posX: Number.isFinite(Number(posX)) ? parseFloat(posX) : 10,
        posY: Number.isFinite(Number(posY)) ? parseFloat(posY) : 10,
        shape: shape || 'round',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: `La mesa número ${req.body.number} ya existe` });
      }
      console.error('Error creando mesa:', error);
      return res.status(500).json({ message: 'Error al crear mesa' });
    }

    res.status(201).json(table);
  } catch (error) {
    console.error('Error createTable:', error);
    res.status(500).json({ message: 'Error al crear mesa' });
  }
};

const updateTable = async (req, res) => {
  try {
    const { data: table, error } = await supabase
      .from('RestaurantTable')
      .update(req.body)
      .eq('id', req.params.tableId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando mesa:', error);
      return res.status(500).json({ message: 'Error al actualizar mesa' });
    }

    res.json(table);
  } catch (error) {
    console.error('Error updateTable:', error);
    res.status(500).json({ message: 'Error al actualizar mesa' });
  }
};

const deleteTable = async (req, res) => {
  try {
    const { error } = await supabase
      .from('RestaurantTable')
      .update({ active: false })
      .eq('id', req.params.tableId);

    if (error) {
      console.error('Error eliminando mesa:', error);
      return res.status(500).json({ message: 'Error al eliminar mesa' });
    }

    res.json({ message: 'Mesa eliminada' });
  } catch (error) {
    console.error('Error deleteTable:', error);
    res.status(500).json({ message: 'Error al eliminar mesa' });
  }
};

module.exports = { getTables, reserveTable, createTable, updateTable, deleteTable };
