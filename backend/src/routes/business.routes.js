const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const {
  createBusiness,
  getAllBusinesses,
  getBusinessBySlug,
  checkSlug,
  toggleBusiness,
  getBusinessPhotos,
  uploadBusinessPhotos
} = require('../controllers/business.controller');
const { upload } = require('../services/upload.service');

router.post('/', authenticate, authorize('SUPER_ADMIN'), createBusiness);
router.get('/', authenticate, authorize('SUPER_ADMIN'), getAllBusinesses);
router.get('/check-slug', checkSlug);
router.get('/slug/:slug', getBusinessBySlug);
router.patch('/:id/toggle', authenticate, authorize('SUPER_ADMIN'), toggleBusiness);
router.get('/:id/photos', getBusinessPhotos);
router.post('/:id/photos', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), upload.array('photos', 5), uploadBusinessPhotos);

module.exports = router;