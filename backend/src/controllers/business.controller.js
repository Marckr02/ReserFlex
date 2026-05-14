const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendCredentialsEmail } = require('../services/mail.service');

const prisma = new PrismaClient();

const createBusiness = async (req, res) => {
  try {
    const { name, type, address, logoUrl, adminEmail, adminName } = req.body;

    if (!name || !type || !address || !adminEmail || !adminName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const existingBusiness = await prisma.business.findUnique({ where: { slug } });
    if (existingBusiness) {
      return res.status(409).json({ message: 'Ya existe un negocio con ese nombre' });
    }

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        type,
        address,
        logoUrl
      }
    });

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN_NEGOCIO',
        verified: true,
        businessId: business.id
      }
    });

    await sendCredentialsEmail(adminEmail, tempPassword);

    res.status(201).json({
      message: 'Negocio creado exitosamente',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        url: `/reservas/${business.slug}`
      }
    });
  } catch (error) {
    console.error('Error en createBusiness:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const getAllBusinesses = async (req, res) => {
  try {
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(businesses);
  } catch (error) {
    console.error('Error en getAllBusinesses:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const business = await prisma.business.findUnique({
      where: { slug, active: true },
      select: {
        id: true,
        name: true,
        type: true,
        address: true,
        logoUrl: true
      }
    });

    if (!business) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    res.json(business);
  } catch (error) {
    console.error('Error en getBusinessBySlug:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

module.exports = { createBusiness, getAllBusinesses, getBusinessBySlug };