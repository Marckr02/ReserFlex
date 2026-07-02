import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import AdminNav from '../../components/AdminNav';
import { Star, MessageCircle, Check } from 'lucide-react';

const RATING_STYLES = {
  1: { bg: 'bg-red-100', text: 'text-red-700', label: 'Muy malo' },
  2: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Malo' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Regular' },
  4: { bg: 'bg-lime-100', text: 'text-lime-700', label: 'Bueno' },
  5: { bg: 'bg-green-100', text: 'text-green-700', label: 'Excelente' }
};

export default function Resenas() {
  const { user } = useAuth();
  const businessId = user?.businessId;
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ averageRating: 0, totalReviews: 0, ratingDistribution: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async (pageNum = 1) => {
    if (!businessId) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/reviews/business/${businessId}`, {
        params: { page: pageNum, limit: 10 }
      });
      setReviews(data.reviews);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!businessId) return;
    try {
      const { data } = await api.get(`/reviews/business/${businessId}/stats`);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadReviews(page);
    loadStats();
  }, [businessId, page]);

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await api.patch(`/reviews/${reviewId}/reply`, { reply: replyText });
      setReplyingTo(null);
      setReplyText('');
      loadReviews(page);
      loadStats();
    } catch (err) {
      console.error('Error replying:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'ADMIN_NEGOCIO' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No tienes acceso a esta página</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Reseñas y Calificaciones</h1>
          <p className="text-slate-500 mt-1">Gestiona las opiniones de tus clientes</p>
        </div>

        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{stats.averageRating || 0}</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Calificación promedio</p>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= Math.round(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Total de reseñas</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalReviews}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-3">Distribución</p>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution?.[rating] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-xs w-4 text-slate-500">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
              <MessageCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Sin reseñas aún</h3>
            <p className="text-slate-500 mt-1">Las reseñas aparecerán cuando los clientes califiquen sus visitas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const ratingStyle = RATING_STYLES[review.rating] || RATING_STYLES[3];
              return (
                <div key={review.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${ratingStyle.bg} ${ratingStyle.text}`}>
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {review.rating} - {ratingStyle.label}
                        </span>
                        <span className="text-sm text-slate-400">
                          {new Date(review.createdAt).toLocaleDateString('es-EC', { dateStyle: 'medium' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-1">
                        <strong>{review.clientName}</strong> en {review.serviceName}
                      </p>
                      {review.comment && (
                        <p className="text-slate-700 mt-2 italic">"{review.comment}"</p>
                      )}

                      {review.reply ? (
                        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold text-green-700">Respuesta del negocio</span>
                          </div>
                          <p className="text-sm text-green-800">{review.reply}</p>
                        </div>
                      ) : (
                        replyingTo === review.id ? (
                          <div className="mt-4 space-y-3">
                            <textarea
                              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                              rows={3}
                              placeholder="Escribe tu respuesta..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReply(review.id)}
                                disabled={submitting || !replyText.trim()}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                              >
                                {submitting ? 'Enviando...' : 'Enviar respuesta'}
                              </button>
                              <button
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-200"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyingTo(review.id)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-semibold"
                          >
                            Responder a esta reseña
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-sm text-slate-500">
              Página {page} de {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold disabled:opacity-50 hover:bg-slate-50"
            >
              Siguiente
            </button>
          </div>
        )}
      </main>
    </div>
  );
}