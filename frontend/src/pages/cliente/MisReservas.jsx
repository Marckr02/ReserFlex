import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const STATUS_COLORS = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  COMPLETADA: 'bg-green-100 text-green-800',
  CANCELADA: 'bg-red-100 text-red-800',
  NO_SE_PRESENTO: 'bg-gray-100 text-gray-700',
};

export default function MisReservas() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReservations = async () => {
    try {
      const { data } = await api.get('/reservations/my', {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(businessFilter ? { businessId: businessFilter } : {})
        }
      });
      setReservations(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar tus reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [statusFilter, businessFilter]);

  const handleCancel = async (id) => {
    if (!confirm('¿Deseas cancelar esta reserva?')) return;
    try {
      await api.patch(`/reservations/${id}/cancel`);
      setMessage('Reserva cancelada correctamente');
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cancelar la reserva');
    }
  };

  const businessOptions = Array.from(
    new Map(reservations.map((reservation) => [reservation.business?.id, reservation.business?.name]).filter(([id]) => Boolean(id)))
  ).map(([id, name]) => ({ id, name }));

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Cliente</p>
          <h1 className="mt-2 text-3xl font-bold">Mis reservas</h1>
          <p className="mt-2 text-white/70">{user?.name || 'Usuario'} puede revisar su historial y cancelar dentro del plazo permitido.</p>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Filtrar por estado</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="COMPLETADA">Completada</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_SE_PRESENTO">No se presentó</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Filtrar por negocio</label>
            <select
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={businessFilter}
              onChange={(e) => setBusinessFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {businessOptions.map((business) => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-6 grid gap-4">
          {reservations.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
              No tienes reservas registradas.
            </div>
          ) : (
            reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{reservation.service?.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{reservation.business?.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {new Date(reservation.startTime).toLocaleString('es-EC', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm ${STATUS_COLORS[reservation.status] || 'bg-slate-100 text-slate-700'}`}>
                      {reservation.status}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:items-end">
                    {reservation.status !== 'CANCELADA' && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                      >
                        Cancelar
                      </button>
                    )}
                    {reservation.employee?.name && (
                      <p className="text-sm text-slate-500">Empleado: {reservation.employee.name}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
