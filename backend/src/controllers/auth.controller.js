const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetEmail } = require('../services/mail.service');

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verifyToken
      }
    });

    await sendVerificationEmail(email, verifyToken);

    res.status(201).json({
      message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta.'
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: 'Token requerido' });
    }

    const user = await prisma.user.findFirst({ where: { verifyToken: token } });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verifyToken: null }
    });

    res.json({ message: 'Correo verificado exitosamente' });
  } catch (error) {
    console.error('Error en verifyEmail:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales no válidas' });
    }

    // El Super Admin puede iniciar sesión sin verificar correo
    if (!user.verified && user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ message: 'Debes verificar tu correo primero' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales no válidas' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        businessId: user.businessId || null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      businessId: user.businessId || null,
      businessType: user.businessId ? (await prisma.business.findUnique({ where: { id: user.businessId }, select: { type: true } }))?.type || null : null
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    // Siempre responder 200 para no revelar si el correo existe
    if (!user) return res.json({ message: 'Si el correo existe recibirás un enlace' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 60 minutos

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires }
    });

    await sendResetEmail(email, resetToken);
    res.json({ message: 'Si el correo existe recibirás un enlace' });
  } catch (err) {
    console.error('Error en forgotPassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } }
    });

    if (!user) return res.status(400).json({ message: 'El enlace expiró o es inválido' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetExpires: null }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en resetPassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// PATCH /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 8 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const validCurrent = await bcrypt.compare(currentPassword, user.password);
    if (!validCurrent) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed }
    });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en changePassword:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword, changePassword }; 