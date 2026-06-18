const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const businessRoutes = require('./routes/business.routes');
const scheduleRoutes    = require('./routes/schedule.routes');
const serviceRoutes     = require('./routes/service.routes');
const employeeRoutes    = require('./routes/employee.routes');
const reservationRoutes = require('./routes/reservation.routes');
const tableRoutes       = require('./routes/table.routes');

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

// CORS restringido solo a frontend autorizado
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://reser-flex.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/schedules',    scheduleRoutes);
app.use('/api/services',     serviceRoutes);
app.use('/api/employees',    employeeRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/tables', tableRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});