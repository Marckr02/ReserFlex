const { Prisma } = require('@prisma/client');
const prisma = require('../lib/prisma');

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

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { business: true }
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservación no encontrada' });
    }

    if (reservation.clientId !== clientId) {
      return res.status(403).json({ message: 'No puedes reseñar una reservación que no te pertenece' });
    }

    if (reservation.status !== 'COMPLETADA') {
      return res.status(400).json({ message: 'Solo puedes reseñar reservaciones completadas' });
    }

    const existingReview = await prisma.review.findUnique({
      where: { reservationId }
    });

    if (existingReview) {
      return res.status(409).json({ message: 'Ya existe una reseña para esta reservación' });
    }

    const review = await prisma.review.create({
      data: {
        reservationId,
        businessId: reservation.businessId,
        rating: parseInt(rating),
        comment
      },
      include: {
        reservation: {
          include: { service: true }
        }
      }
    });

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

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { businessId },
        include: {
          reservation: {
            include: {
              client: { select: { id: true, name: true } },
              service: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count({ where: { businessId } })
    ]);

    const reviewsWithReply = reviews.map(review => ({
      ...review,
      clientName: review.reservation?.client?.name || review.reservation?.guestName || 'Cliente',
      serviceName: review.reservation?.service?.name || 'Servicio'
    }));

    res.json({
      reviews: reviewsWithReply,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
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

    const review = await prisma.review.findUnique({
      where: { id },
      include: { business: true }
    });

    if (!review) {
      return res.status(404).json({ message: 'Reseña no encontrada' });
    }

    if (user.role === 'ADMIN_NEGOCIO' && review.businessId !== user.businessId) {
      return res.status(403).json({ message: 'No tienes permiso para responder a esta reseña' });
    }

    if (user.role === 'SUPER_ADMIN') {
    } else if (user.role !== 'ADMIN_NEGOCIO') {
      return res.status(403).json({ message: 'Solo el administrador del negocio puede responder' });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { reply: reply.trim() }
    });

    res.json({ message: 'Respuesta agregada exitosamente', review: updatedReview });
  } catch (error) {
    console.error('Error replyToReview:', error);
    res.status(500).json({ message: 'Error al responder la reseña' });
  }
};

const getReviewStats = async (req, res) => {
  try {
    const { businessId } = req.params;

    const [reviews, stats] = await Promise.all([
      prisma.review.findMany({
        where: { businessId },
        select: { rating: true }
      }),
      prisma.review.aggregate({
        where: { businessId },
        _avg: { rating: true },
        _count: true
      })
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    res.json({
      averageRating: stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0,
      totalReviews: stats._count,
      ratingDistribution
    });
  } catch (error) {
    console.error('Error getReviewStats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  createReview,
  getReviewsByBusiness,
  replyToReview,
  getReviewStats
};