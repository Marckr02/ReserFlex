const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { getServices, createService, updateService, deleteService } = require('../controllers/service.controller');

const adminOnly = [authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN')];

router.get('/:businessId',         getServices);                // público
router.post('/:businessId',        ...adminOnly, createService);
router.put('/:serviceId',          ...adminOnly, updateService);
router.delete('/:serviceId',       ...adminOnly, deleteService);

module.exports = router;
