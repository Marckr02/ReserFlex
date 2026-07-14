const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createBusiness, getAllBusinesses, getPublicBusinesses, getBusinessBySlug, checkSlug, toggleBusiness } = require('../controllers/business.controller');

router.post('/', authenticate, authorize('SUPER_ADMIN'), createBusiness);
router.get('/', authenticate, authorize('SUPER_ADMIN'), getAllBusinesses);
router.get('/public', getPublicBusinesses);
router.get('/check-slug', checkSlug);
router.get('/slug/:slug', getBusinessBySlug);
router.patch('/:id/toggle', authenticate, authorize('SUPER_ADMIN'), toggleBusiness);

module.exports = router;
