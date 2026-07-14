const router = require('express').Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { register, verifyEmail, login, forgotPassword, resetPassword, changePassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.get('/verify', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/change-password', authenticate, changePassword);

module.exports = router;
