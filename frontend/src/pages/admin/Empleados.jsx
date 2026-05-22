import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

export default function Empleados() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(user?.businessId || '');
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '' });
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

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

  const loadData = async () => {
    if (!selectedBusinessId) return;
    try {
      const [employeesRes, servicesRes] = await Promise.all([
        api.get(`/employees/${selectedBusinessId}`),
        api.get(`/services/${selectedBusinessId}`)
      ]);
      setEmployees(employeesRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar empleados o servicios');
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBusinessId]);

  const businessLabel = useMemo(() => {
    if (!selectedBusinessId) return 'Selecciona un negocio';
    return businesses.find((item) => item.id === selectedBusinessId)?.name || 'Mi negocio';
  }, [businesses, selectedBusinessId]);

  const openAssign = (employee) => {
    setAssignEmployeeId(employee.id);
    setSelectedServiceIds(employee.employeeServices?.map((item) => item.service.id) || []);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post(`/employees/${selectedBusinessId}`, createForm);
      setMessage('Empleado creado y credenciales enviadas por correo');
      setShowCreate(false);
      setCreateForm({ name: '', email: '' });
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear el empleado');
    }
  };

  const handleSaveAssignments = async () => {
    try {
      await api.put(`/employees/${assignEmployeeId}/services`, { serviceIds: selectedServiceIds });
      setMessage('Servicios asignados correctamente');
      setAssignEmployeeId('');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron asignar servicios');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <AdminNav />
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-200">Sprint 2</p>
          <h1 className="mt-2 text-3xl font-bold">Empleados</h1>
          <p className="mt-2 text-white/75">Gestiona el personal y los servicios de {businessLabel}.</p>
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

        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            + Crear empleado
          </button>
        </div>

        {message && <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="grid gap-4">
          {employees.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
              No hay empleados registrados.
            </div>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{employee.name}</h3>
                    <p className="text-sm text-slate-600">{employee.email}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(employee.employeeServices || []).map((item) => (
                        <span key={item.service.id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {item.service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => openAssign(employee)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Asignar servicios
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900">Crear empleado</h2>
            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4">
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Nombre"
                value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required />
              <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Correo"
                value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} required />
              <div className="flex gap-3">
                <button type="submit" className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">Crear</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignEmployeeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900">Asignar servicios</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedServiceIds.includes(service.id)}
                    onChange={(e) => {
                      setSelectedServiceIds((current) =>
                        e.target.checked
                          ? [...current, service.id]
                          : current.filter((item) => item !== service.id)
                      );
                    }}
                  />
                  <span>
                    <span className="block font-medium text-slate-900">{service.name}</span>
                    <span className="block text-xs text-slate-500">{service.duration} min</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveAssignments} className="flex-1 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700">Guardar</button>
              <button onClick={() => setAssignEmployeeId('')} className="flex-1 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
