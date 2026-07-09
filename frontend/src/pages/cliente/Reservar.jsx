import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { getTheme } from '../../utils/themeHelper';

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Top Header Card Skeleton */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 animate-pulse space-y-3">
          <div className="h-4 w-24 rounded-full bg-slate-200"></div>
          <div className="h-8 w-64 rounded-xl bg-slate-200"></div>
          <div className="h-4 w-96 rounded-lg bg-slate-150"></div>
        </div>

        {/* Content Columns Skeleton */}
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-5 animate-pulse">
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-slate-200"></div>
              <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-16 rounded bg-slate-200"></div>
                <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-slate-200"></div>
                <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 rounded bg-slate-200"></div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((slot) => (
                  <div key={slot} className="h-11 rounded-xl bg-slate-100"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-sm space-y-5 animate-pulse">
            <div className="h-5 w-40 rounded bg-slate-200"></div>
            <div className="space-y-3">
              <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
              <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
              <div className="h-11 rounded-xl bg-slate-100 w-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-slate-200"></div>
              <div className="h-24 rounded-xl bg-slate-100 w-full"></div>
            </div>
            <div className="h-12 w-full rounded-xl bg-slate-200 mt-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reservar() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState(params.get('serviceId') || '');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '', employeeId: '', guest: false });
  const minDate = new Date().toISOString().split('T')[0];
const [showMobileCta, setShowMobileCta] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const businessRes = await api.get(`/business/slug/${slug}`);
        setBusiness(businessRes.data);
        const servicesRes = await api.get(`/services/${businessRes.data.id}`);
        setServices(servicesRes.data);
        if (!serviceId && servicesRes.data[0]?.id) {
          setServiceId(servicesRes.data[0].id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudo cargar la reserva');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug]);

  const selectedService = useMemo(
    () => services.find((item) => item.id === serviceId),
    [services, serviceId]
  );

useEffect(() => {
  const handleScroll = () => setShowMobileCta(window.scrollY > 320);
  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

const todayStr = new Date().toISOString().split('T')[0];
const slotCount = useMemo(() => {
  return slots.reduce((acc, slot) => acc + (slot.available ? 1 : 0), 0);
}, [slots]);
const [previewDate, setPreviewDate] = useState(todayStr);

useEffect(() => {
  setPreviewDate(date || todayStr);
}, [date, todayStr]);

useEffect(() => {
  const loadSlots = async () => {
      if (!business?.id || !serviceId || !date) return;
      try {
        const { data } = await api.get('/reservations/slots', {
          params: { businessId: business.id, serviceId, employeeId: form.employeeId || undefined, date }
        });
        setSlots(data.slots || []);
        setSelectedSlot(null);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los horarios');
      }
    };

    loadSlots();
  }, [business, serviceId, date, form.employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setConfirmedReservation(null);

    if (!selectedSlot) {
      setError('Selecciona un horario de reserva');
      return;
    }

    const startTime = `${date}T${selectedSlot.startTime}:00`;
    const payload = {
      businessId: business.id,
      serviceId,
      employeeId: form.employeeId || undefined,
      startTime,
      notes: form.notes || undefined
    };

    try {
      if (user?.token) {
        await api.post('/reservations', payload);
        setMessage('Reserva creada correctamente');
        setConfirmedReservation({ serviceName: selectedService?.name, startTime, guest: false });
      } else {
        await api.post('/reservations/guest', {
          ...payload,
          guestName: form.name,
          guestEmail: form.email,
          guestPhone: form.phone
        });
        setMessage('Reserva creada. Revisa tu correo para el código de acceso');
        setConfirmedReservation({ serviceName: selectedService?.name, startTime, guest: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la reserva');
    }
  };

  const theme = useMemo(() => {
    return getTheme(business?.type);
  }, [business]);

  if (loading) {
    return <SkeletonLoader />;
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center shadow-lg border border-slate-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 mb-4">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Negocio no disponible</h1>
          <p className="mt-2 text-slate-600">El negocio no existe o no se encuentra habilitado temporalmente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 px-4 py-10 relative">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl pointer-events-none"></div>

<div className="mx-auto max-w-5xl relative z-10">

{/* Breadcrumbs */}
<nav className="mb-4">
  <ol className="flex items-center gap-2 text-xs font-medium">
    <li><Link to="/catalogo" className="text-stone-400 hover:text-stone-600 transition">Catálogo</Link></li>
    <li className="text-stone-300">/</li>
    <li><Link to={`/catalogo/${slug}`} className="text-stone-500 hover:text-stone-700 transition truncate max-w-[180px]">{business?.name}</Link></li>
    <li className="text-stone-300">/</li>
    <li className="text-slate-900 font-bold truncate">{selectedService?.name}</li>
  </ol>
</nav>

{/* Top business header banner */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 mb-6 transition hover:shadow-md duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme.primaryText}`}>
                Confirmar reserva
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-slate-900 tracking-tight">{business.name}</h1>
              <p className="mt-2 text-sm text-slate-500 flex items-center font-medium gap-1">
                <svg className="h-4.5 w-4.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                {business.address}
              </p>
            </div>
            
            <Link 
              to={`/catalogo/${slug}`} 
              className={`rounded-2xl border ${theme.border} ${theme.softBg} ${theme.primaryText} px-4 py-2 text-xs font-bold hover:bg-white hover:shadow-sm transition duration-300 text-center`}
            >
              ← Ver catálogo
            </Link>
          </div>
        </div>

        {/* Dynamic Booking form */}
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          
          {/* Column 1: Configuration */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-5 transition hover:shadow-md duration-300">
<div>
  <label className="mb-2 block text-sm font-bold text-slate-700">Servicio</label>
  <div className="grid grid-cols-1 gap-2 max-h-[320px] overflow-y-auto pr-1">
    {services.map((service) => {
      const active = serviceId === service.id;
      return (
        <button
          key={service.id}
          type="button"
          onClick={() => setServiceId(service.id)}
          className={`w-full text-left rounded-2xl border p-4 transition-all duration-200 ${
            active
              ? `${theme.softBg} ${theme.border} ring-1 ${theme.ring} shadow-sm`
              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={`text-sm font-bold ${active ? theme.primaryText : 'text-slate-900'}`}>{service.name}</p>
              {service.description && (
                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{service.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {service.duration} min
                </span>
                {service.employeeServices?.length > 0 && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {service.employeeServices.length}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Desde</p>
              <p className={`text-lg font-black ${active ? theme.primaryText : 'text-slate-900'}`}>${service.price}</p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
</div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Fecha de visita</label>
                <input 
                  type="date" 
                  min={minDate} 
                  className={`w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition font-medium text-slate-700`}
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Profesional (opcional)</label>
                <div className="relative">
                  <select 
                    className="w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
                    value={form.employeeId} 
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  >
                    <option value="">Cualquier profesional</option>
                    {selectedService?.employeeServices?.map((item) => (
                      <option key={item.employee.id} value={item.employee.id}>
                        {item.employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">Horarios disponibles</label>
              
              {date ? (
                slots.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 font-medium">
                    No hay turnos disponibles para esta fecha. Intenta cambiar de profesional o de día.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {slots.map((slot) => {
                      const isSelected = selectedSlot?.startTime === slot.startTime;
                      return (
                        <button
                          type="button"
                          key={`${slot.startTime}-${slot.endTime}`}
                          onClick={() => slot.available && setSelectedSlot(slot)}
                          disabled={!slot.available}
                          className={`rounded-2xl border px-4 py-3 text-sm font-bold tracking-wide transition duration-300 transform active:scale-95 flex items-center justify-center gap-1 shadow-sm ${
                            slot.available 
                              ? isSelected 
                                ? `${theme.selectedSlot}` 
                                : `border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50` 
                              : 'border-slate-100 bg-slate-50 text-slate-300 line-through cursor-not-allowed shadow-none'
                          }`}
                        >
                          <svg className={`h-4 w-4 shrink-0 ${slot.available ? (isSelected ? 'text-white' : 'text-slate-400') : 'text-slate-200'}`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
                  <svg className="h-8 w-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Selecciona una fecha arriba para cargar horarios disponibles.
                </div>
              )}

              {selectedSlot && (
                <div className={`mt-4 rounded-2xl ${theme.softBg} border ${theme.border} px-4 py-3 text-sm font-bold ${theme.softText} flex items-center gap-2`}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Horario seleccionado: {selectedSlot.startTime} a {selectedSlot.endTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Client Info & Submit */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200/80 space-y-5 flex flex-col justify-between transition hover:shadow-md duration-300">
            <div className="space-y-4">
              {!user?.token ? (
                <>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Datos del cliente
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Completa tus datos para crear una reserva rápida sin necesidad de registrarte.</p>
                  
                  <div className="space-y-3">
                    <input 
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition font-medium text-slate-700" 
                      placeholder="Nombre completo" 
                      value={form.name} 
                      onChange={(e) => setForm({ ...form, name: e.target.value })} 
                      required 
                    />
                    <input 
                      type="email" 
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition font-medium text-slate-700" 
                      placeholder="Correo electrónico" 
                      value={form.email} 
                      onChange={(e) => setForm({ ...form, email: e.target.value })} 
                      required 
                    />
                    <input 
                      className="w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition font-medium text-slate-700" 
                      placeholder="Teléfono móvil" 
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                      required 
                    />
                  </div>
                </>
              ) : (
                <div className={`rounded-2xl ${theme.softBg} border ${theme.border} p-4 text-sm font-semibold text-slate-700 flex items-start gap-3`}>
                  <svg className={`h-5 w-5 ${theme.primaryText} mt-0.5 shrink-0`} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div>
                    <p className={`font-bold ${theme.primaryText}`}>Sesión activa como {user.name}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">La reserva quedará guardada automáticamente en tu historial de cliente.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">Notas especiales (opcional)</label>
                <textarea 
                  className="w-full rounded-2xl border border-slate-200 px-3.5 py-3 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition font-medium text-slate-700" 
                  rows={4} 
                  value={form.notes} 
                  onChange={(e) => setForm({ ...form, notes: e.target.value })} 
                  placeholder="Detalla cualquier requerimiento o indicación especial aquí..." 
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {message && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm font-semibold flex items-start gap-2.5">
                  <svg className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>{message}</span>
                </div>
              )}

              {confirmedReservation && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 text-emerald-900 shadow-sm space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Reserva confirmada con éxito
                  </div>
                  <div className="text-sm font-semibold space-y-1">
                    <p className="text-slate-700">{confirmedReservation.serviceName}</p>
                    <p className="text-slate-500 font-medium">
                      {new Date(confirmedReservation.startTime).toLocaleString('es-EC', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed pt-1 border-t border-emerald-100">
                    {confirmedReservation.guest 
                      ? 'Se ha enviado un código de acceso único a tu correo electrónico para que gestiones tu cita en el portal.'
                      : 'Esta reserva ya está vinculada a tu cuenta y puedes verla en tu perfil.'}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm font-semibold flex items-start gap-2.5">
                  <svg className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button 
                type="submit" 
                className={`w-full rounded-2xl ${theme.button} px-4 py-3.5 font-bold tracking-wide transition shadow-sm hover:shadow transform active:scale-95`}
              >
                Confirmar reserva
              </button>
            </div>
</div>

{showMobileCta && (
  <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
    <div className="flex items-center justify-between gap-3 max-w-5xl mx-auto">
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-900 truncate">{selectedService?.name}</p>
        <p className="text-[10px] text-slate-500 font-medium">
          {selectedSlot ? `${selectedSlot.startTime} · $${selectedService?.price}` : 'Selecciona un horario'}
        </p>
      </div>
      <button
        type="submit"
        disabled={!selectedSlot}
        className={`shrink-0 rounded-xl ${theme.button} px-5 py-2.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed transition`}
      >
        Confirmar
      </button>
    </div>
  </div>
)}
</form>
      </div>
    </div>
  );
}
