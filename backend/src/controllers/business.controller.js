const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendCredentialsEmail } = require('../services/mail.service');

const normalizeSlug = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .trim();

const createBusiness = async (req, res) => {
  try {
    const { name, type, address, logoUrl, adminEmail, adminName } = req.body;

    if (!name || !type || !address || !adminEmail || !adminName) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const slug = normalizeSlug(name);

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

    const business = await prisma.business.findFirst({
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

// PATCH /api/business/:id/toggle
const toggleBusiness = async (req, res) => {
  try {
    const business = await prisma.business.findUnique({ where: { id: req.params.id } });
    if (!business) return res.status(404).json({ message: 'Negocio no encontrado' });

    const updated = await prisma.business.update({
      where: { id: req.params.id },
      data: { active: !business.active }
    });
    res.json({ message: `Negocio ${updated.active ? 'activado' : 'desactivado'}`, active: updated.active });
  } catch (err) {
    console.error('Error toggleBusiness:', err);
    res.status(500).json({ message: 'Error al actualizar negocio' });
  }
};

const getBusinessPhotos = async (req, res) => {
  try {
    const photos = await prisma.businessPhoto.findMany({
      where: { businessId: req.params.id },
      orderBy: { order: 'asc' }
    });

    res.json(photos);
  } catch (error) {
    console.error('Error en getBusinessPhotos:', error);
    res.status(500).json({ message: 'Error al obtener fotos' });
  }
};

const uploadBusinessPhotos = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'Debes seleccionar al menos una imagen' });
    }

    const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;

    const created = await Promise.all(files.map((file, index) => prisma.businessPhoto.create({
      data: {
        businessId: req.params.id,
        url: `${backendUrl}/uploads/${file.filename}`,
        order: index
      }
    })));

    res.status(201).json(created);
  } catch (error) {
    console.error('Error en uploadBusinessPhotos:', error);
    res.status(500).json({ message: 'Error al subir fotos' });
  }
};

const checkSlug = async (req, res) => {
  try {
    const name = String(req.query.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const slug = normalizeSlug(name);
    const existingBusiness = await prisma.business.findUnique({ where: { slug } });

    res.json({ slug, available: !existingBusiness });
  } catch (error) {
    console.error('Error en checkSlug:', error);
    res.status(500).json({ message: 'Error al verificar slug' });
  }
};

module.exports = { createBusiness, getAllBusinesses, getBusinessBySlug, toggleBusiness, checkSlug, getBusinessPhotos, uploadBusinessPhotos };