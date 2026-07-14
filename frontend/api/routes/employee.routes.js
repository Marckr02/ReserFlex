const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { getEmployees, createEmployee, assignServices } = require('../controllers/employee.controller');

const adminOnly = [authenticate, authorize('ADMIN_NEGOCIO', 'SUPER_ADMIN')];

router.get('/:businessId',              ...adminOnly, getEmployees);
router.post('/:businessId',             ...adminOnly, createEmployee);
router.put('/:employeeId/services',     ...adminOnly, assignServices);

module.exports = router;
