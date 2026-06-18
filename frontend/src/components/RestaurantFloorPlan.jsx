import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_CONFIG = {
  available: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  busy: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
  soon: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  selected: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-700' },
};

export default function RestaurantFloorPlan({ businessId }) {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('20:00');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ guests: 2, occasion: '', guestName: '', guestEmail: '', guestPhone: '' });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    api.get(`/tables/${businessId}`, { params: { date, time } })
      .then(({ data }) => setTables(data))
      .catch(() => setToast('No se pudieron cargar las mesas'))
      .finally(() => setLoading(false));
  }, [businessId, date, time]);

  const handleTableClick = (table) => {
    if (table.status === 'busy') {
      setToast('Esta mesa está ocupada, elige otra');
      return;
    }

    setSelected(table);
    setShowModal(true);
  };

  const handleReserve = async () => {
    try {
      const payload = {
        tableId: selected.id,
        businessId,
        date,
        time,
        guests: form.guests,
        occasion: form.occasion,
      };

      if (user?.token && user?.role === 'CLIENTE') {
        payload.clientId = user.id || undefined;
      } else {
        payload.guestName = form.guestName;
        payload.guestEmail = form.guestEmail;
        payload.guestPhone = form.guestPhone;
      }

      await api.post('/tables/reserve', payload);
      setShowModal(false);
      setSelected(null);
      setToast('¡Reserva confirmada!');
      const { data } = await api.get(`/tables/${businessId}`, { params: { date, time } });
      setTables(data);
    } catch (err) {
      setToast(err.response?.data?.message || 'Error al reservar mesa');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        Cargando plano del restaurante...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Fecha</label>
            <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Hora</label>
            <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm">
              {['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <div className="flex flex-wrap gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-green-500 bg-green-100" /> Disponible</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-red-500 bg-red-100" /> Ocupada</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm border border-yellow-500 bg-yellow-100" /> Pronto libre</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-[360px] rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="absolute left-1/2 top-2 -translate-x-1/2 text-xs uppercase tracking-[0.35em] text-slate-400">
          Plano del restaurante
        </div>

        {tables.map((table) => {
          const isSelected = selected?.id === table.id;
          const statusKey = isSelected ? 'selected' : table.status;
          const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;
          const isRectangle = table.shape === 'rectangle';
          const isSquare = table.shape === 'square';
          const sizeClass = isRectangle ? 'w-[72px] h-[52px]' : isSquare ? 'w-[56px] h-[56px]' : 'w-[56px] h-[56px] rounded-full';

          return (
            <button
              key={table.id}
              type="button"
              onClick={() => handleTableClick(table)}
              className={`absolute flex select-none flex-col items-center justify-center border-2 transition hover:scale-105 ${cfg.bg} ${cfg.border} ${sizeClass}`}
              style={{ left: `${table.posX}%`, top: `${table.posY}%`, transform: 'translate(-50%, -50%)' }}
            >
              <span className={`text-xs font-semibold ${cfg.text}`}>M{table.number}</span>
              <span className="text-[11px] text-gray-500">👥 {table.capacity}</span>
            </button>
          );
        })}
      </div>

      {showModal && selected && (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold text-slate-900">
            Reservar Mesa {selected.number} · hasta {selected.capacity} personas
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Número de personas</label>
              <select value={form.guests} onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value, 10) })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm">
                {Array.from({ length: selected.capacity }, (_, index) => index + 1).map((quantity) => (
                  <option key={quantity} value={quantity}>{quantity}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Ocasión especial</label>
              <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm">
                <option value="">Ninguna</option>
                <option value="cumpleanos">Cumpleaños</option>
                <option value="aniversario">Aniversario</option>
                <option value="negocios">Reunión de negocios</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            {user?.role !== 'CLIENTE' && (
              <>
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm" placeholder="Nombre completo" value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} />
                <input type="email" className="rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm" placeholder="Correo" value={form.guestEmail} onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} />
                <input className="rounded-xl border border-slate-300 px-3 py-2 text-base sm:text-sm md:col-span-2" placeholder="Teléfono" value={form.guestPhone} onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} />
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => { setShowModal(false); setSelected(null); }} className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="button" onClick={handleReserve} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              Confirmar reserva
            </button>
          </div>
        </div>
      )}

      {toast && <div className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm text-white">{toast}</div>}
    </div>
  );
}