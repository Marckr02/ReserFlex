import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const STATUS_CONFIG = {
  available: { 
    bg: 'bg-emerald-50 hover:bg-emerald-100/80', 
    border: 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.12)]', 
    text: 'text-emerald-700' 
  },
  busy: { 
    bg: 'bg-rose-50/60 cursor-not-allowed', 
    border: 'border-rose-300 opacity-60', 
    text: 'text-rose-500' 
  },
  soon: { 
    bg: 'bg-amber-50 hover:bg-amber-100/80', 
    border: 'border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.08)]', 
    text: 'text-amber-700' 
  },
  selected: { 
    bg: 'bg-blue-50/90 hover:bg-blue-100', 
    border: 'border-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.25)] ring-2 ring-blue-600/20 scale-105', 
    text: 'text-blue-700' 
  },
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
      setToast('Esta mesa está ocupada en este horario. Selecciona otra.');
      return;
    }

    setSelected(table);
    setForm(prev => ({
      ...prev,
      guests: Math.min(prev.guests, table.capacity)
    }));
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
      setToast('¡Reserva de mesa confirmada con éxito!');
      const { data } = await api.get(`/tables/${businessId}`, { params: { date, time } });
      setTables(data);
    } catch (err) {
      setToast(err.response?.data?.message || 'Error al reservar mesa');
    }
  };

  // Helper to render chairs around tables to give a premium floor plan look
  const renderChairs = (capacity, shape) => {
    const chairsCount = Math.min(capacity, 8);
    const chairs = [];

    for (let i = 0; i < chairsCount; i++) {
      if (shape === 'circle') {
        const angle = (i * 360) / chairsCount;
        const radius = 29; // px radius from center
        const x = Math.cos((angle * Math.PI) / 180) * radius;
        const y = Math.sin((angle * Math.PI) / 180) * radius;
        chairs.push(
          <span
            key={i}
            className="absolute w-2 h-2 rounded-full bg-slate-300 border border-white shadow-xs pointer-events-none"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      } else {
        // Rectangle or Square chairs positioning
        let positionClass = '';
        if (chairsCount === 2) {
          positionClass = i === 0 ? '-top-1 left-1/2 -translate-x-1/2' : '-bottom-1 left-1/2 -translate-x-1/2';
        } else if (chairsCount === 4) {
          if (i === 0) positionClass = '-top-1 left-1/2 -translate-x-1/2';
          else if (i === 1) positionClass = '-bottom-1 left-1/2 -translate-x-1/2';
          else if (i === 2) positionClass = '-left-1 top-1/2 -translate-y-1/2';
          else positionClass = '-right-1 top-1/2 -translate-y-1/2';
        } else {
          // 6 or 8 chairs
          if (i === 0) positionClass = '-top-1 left-1/4 -translate-x-1/2';
          else if (i === 1) positionClass = '-top-1 left-3/4 -translate-x-1/2';
          else if (i === 2) positionClass = '-bottom-1 left-1/4 -translate-x-1/2';
          else if (i === 3) positionClass = '-bottom-1 left-3/4 -translate-x-1/2';
          else if (i === 4) positionClass = '-left-1 top-1/4 -translate-y-1/2';
          else if (i === 5) positionClass = '-left-1 top-3/4 -translate-y-1/2';
          else if (i === 6) positionClass = '-right-1 top-1/4 -translate-y-1/2';
          else positionClass = '-right-1 top-3/4 -translate-y-1/2';
        }
        chairs.push(
          <span
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-slate-350 border border-white shadow-xs pointer-events-none ${positionClass}`}
          />
        );
      }
    }
    return chairs;
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-slate-400 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
        <p className="text-sm font-medium">Cargando plano interactivo del restaurante...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Date and Time selectors */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
            <input 
              type="date" 
              value={date} 
              min={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setDate(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100" 
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase tracking-wider">Hora</label>
            <select 
              value={time} 
              onChange={(e) => setTime(e.target.value)} 
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
            >
              {['12:00', '13:00', '14:00', '18:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'].map((slot) => (
                <option key={slot} value={slot}>{slot} hs</option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 md:col-span-1">
            <div className="flex flex-wrap gap-4 py-1 text-xs font-bold text-slate-500 uppercase tracking-wide">
              <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-md border border-emerald-500 bg-emerald-100/50 shadow-sm" /> Disponible</span>
              <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-md border border-rose-300 bg-rose-50/60 opacity-60" /> Ocupada</span>
              <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-md border border-amber-400 bg-amber-100/50 shadow-sm" /> Pronto Libre</span>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Canvas Blueprint */}
      <div className="relative h-[420px] rounded-3xl border-2 border-dashed border-slate-350 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px] bg-slate-50 shadow-inner overflow-hidden mb-6">
        
        {/* Architect blueprint layout guides */}
        <div className="absolute left-1/2 top-4.5 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.45em] text-slate-400 select-none">
          Plano de Distribución
        </div>

        {/* Decorative entrance zone */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-20 w-3 bg-slate-300 rounded-r-lg shadow-sm border-r border-slate-400 flex items-center justify-center select-none">
          <span className="text-[8px] font-black text-slate-600 rotate-90 tracking-widest uppercase">Entrada</span>
        </div>

        {/* Decorative kitchen/bar zone */}
        <div className="absolute bottom-0 right-8 w-44 h-8 bg-slate-200 rounded-t-xl border-t border-x border-slate-300/80 shadow-sm flex items-center justify-center select-none">
          <span className="text-[9px] font-black text-slate-500 tracking-[0.25em] uppercase">Barra / Cocina</span>
        </div>

        {/* Decorative terrace zone */}
        <div className="absolute top-0 right-12 w-32 h-6 bg-slate-100 border-b border-x border-slate-200 shadow-xs flex items-center justify-center select-none">
          <span className="text-[8px] font-black text-slate-400 tracking-[0.25em] uppercase">Terraza</span>
        </div>

        {/* Dynamic tables map */}
        {tables.map((table) => {
          const isSelected = selected?.id === table.id;
          const statusKey = isSelected ? 'selected' : table.status;
          const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.available;
          
          const isRectangle = table.shape === 'rectangle';
          const isSquare = table.shape === 'square';
          
          const sizeClass = isRectangle 
            ? 'w-[76px] h-[54px] rounded-xl' 
            : isSquare 
              ? 'w-[58px] h-[58px] rounded-xl' 
              : 'w-[60px] h-[60px] rounded-full';

          return (
            <div
              key={table.id}
              className="absolute"
              style={{ left: `${table.posX}%`, top: `${table.posY}%`, transform: 'translate(-50%, -50%)' }}
            >
              {/* Chairs surrounding table */}
              {renderChairs(table.capacity, table.shape)}

              {/* Table Button */}
              <button
                type="button"
                onClick={() => handleTableClick(table)}
                className={`relative flex select-none flex-col items-center justify-center border-2 transition-all duration-300 hover:scale-105 active:scale-95 ${cfg.bg} ${cfg.border} ${sizeClass}`}
              >
                <span className={`text-xs font-extrabold ${cfg.text}`}>Mesa {table.number}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5">Cap. {table.capacity}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation form modal */}
      {showModal && selected && (
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300">
          <h3 className="mb-4 text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
            </svg>
            Reservar Mesa {selected.number} · Aforo para {selected.capacity} personas
          </h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Cantidad de comensales</label>
              <select 
                value={form.guests} 
                onChange={(e) => setForm({ ...form, guests: parseInt(e.target.value, 10) })} 
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
              >
                {Array.from({ length: selected.capacity }, (_, index) => index + 1).map((quantity) => (
                  <option key={quantity} value={quantity}>{quantity} {quantity === 1 ? 'persona' : 'personas'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500 uppercase">Ocasión especial</label>
              <select 
                value={form.occasion} 
                onChange={(e) => setForm({ ...form, occasion: e.target.value })} 
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-100"
              >
                <option value="">Ninguna</option>
                <option value="cumpleanos">🎂 Cumpleaños</option>
                <option value="aniversario">💍 Aniversario</option>
                <option value="negocios">💼 Reunión de negocios</option>
                <option value="otro">✨ Otro festejo</option>
              </select>
            </div>

            {user?.role !== 'CLIENTE' && (
              <div className="md:col-span-2 grid gap-3 md:grid-cols-2 pt-2 border-t border-slate-100">
                <div className="md:col-span-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente (Reserva Manual)</p>
                </div>
                <input 
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100" 
                  placeholder="Nombre completo" 
                  value={form.guestName} 
                  onChange={(e) => setForm({ ...form, guestName: e.target.value })} 
                  required
                />
                <input 
                  type="email" 
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100" 
                  placeholder="Correo de contacto" 
                  value={form.guestEmail} 
                  onChange={(e) => setForm({ ...form, guestEmail: e.target.value })} 
                  required
                />
                <input 
                  className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-base sm:text-sm font-semibold text-slate-700 md:col-span-2 focus:outline-none focus:ring-2 focus:ring-slate-100" 
                  placeholder="Teléfono móvil" 
                  value={form.guestPhone} 
                  onChange={(e) => setForm({ ...form, guestPhone: e.target.value })} 
                  required
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 flex gap-3">
            <button 
              type="button" 
              onClick={() => { setShowModal(false); setSelected(null); }} 
              className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 transition duration-300"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleReserve} 
              className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 transition duration-300 shadow-sm"
            >
              Confirmar mesa
            </button>
          </div>
        </div>
      )}

      {/* Floating toast message */}
      {toast && (
        <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white shadow-md flex items-center justify-between gap-3 animate-fade-in">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="text-slate-400 hover:text-white font-bold text-xs">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}