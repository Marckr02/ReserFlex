import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

const STATUS_LABELS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  COMPLETADA: { label: 'Completada', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-200' },
  NO_SE_PRESENTO: { label: 'No se presentó', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export default function ReservasAdmin() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [creating, setCreating] = useState(false);
  const [clientQuery, setClientQuery] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [createForm, setCreateForm] = useState({
    serviceId: '',
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    clientId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: ''
  });

  const fetchReservations = async () => {
    if (!user?.businessId) return;
    try {
      const { data } = await api.get(`/reservations/business/${user.businessId}`, {
        params: { date }
      });
      setReservations(data);
      setError('');
    } catch (err) {
      setError('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [date, user]);

  useEffect(() => {
    const loadOptions = async () => {
      if (!user?.businessId) return;
      try {
        const [servicesRes, employeesRes] = await Promise.all([
          api.get(`/services/${user.businessId}`),
          api.get(`/employees/${user.businessId}`)
        ]);
        setServices(servicesRes.data);
        setEmployees(employeesRes.data);
      } catch {
        setError('No se pudieron cargar servicios o empleados');
      }
    };

    loadOptions();
  }, [user]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!showCreate || !createForm.serviceId || !createForm.date || !user?.businessId) return;
      try {
        const { data } = await api.get('/reservations/slots', {
          params: {
            businessId: user.businessId,
            serviceId: createForm.serviceId,
            employeeId: createForm.employeeId || undefined,
            date: createForm.date
          }
        });
        setSlots(data.slots || []);
        setSelectedSlot(null);
      } catch {
        setError('No se pudieron cargar los slots para reserva manual');
      }
    };

    loadSlots();
  }, [showCreate, createForm.serviceId, createForm.employeeId, createForm.date, user]);

  useEffect(() => {
    const searchClients = async () => {
      if (!showCreate || clientQuery.trim().length < 2) {
        setClientResults([]);
        return;
      }

      setSearchingClients(true);
      try {
        const { data } = await api.get('/reservations/clients/search', {
          params: { q: clientQuery.trim() }
        });
        setClientResults(data);
      } catch {
        setError('No se pudo buscar clientes');
      } finally {
        setSearchingClients(false);
      }
    };

    const timeoutId = setTimeout(searchClients, 300);
    return () => clearTimeout(timeoutId);
  }, [clientQuery, showCreate]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      setMessage('Estado actualizado correctamente');
      fetchReservations();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  const handleCreateManualReservation = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Selecciona un horario para crear la reserva');
      return;
    }

    if (!createForm.clientId && (!createForm.guestName || !createForm.guestEmail || !createForm.guestPhone)) {
      setError('Completa datos del invitado o el ID de cliente');
      return;
    }

    setCreating(true);
    setError('');

    try {
      await api.post(`/reservations/business/${user.businessId}/manual`, {
        serviceId: createForm.serviceId,
        employeeId: createForm.employeeId || undefined,
        startTime: `${createForm.date}T${selectedSlot.startTime}:00`,
        notes: createForm.notes || undefined,
        clientId: createForm.clientId || undefined,
        guestName: createForm.clientId ? undefined : createForm.guestName,
        guestEmail: createForm.clientId ? undefined : createForm.guestEmail,
        guestPhone: createForm.clientId ? undefined : createForm.guestPhone
      });

      setMessage('Reserva manual creada correctamente');
      setShowCreate(false);
      setCreateForm({
        serviceId: '',
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        clientId: '',
        guestName: '',
        guestEmail: '',
        guestPhone: ''
      });
      setClientQuery('');
      setClientResults([]);
      setSelectedClient(null);
      setSlots([]);
      setSelectedSlot(null);
      fetchReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la reserva manual');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestión de Reservas</h1>
            <p className="text-slate-500 text-sm mt-1">Administra y controla todas las reservas</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${import.meta.env.VITE_API_URL || '/api'}/reservations/export/${user?.businessId}?format=xlsx`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar Excel
            </a>
            <a
              href={`${import.meta.env.VITE_API_URL || '/api'}/reservations/export/${user?.businessId}?format=pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 transition-all font-semibold text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exportar PDF
            </a>
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-blue-500/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva reserva
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-semibold text-slate-600">Fecha:</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="flex-1 text-right">
              <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                {reservations.length} {reservations.length === 1 ? 'reserva' : 'reservas'}
              </span>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-xl bg-green-50 border border-green-100 text-green-700 p-4 text-sm flex items-center gap-3">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-100 text-red-700 p-4 text-sm flex items-center gap-3">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800">No hay reservas</h3>
            <p className="text-slate-500 mt-1">No hay reservas registradas para esta fecha</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md hover:border-slate-200 transition-all">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold">
                        {(r.client?.name || r.guestName || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{r.client?.name || r.guestName || 'Sin cuenta'}</p>
                        <p className="text-sm text-slate-500">{r.service?.name} — {new Date(r.startTime).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</p>
                        {r.employee && <p className="text-xs text-slate-400">Empleado: {r.employee.name}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_LABELS[r.status]?.color}`}>
                      {STATUS_LABELS[r.status]?.label}
                    </span>
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-slate-100">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">Nueva reserva manual</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateManualReservation} className="p-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Servicio</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={createForm.serviceId}
                    onChange={(e) => setCreateForm({ ...createForm, serviceId: e.target.value })}
                    required
                  >
                    <option value="">Selecciona servicio</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Empleado (opcional)</label>
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={createForm.employeeId}
                    onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                  >
                    <option value="">Sin preferencia</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>{employee.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Buscar cliente</label>
                  <input
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Nombre o email"
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setSelectedClient(null);
                      setCreateForm({ ...createForm, clientId: '' });
                    }}
                  />
                  {searchingClients && <p className="mt-1 text-xs text-slate-500">Buscando...</p>}
                  {!selectedClient && clientResults.length > 0 && (
                    <div className="mt-2 max-h-36 overflow-auto rounded-xl border border-slate-200 bg-white">
                      {clientResults.map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(client);
                            setCreateForm({ ...createForm, clientId: client.id });
                            setClientQuery(`${client.name} (${client.email})`);
                            setClientResults([]);
                          }}
                          className="block w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors"
                        >
                          <span className="font-medium text-slate-800">{client.name}</span>
                          <span className="ml-2 text-slate-500">{client.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="mt-2 flex items-center justify-between rounded-xl bg-green-50 border border-green-100 px-4 py-2.5 text-sm text-green-700">
                      <span className="font-medium">Cliente: {selectedClient.name}</span>
                      <button
                        type="button"
                        className="text-green-700 hover:underline text-xs"
                        onClick={() => {
                          setSelectedClient(null);
                          setClientQuery('');
                          setCreateForm({ ...createForm, clientId: '' });
                        }}
                      >
                        Quitar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {!createForm.clientId && (
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    className="border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Nombre invitado"
                    value={createForm.guestName}
                    onChange={(e) => setCreateForm({ ...createForm, guestName: e.target.value })}
                  />
                  <input
                    type="email"
                    className="border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Correo invitado"
                    value={createForm.guestEmail}
                    onChange={(e) => setCreateForm({ ...createForm, guestEmail: e.target.value })}
                  />
                  <input
                    className="border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="Teléfono invitado"
                    value={createForm.guestPhone}
                    onChange={(e) => setCreateForm({ ...createForm, guestPhone: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Slots disponibles</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        !slot.available
                          ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                          : selectedSlot?.startTime === slot.startTime
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                rows={3}
                placeholder="Notas (opcional)"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-slate-200 text-slate-600 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-500/30"
                >
                  {creating ? 'Creando...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}