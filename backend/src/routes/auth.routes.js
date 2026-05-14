const router = require('express').Router();
const { register, verifyEmail, login } = require('../controllers/auth.controller');

router.post('/register', register);
router.get('/verify', verifyEmail);
router.post('/login', login);

module.exports = router;