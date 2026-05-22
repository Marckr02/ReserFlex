const router = require('express').Router();
const { register, verifyEmail, login, forgotPassword, resetPassword } = require('../controllers/auth.controller');

router.post('/register', register);
router.get('/verify', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;