const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessBySlug
} = require('../controllers/business.controller');

router.post('/', authenticate, authorize('SUPER_ADMIN'), createBusiness);
router.get('/', authenticate, authorize('SUPER_ADMIN'), getAllBusinesses);
router.get('/slug/:slug', getBusinessBySlug);
router.patch('/:id/toggle', authenticate, authorize('SUPER_ADMIN'), require('../controllers/business.controller').toggleBusiness);

module.exports = router;