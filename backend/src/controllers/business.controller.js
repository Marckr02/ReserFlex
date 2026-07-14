const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendCredentialsEmail } = require('../services/mail.service');

const normalizeSlug = (value) =>
  value
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

    const { data: existingBusiness } = await supabase
      .from('Business')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBusiness) {
      return res.status(409).json({ message: 'Ya existe un negocio con ese nombre' });
    }

    const { data: business, error: businessError } = await supabase
      .from('Business')
      .insert({ name, slug, type, address, logoUrl })
      .select()
      .single();

    if (businessError) {
      console.error('Error creando negocio:', businessError);
      return res.status(500).json({ message: 'Error en el servidor', error: businessError.message });
    }

    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const { error: userError } = await supabase.from('User').insert({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN_NEGOCIO',
      verified: true,
      businessId: business.id,
    });

    if (userError) {
      console.error('Error creando admin:', userError);
      return res.status(500).json({ message: 'Error al crear administrador', error: userError.message });
    }

    await sendCredentialsEmail(adminEmail, tempPassword);

    res.status(201).json({
      message: 'Negocio creado exitosamente',
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        url: `/reservas/${business.slug}`,
      },
    });
  } catch (error) {
    console.error('Error en createBusiness:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

const getAllBusinesses = async (req, res) => {
  try {
    const { data: businesses } = await supabase
      .from('Business')
      .select('id, name, slug, type, active, createdAt')
      .order('createdAt', { ascending: false });

    res.json(businesses);
  } catch (error) {
    console.error('Error en getAllBusinesses:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getPublicBusinesses = async (req, res) => {
  try {
    const { data: businesses } = await supabase
      .from('Business')
      .select('id, name, slug, type, address')
      .eq('active', true)
      .order('name', { ascending: true });

    res.json(businesses);
  } catch (error) {
    console.error('Error en getPublicBusinesses:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getBusinessBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const { data: business } = await supabase
      .from('Business')
      .select('id, name, type, address, logoUrl')
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (!business) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    res.json(business);
  } catch (error) {
    console.error('Error en getBusinessBySlug:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const toggleBusiness = async (req, res) => {
  try {
    const { data: business } = await supabase
      .from('Business')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!business) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }

    const { data: updated } = await supabase
      .from('Business')
      .update({ active: !business.active })
      .eq('id', req.params.id)
      .select()
      .single();

    res.json({ message: `Negocio ${updated.active ? 'activado' : 'desactivado'}`, active: updated.active });
  } catch (err) {
    console.error('Error toggleBusiness:', err);
    res.status(500).json({ message: 'Error al actualizar negocio' });
  }
};

const getBusinessPhotos = async (req, res) => {
  try {
    const { data: photos } = await supabase
      .from('BusinessPhoto')
      .select('*')
      .eq('businessId', req.params.id)
      .order('order', { ascending: true });

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
    const rows = files.map((file, index) => ({
      businessId: req.params.id,
      url: `${backendUrl}/uploads/${file.filename}`,
      order: index,
    }));

    const { data: created, error } = await supabase.from('BusinessPhoto').insert(rows).select();

    if (error) {
      console.error('Error subiendo fotos:', error);
      return res.status(500).json({ message: 'Error al subir fotos' });
    }

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
    const { data: existingBusiness } = await supabase
      .from('Business')
      .select('id')
      .eq('slug', slug)
      .single();

    res.json({ slug, available: !existingBusiness });
  } catch (error) {
    console.error('Error en checkSlug:', error);
    res.status(500).json({ message: 'Error al verificar slug' });
  }
};

module.exports = {
  createBusiness,
  getAllBusinesses,
  getPublicBusinesses,
  getBusinessBySlug,
  toggleBusiness,
  checkSlug,
  getBusinessPhotos,
  uploadBusinessPhotos,
};
