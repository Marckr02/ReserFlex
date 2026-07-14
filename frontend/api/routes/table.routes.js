const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/table.controller');

const adminOnly = [authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN')];

router.get('/:businessId', ctrl.getTables);
router.post('/reserve', ctrl.reserveTable);
router.post('/:businessId', ...adminOnly, ctrl.createTable);
router.put('/:tableId', ...adminOnly, ctrl.updateTable);
router.delete('/:tableId', ...adminOnly, ctrl.deleteTable);

module.exports = router;