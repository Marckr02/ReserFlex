const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const { sendCredentialsEmail } = require('../services/mail.service');

const getEmployees = async (req, res) => {
  try {
    const { data: employees } = await supabase
      .from('User')
      .select('id, name, email, employeeServices(*)')
      .eq('businessId', req.params.businessId)
      .eq('role', 'EMPLEADO');

    res.json(employees || []);
  } catch (err) {
    console.error('Error getEmployees:', err);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { name, email } = req.body;
    const tempPassword = require('crypto').randomBytes(6).toString('hex');
    const hashed = await bcrypt.hash(tempPassword, 10);

    const { data: employee, error } = await supabase
      .from('User')
      .insert({
        name,
        email,
        password: hashed,
        role: 'EMPLEADO',
        verified: true,
        businessId: req.params.businessId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ message: 'El correo ya está registrado' });
      }
      console.error('Error creando empleado:', error);
      return res.status(500).json({ message: 'Error al crear empleado', error: error.message });
    }

    await sendCredentialsEmail(email, tempPassword);
    res.status(201).json({ message: 'Empleado creado', id: employee.id });
  } catch (err) {
    console.error('Error createEmployee:', err);
    res.status(500).json({ message: 'Error al crear empleado' });
  }
};

const assignServices = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { serviceIds } = req.body;

    const { error: deleteError } = await supabase
      .from('EmployeeService')
      .delete()
      .eq('employeeId', employeeId);

    if (deleteError) {
      console.error('Error eliminando asignaciones:', deleteError);
      return res.status(500).json({ message: 'Error al asignar servicios' });
    }

    if (serviceIds.length > 0) {
      const rows = serviceIds.map((serviceId) => ({ employeeId, serviceId }));
      const { error: insertError } = await supabase.from('EmployeeService').insert(rows);

      if (insertError) {
        console.error('Error insertando asignaciones:', insertError);
        return res.status(500).json({ message: 'Error al asignar servicios' });
      }
    }

    res.json({ message: 'Servicios asignados correctamente' });
  } catch (err) {
    console.error('Error assignServices:', err);
    res.status(500).json({ message: 'Error al asignar servicios' });
  }
};

module.exports = { getEmployees, createEmployee, assignServices };
