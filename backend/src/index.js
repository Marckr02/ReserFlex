const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const businessRoutes = require('./routes/business.routes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TEMPORAL: Endpoint para crear Super Admin (eliminar después de usar)
app.get('/api/temp-create-superadmin', async (req, res) => {
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: 'superadmin@reservflex.com' }
    });

    if (existing) {
      return res.json({ message: 'El super admin ya existe', email: existing.email });
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const user = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@reservflex.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        verified: true
      }
    });

    res.json({
      success: true,
      message: 'Super Admin creado exitosamente',
      email: user.email,
      password: 'Admin123!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    await prisma.$disconnect();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});