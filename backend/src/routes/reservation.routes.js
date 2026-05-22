const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/reservation.controller');

router.get('/slots',                            ctrl.getSlots);                    // público
router.post('/',        authenticate,           ctrl.createReservation);           // HU7
router.post('/guest',                           ctrl.createGuestReservation);      // HU8
router.get('/my',       authenticate,           ctrl.getMyReservations);           // HU10
router.get('/employee', authenticate, authorize('EMPLEADO'), ctrl.getEmployeeReservations); // HU11
router.get('/business/:businessId', authenticate, authorize('ADMIN_NEGOCIO','SUPER_ADMIN'), ctrl.getBusinessReservations); // HU12
router.patch('/:id/cancel',     authenticate,   ctrl.cancelReservation);          // HU9
router.patch('/:id/reschedule', authenticate,   ctrl.rescheduleReservation);      // HU9
router.patch('/:id/status',     authenticate, authorize('ADMIN_NEGOCIO','SUPER_ADMIN'), ctrl.updateReservationStatus); // HU12
router.get('/metrics/:businessId', authenticate, authorize('ADMIN_NEGOCIO','SUPER_ADMIN'), ctrl.getMetrics); // HU13

module.exports = router;
