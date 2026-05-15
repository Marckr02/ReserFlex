const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/mail.service');

const prisma = new PrismaClient();

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
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { register, verifyEmail, login };