import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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

  const fetchReservations = async () => {
    if (!user?.businessId) return;
    try {
      const { data } = await api.get(`/reservations/business/${user.businessId}`, {
        params: { date }
      });
      setReservations(data);
    } catch (err) {
      setError('No se pudieron cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [date, user]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reservations/${id}/status`, { status });
      fetchReservations();
    } catch {
      setError('Error al actualizar estado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Reservas</h1>
        <div className="bg-white rounded-xl shadow p-4 mb-6 flex gap-4 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-700">Fecha:</label>
          <input type="date" value={date}
            onChange={e => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm" />
          <span className="text-sm text-gray-500">{reservations.length} reservas</span>
        </div>
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
    </div>
  );
}
