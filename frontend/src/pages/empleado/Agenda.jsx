import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function Agenda() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/reservations/employee', {
          params: date ? { date } : {}
        });
        setReservations(data);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar la agenda');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [date]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-r from-amber-900 via-orange-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-200">Empleado</p>
          <h1 className="mt-2 text-3xl font-bold">Mi agenda</h1>
          <p className="mt-2 text-white/70">{user?.name || 'Empleado'} puede revisar sus citas programadas.</p>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <label className="mb-2 block text-sm font-medium text-slate-700">Filtrar por fecha</label>
          <input type="date" className="rounded-xl border border-slate-300 px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        {error && <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-6 grid gap-4">
          {reservations.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
              No hay reservas para la fecha seleccionada.
            </div>
          ) : (
            reservations.map((reservation) => (
              <div key={reservation.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{reservation.service?.name}</h2>
                    <p className="mt-1 text-sm text-slate-600">{reservation.client?.name || reservation.guestName || 'Cliente sin cuenta'}</p>
                    <p className="mt-1 text-sm text-slate-600">{new Date(reservation.startTime).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{reservation.status}</p>
                  </div>
                  <div className="text-right text-sm text-slate-500">
                    <p>{reservation.client?.email || reservation.guestEmail || ''}</p>
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
