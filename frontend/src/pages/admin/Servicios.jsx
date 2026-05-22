import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

export default function Servicios() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(user?.businessId || '');
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', duration: '' });
  const [editingId, setEditingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBusinesses = async () => {
      if (user?.role !== 'SUPER_ADMIN') {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/business');
        setBusinesses(data);
        setSelectedBusinessId((current) => current || data[0]?.id || '');
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los negocios');
      } finally {
        setLoading(false);
      }
    };

    loadBusinesses();
  }, [user]);

  const fetchServices = async (businessId) => {
    if (!businessId) return;
    try {
      const { data } = await api.get(`/services/${businessId}`);
      setServices(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los servicios');
    }
  };

  useEffect(() => {
    fetchServices(selectedBusinessId);
  }, [selectedBusinessId]);

  const businessLabel = useMemo(() => {
    if (!selectedBusinessId) return 'Selecciona un negocio';
    return businesses.find((item) => item.id === selectedBusinessId)?.name || 'Mi negocio';
  }, [businesses, selectedBusinessId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (editingId) {
        await api.put(`/services/${editingId}`, {
          ...form,
          price: Number(form.price),
          duration: Number(form.duration)
        });
        setMessage('Servicio actualizado');
      } else {
        await api.post(`/services/${selectedBusinessId}`, {
          ...form,
          price: Number(form.price),
          duration: Number(form.duration)
        });
        setMessage('Servicio creado');
      }
      setForm({ name: '', description: '', price: '', duration: '' });
      setEditingId('');
      fetchServices(selectedBusinessId);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price?.toString() || '',
      duration: service.duration?.toString() || ''
    });
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('¿Deseas desactivar este servicio?')) return;
    try {
      await api.delete(`/services/${serviceId}`);
      fetchServices(selectedBusinessId);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo eliminar el servicio');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <AdminNav />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Sprint 2</p>
          <h1 className="mt-2 text-3xl font-bold">Servicios</h1>
          <p className="mt-2 text-white/75">Administra el catálogo de {businessLabel}.</p>
        </div>

        {user?.role === 'SUPER_ADMIN' && (
          <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
            <label className="mb-2 block text-sm font-medium text-slate-700">Negocio</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
            >
              {businesses.map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
            <div className="mt-4 space-y-4">
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Nombre"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Descripción"
                rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Precio"
                  value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Duración (min)"
                  value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required />
              </div>
            </div>

            {message && <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
            {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <div className="mt-5 flex gap-3">
              <button type="submit" disabled={saving || !selectedBusinessId}
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(''); setForm({ name: '', description: '', price: '', duration: '' }); }}
                  className="rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300">
                  Limpiar
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-4">
            {services.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
                No hay servicios registrados.
              </div>
            ) : (
              services.map((service) => (
                <div key={service.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{service.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{service.description || 'Sin descripción'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-700">
                        <span className="rounded-full bg-slate-100 px-3 py-1">${service.price}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{service.duration} min</span>
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">{service.active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(service)} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Editar</button>
                      <button onClick={() => handleDelete(service.id)} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Desactivar</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
