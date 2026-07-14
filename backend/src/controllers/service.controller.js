const supabase = require('../lib/supabase');

const getServices = async (req, res) => {
  try {
    const { data: services } = await supabase
      .from('Service')
      .select('*, employeeServices(*)')
      .eq('businessId', req.params.businessId)
      .eq('active', true)
      .order('name', { ascending: true });

    res.json(services);
  } catch (err) {
    console.error('Error getServices:', err);
    res.status(500).json({ message: 'Error al obtener servicios' });
  }
};

const createService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    if (!name || !price || !duration) {
      return res.status(400).json({ message: 'Nombre, precio y duración son requeridos' });
    }

    const { data: service, error } = await supabase
      .from('Service')
      .insert({ businessId: req.params.businessId, name, description, price: +price, duration: +duration })
      .select()
      .single();

    if (error) {
      console.error('Error creando servicio:', error);
      return res.status(500).json({ message: 'Error al crear servicio' });
    }

    res.status(201).json(service);
  } catch (err) {
    console.error('Error createService:', err);
    res.status(500).json({ message: 'Error al crear servicio' });
  }
};

const updateService = async (req, res) => {
  try {
    const { data: service, error } = await supabase
      .from('Service')
      .update(req.body)
      .eq('id', req.params.serviceId)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando servicio:', error);
      return res.status(500).json({ message: 'Error al actualizar servicio' });
    }

    res.json(service);
  } catch (err) {
    console.error('Error updateService:', err);
    res.status(500).json({ message: 'Error al actualizar servicio' });
  }
};

const deleteService = async (req, res) => {
  try {
    const { error } = await supabase
      .from('Service')
      .update({ active: false })
      .eq('id', req.params.serviceId);

    if (error) {
      console.error('Error eliminando servicio:', error);
      return res.status(500).json({ message: 'Error al eliminar servicio' });
    }

    res.json({ message: 'Servicio eliminado' });
  } catch (err) {
    console.error('Error deleteService:', err);
    res.status(500).json({ message: 'Error al eliminar servicio' });
  }
};

module.exports = { getServices, createService, updateService, deleteService };
