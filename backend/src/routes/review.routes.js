const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/review.controller');

router.post('/', authenticate, ctrl.createReview);
router.get('/business/:businessId', ctrl.getReviewsByBusiness);
router.get('/business/:businessId/stats', ctrl.getReviewStats);
router.patch('/:id/reply', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), ctrl.replyToReview);

module.exports = router;