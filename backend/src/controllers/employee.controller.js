const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

// GET /api/employees/:businessId
const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: { businessId: req.params.businessId, role: 'EMPLEADO' },
      select: {
        id: true, name: true, email: true,
        employeeServices: { select: { service: { select: { id: true, name: true } } } }
      }
    });
    res.json(employees);
  } catch (err) {
    console.error('Error getEmployees:', err);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
};

// POST /api/employees/:businessId — crear empleado
const createEmployee = async (req, res) => {
  try {
    const { name, email } = req.body;
    const tempPassword = require('crypto').randomBytes(6).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);

    const employee = await prisma.user.create({
      data: {
        name, email, password: hashed,
        role: 'EMPLEADO', verified: true,
        businessId: req.params.businessId
      }
    });

    const { sendCredentialsEmail } = require('../services/mail.service');
    await sendCredentialsEmail(email, tempPassword);

    res.status(201).json({ message: 'Empleado creado', id: employee.id });
  } catch (err) {
    console.error('Error createEmployee:', err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'El correo ya está registrado' });
    res.status(500).json({ message: 'Error al crear empleado' });
  }
};

// PUT /api/employees/:employeeId/services — asignar servicios
const assignServices = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { serviceIds } = req.body; // array de IDs

    // Reemplazar asignaciones
    await prisma.employeeService.deleteMany({ where: { employeeId } });
    if (serviceIds.length > 0) {
      await prisma.employeeService.createMany({
        data: serviceIds.map(serviceId => ({ employeeId, serviceId }))
      });
    }
    res.json({ message: 'Servicios asignados correctamente' });
  } catch (err) {
    console.error('Error assignServices:', err);
    res.status(500).json({ message: 'Error al asignar servicios' });
  }
};

module.exports = { getEmployees, createEmployee, assignServices };
