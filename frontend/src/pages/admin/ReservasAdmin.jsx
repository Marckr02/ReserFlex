import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';

const STATUS_LABELS = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETADA: { label: 'Completada', color: 'bg-green-100 text-green-800' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  NO_SE_PRESENTO: { label: 'No se presentó', color: 'bg-gray-100 text-gray-700' },
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
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminNav />
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Reservas</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Nueva reserva
          </button>
        </div>
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-700">Fecha:</label>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
          <span className="text-sm text-gray-500">{reservations.length} reservas</span>
        </div>
        {message && <p className="text-emerald-700 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? <p>Cargando...</p> : reservations.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
            No hay reservas para esta fecha
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map(r => (
              <div key={r.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
                <div>
                  <p className="font-semibold">{r.client?.name || r.guestName || 'Sin cuenta'}</p>
                  <p className="text-sm text-gray-500">{r.service?.name} — {new Date(r.startTime).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}</p>
                  {r.employee && <p className="text-xs text-gray-400">Empleado: {r.employee.name}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[r.status]?.color}`}>
                    {STATUS_LABELS[r.status]?.label}
                  </span>
                  <select
                    value={r.status}
                    onChange={e => updateStatus(r.id, e.target.value)}
                    className="text-xs border rounded-lg px-2 py-1">
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva reserva manual</h2>

            <form onSubmit={handleCreateManualReservation} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Servicio</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Empleado (opcional)</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
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

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    value={createForm.date}
                    onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Buscar cliente (nombre o email)</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Ej: marco@correo.com"
                    value={clientQuery}
                    onChange={(e) => {
                      setClientQuery(e.target.value);
                      setSelectedClient(null);
                      setCreateForm({ ...createForm, clientId: '' });
                    }}
                  />
                  {searchingClients && <p className="mt-1 text-xs text-gray-500">Buscando...</p>}
                  {!selectedClient && clientResults.length > 0 && (
                    <div className="mt-2 max-h-36 overflow-auto rounded-lg border border-gray-200 bg-white">
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
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-800">{client.name}</span>
                          <span className="ml-2 text-gray-500">{client.email}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedClient && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      <span>Cliente seleccionado: {selectedClient.name}</span>
                      <button
                        type="button"
                        className="text-emerald-700 hover:underline"
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
                <div className="grid gap-3 md:grid-cols-3">
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Nombre invitado"
                    value={createForm.guestName}
                    onChange={(e) => setCreateForm({ ...createForm, guestName: e.target.value })}
                  />
                  <input
                    type="email"
                    className="rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Correo invitado"
                    value={createForm.guestEmail}
                    onChange={(e) => setCreateForm({ ...createForm, guestEmail: e.target.value })}
                  />
                  <input
                    className="rounded-lg border border-gray-300 px-3 py-2"
                    placeholder="Teléfono invitado"
                    value={createForm.guestPhone}
                    onChange={(e) => setCreateForm({ ...createForm, guestPhone: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Slots disponibles</label>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {slots.map((slot) => (
                    <button
                      key={`${slot.startTime}-${slot.endTime}`}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => slot.available && setSelectedSlot(slot)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium ${!slot.available ? 'bg-gray-100 text-gray-400' : selectedSlot?.startTime === slot.startTime ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'}`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                rows={3}
                placeholder="Notas (opcional)"
                value={createForm.notes}
                onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Confirmar reserva'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
