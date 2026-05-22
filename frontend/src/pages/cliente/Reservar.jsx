import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

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
      setError('Selecciona un horario');
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center text-slate-600">Negocio no disponible</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-600">Reservar cita</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">{business.name}</h1>
          <p className="mt-2 text-slate-600">{business.address}</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Servicio</label>
              <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.name} - ${service.price}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Fecha</label>
                <input type="date" className="w-full rounded-xl border border-slate-300 px-3 py-2" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Empleado (opcional)</label>
                <select className="w-full rounded-xl border border-slate-300 px-3 py-2" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                  <option value="">Sin preferencia</option>
                  {selectedService?.employeeServices?.map((item) => (
                    <option key={item.employee.id} value={item.employee.id}>{item.employee.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Horarios disponibles</label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {slots.map((slot) => (
                  <button
                    type="button"
                    key={`${slot.startTime}-${slot.endTime}`}
                    onClick={() => slot.available && setSelectedSlot(slot)}
                    disabled={!slot.available}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${slot.available ? (selectedSlot?.startTime === slot.startTime ? 'border-blue-600 bg-blue-600 text-white' : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-blue-400') : 'border-slate-200 bg-slate-100 text-slate-400 line-through cursor-not-allowed'}`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
              {slots.length === 0 && <p className="mt-2 text-sm text-slate-500">Selecciona fecha para ver disponibilidad.</p>}
              {selectedSlot && (
                <p className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Horario seleccionado: {selectedSlot.startTime} - {selectedSlot.endTime}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 space-y-4">
            {!user?.token && (
              <>
                <h2 className="text-xl font-bold text-slate-900">Datos del cliente</h2>
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Nombre completo" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <input type="email" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Notas</label>
              <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2" rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Indicaciones especiales o comentarios" />
            </div>

            {message && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p>}
            {confirmedReservation && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <p className="font-semibold">Reserva confirmada</p>
                <p className="mt-1 text-sm">
                  {confirmedReservation.serviceName} · {new Date(confirmedReservation.startTime).toLocaleString('es-EC', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
                <p className="text-xs mt-2 text-emerald-700">{confirmedReservation.guest ? 'Se envió un correo con el código de acceso.' : 'La reserva ya quedó registrada en tu cuenta.'}</p>
              </div>
            )}
            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700">
              Confirmar reserva
            </button>
            <Link to={`/catalogo/${slug}`} className="block text-center text-sm text-blue-600 hover:underline">
              Volver al catálogo
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
