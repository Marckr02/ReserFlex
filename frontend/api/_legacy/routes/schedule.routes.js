const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { getSchedules, upsertSchedules } = require('../controllers/schedule.controller');

router.get('/:businessId', getSchedules);  // público para el portal
router.put('/:businessId', authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN'), upsertSchedules);

module.exports = router;
