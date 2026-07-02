import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Star } from 'lucide-react';

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
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReservation, setReviewReservation] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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

  const openRescheduleModal = (reservation) => {
    const initialDate = new Date(reservation.startTime).toISOString().split('T')[0];
    setSelectedReservation(reservation);
    setRescheduleDate(initialDate);
    setSelectedSlot(null);
    setRescheduleSlots([]);
    setShowReschedule(true);
  };

  useEffect(() => {
    const loadSlots = async () => {
      if (!showReschedule || !selectedReservation || !rescheduleDate) return;
      try {
        const { data } = await api.get('/reservations/slots', {
          params: {
            businessId: selectedReservation.business.id,
            serviceId: selectedReservation.service.id,
            employeeId: selectedReservation.employee?.id || undefined,
            date: rescheduleDate
          }
        });
        setRescheduleSlots(data.slots || []);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar los slots de reprogramación');
      }
    };

    loadSlots();
  }, [showReschedule, selectedReservation, rescheduleDate]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedReservation || !selectedSlot) {
      setError('Selecciona un horario para reprogramar');
      return;
    }

    setRescheduling(true);
    setError('');
    setMessage('');
    try {
      await api.patch(`/reservations/${selectedReservation.id}/reschedule`, {
        startTime: `${rescheduleDate}T${selectedSlot.startTime}:00`
      });
      setMessage('Reserva reprogramada correctamente');
      setShowReschedule(false);
      setSelectedReservation(null);
      await loadReservations();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo reprogramar la reserva');
    } finally {
      setRescheduling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setError('');
    try {
      await api.post('/reviews', {
        reservationId: reviewReservation.id,
        rating,
        comment
      });
      setMessage('¡Gracias por tu reseña!');
      setShowReviewModal(false);
      setReviewReservation(null);
      setRating(5);
      setComment('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la reseña');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewModal = (reservation) => {
    setReviewReservation(reservation);
    setRating(5);
    setComment('');
    setShowReviewModal(true);
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openRescheduleModal(reservation)}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                        >
                          Cancelar
                        </button>
                        {reservation.status === 'COMPLETADA' && (
                          <button
                            onClick={() => openReviewModal(reservation)}
                            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 flex items-center gap-1.5"
                          >
                            <Star className="h-4 w-4" />
                            Dejar reseña
                          </button>
                        )}
                      </div>
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

      {showReschedule && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Reprogramar reserva</h2>
            <p className="mt-1 text-sm text-slate-600">{selectedReservation.service?.name} - {selectedReservation.business?.name}</p>

            <form onSubmit={handleReschedule} className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Nueva fecha</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Horarios disponibles</label>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {rescheduleSlots.map((slot) => (
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

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {rescheduling ? 'Guardando...' : 'Confirmar reprogramación'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReschedule(false)}
                  className="flex-1 rounded-xl bg-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReviewModal && reviewReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900">Dejar tu reseña</h2>
            <p className="mt-1 text-sm text-slate-600">{reviewReservation.service?.name} - {reviewReservation.business?.name}</p>

            <form onSubmit={handleSubmitReview} className="mt-6 space-y-5">
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700">¿Cómo fue tu experiencia?</label>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-center text-sm text-slate-500">
                  {rating === 1 && 'Muy malo'}
                  {rating === 2 && 'Malo'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bueno'}
                  {rating === 5 && '¡Excelente!'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Comentario (opcional)</label>
                <textarea
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  rows={4}
                  placeholder="Cuéntanos más sobre tu experiencia..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submittingReview ? 'Enviando...' : 'Enviar reseña'}
                  <Star className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 rounded-xl bg-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-300"
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
