const supabase = require('../lib/supabase');

const createReview = async (req, res) => {
  try {
    const { reservationId, rating, comment } = req.body;
    const clientId = req.user.id;

    if (!reservationId || !rating) {
      return res.status(400).json({ message: 'Reservación y calificación son requeridas' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La calificación debe ser entre 1 y 5' });
    }

    const { data: reservations } = await supabase.from('Reservation').select('*, business:Business(*)').eq('id', reservationId).limit(1);

    const reservation = reservations?.[0];
    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.clientId !== clientId) {
      return res.status(403).json({ message: 'No puedes reseñar una reservación que no te pertenece' });
    }

    if (reservation.status !== 'COMPLETADA') {
      return res.status(400).json({ message: 'Solo puedes reseñar reservaciones completadas' });
    }

    const { data: existingReviews } = await supabase.from('Review').select('id').eq('reservationId', reservationId).limit(1);

    if (existingReviews && existingReviews.length > 0) {
      return res.status(409).json({ message: 'Ya existe una reseña para esta reservación' });
    }

    const { data: review, error } = await supabase
      .from('Review')
      .insert({
        reservationId,
        businessId: reservation.businessId,
        rating: parseInt(rating),
        comment,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando reseña:', error);
      return res.status(500).json({ message: 'Error al crear la reseña' });
    }

    res.status(201).json({ message: 'Reseña creada exitosamente', review });
  } catch (error) {
    console.error('Error createReview:', error);
    res.status(500).json({ message: 'Error al crear la reseña' });
  }
};

const getReviewsByBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const { data: reviews } = await supabase
      .from('Review')
      .select('*, reservation:Reservation(*, client:ClientId(*), service:ServiceId(*))')
      .eq('businessId', businessId)
      .order('createdAt', { ascending: false })
      .range(skip, skip + parseInt(limit) - 1);

    const { count: total } = await supabase
      .from('Review')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId);

    const reviewsWithReply = (reviews || []).map((review) => ({
      ...review,
      clientName: review.reservation?.client?.name || review.reservation?.guestName || 'Cliente',
      serviceName: review.reservation?.service?.name || 'Servicio',
    }));

    res.json({
      reviews: reviewsWithReply,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        totalPages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getReviewsByBusiness:', error);
    res.status(500).json({ message: 'Error al obtener las reseñas' });
  }
};

const replyToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const user = req.user;

    if (!reply || reply.trim().length === 0) {
      return res.status(400).json({ message: 'La respuesta es requerida' });
    }

    const { data: reviews } = await supabase.from('Review').select('*, business:Business(*)').eq('id', id).limit(1);

    const review = reviews?.[0];
    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    if (user.role === 'ADMIN_NEGOCIO' && review.businessId !== user.businessId) {
      return res.status(403).json({ message: 'No tienes permiso para responder a esta reseña' });
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN_NEGOCIO') {
      return res.status(403).json({ message: 'Solo el administrador del negocio puede responder' });
    }

    const { data: updatedReview, error } = await supabase
      .from('Review')
      .update({ reply: reply.trim() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error respondiendo reseña:', error);
      return res.status(500).json({ message: 'Error al responder la reseña' });
    }

    res.json({ message: 'Respuesta agregada exitosamente', review: updatedReview });
  } catch (error) {
    console.error('Error replyToReview:', error);
    res.status(500).json({ message: 'Error al responder la reseña' });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const { businessId } = req.params;

    const { data: reviews } = await supabase.from('Review').select('rating').eq('businessId', businessId);

    const { data: statsData, error } = await supabase
      .from('Review')
      .select('rating')
      .eq('businessId', businessId);

    const reviewsData = statsData || [];
    const { count: totalReviews } = await supabase
      .from('Review')
      .select('*', { count: 'exact', head: true })
      .eq('businessId', businessId);

    const avgResult = reviewsData.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
      : 0;

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewsData.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    res.json({
      averageRating: parseFloat(avgResult.toFixed(1)),
      totalReviews: totalReviews || 0,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error getReviewStats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

module.exports = { createReview, getReviewsByBusiness, replyToReview, getReviewStats };
