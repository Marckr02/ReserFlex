const prisma = require('../lib/prisma');

// GET /api/services/:businessId — público
const getServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { businessId: req.params.businessId, active: true },
      include: {
        employeeServices: {
          select: { employee: { select: { id: true, name: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(services);
  } catch (err) {
    console.error('Error getServices:', err);
    res.status(500).json({ message: 'Error al obtener servicios' });
  }
};

// POST /api/services/:businessId
const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;
    if (!name || !price || !duration)
      return res.status(400).json({ message: 'Nombre, precio y duración son requeridos' });

    const service = await prisma.service.create({
      data: { businessId: req.params.businessId, name, description, price: +price, duration: +duration }
    });
    res.status(201).json(service);
  } catch (err) {
    console.error('Error createService:', err);
    res.status(500).json({ message: 'Error al crear servicio' });
  }
};

// PUT /api/services/:serviceId
const updateService = async (req, res) => {
  try {
    const service = await prisma.service.update({
      where: { id: req.params.serviceId },
      data: req.body
    });
    res.json(service);
  } catch (err) {
    console.error('Error updateService:', err);
    res.status(500).json({ message: 'Error al actualizar servicio' });
  }
};

// DELETE /api/services/:serviceId — soft delete
const deleteService = async (req, res) => {
  try {
    await prisma.service.update({
      where: { id: req.params.serviceId },
      data: { active: false }
    });
    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    console.error('Error deleteService:', err);
    res.status(500).json({ message: 'Error al eliminar servicio' });
  }
};

module.exports = { getServices, createService, updateService, deleteService };
