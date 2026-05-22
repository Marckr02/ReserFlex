import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const emptyWeek = () =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: '09:00',
    endTime: '18:00',
    isActive: dayOfWeek !== 0
  }));

export default function Horarios() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(user?.businessId || '');
  const [schedules, setSchedules] = useState(emptyWeek());
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

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!selectedBusinessId) return;
      try {
        const { data } = await api.get(`/schedules/${selectedBusinessId}`);
        if (data.length === 0) {
          setSchedules(emptyWeek());
          return;
        }
        setSchedules(
          Array.from({ length: 7 }, (_, dayOfWeek) => {
            const existing = data.find((item) => item.dayOfWeek === dayOfWeek);
            return existing || { dayOfWeek, startTime: '09:00', endTime: '18:00', isActive: false };
          })
        );
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los horarios');
      }
    };

    fetchSchedules();
  }, [selectedBusinessId]);

  const businessLabel = useMemo(() => {
    if (!selectedBusinessId) return 'Selecciona un negocio';
    return businesses.find((item) => item.id === selectedBusinessId)?.name || 'Mi negocio';
  }, [businesses, selectedBusinessId]);

  const updateSchedule = (dayOfWeek, field, value) => {
    setSchedules((current) =>
      current.map((item) =>
        item.dayOfWeek === dayOfWeek ? { ...item, [field]: field === 'isActive' ? value : value } : item
      )
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await api.put(`/schedules/${selectedBusinessId}`, { schedules });
      setMessage('Horarios guardados correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar horarios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Sprint 2</p>
          <h1 className="mt-2 text-3xl font-bold">Horarios de atención</h1>
          <p className="mt-2 text-white/75">Configura la disponibilidad semanal para {businessLabel}.</p>
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

        <form onSubmit={handleSave} className="space-y-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          {schedules.map((schedule) => (
            <div key={schedule.dayOfWeek} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-5 md:items-center">
              <div className="font-semibold text-slate-800">{DAY_LABELS[schedule.dayOfWeek]}</div>
              <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-1">
                <input
                  type="checkbox"
                  checked={schedule.isActive}
                  onChange={(e) => updateSchedule(schedule.dayOfWeek, 'isActive', e.target.checked)}
                />
                Activo
              </label>
              <input
                type="time"
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={schedule.startTime}
                onChange={(e) => updateSchedule(schedule.dayOfWeek, 'startTime', e.target.value)}
                disabled={!schedule.isActive}
              />
              <input
                type="time"
                className="rounded-xl border border-slate-300 px-3 py-2"
                value={schedule.endTime}
                onChange={(e) => updateSchedule(schedule.dayOfWeek, 'endTime', e.target.value)}
                disabled={!schedule.isActive}
              />
            </div>
          ))}

          {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedBusinessId}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar horarios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
