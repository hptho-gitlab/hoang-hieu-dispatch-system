const express = require('express');
const { rateLimit } = require('express-rate-limit');
const {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau 15 phút.',
  },
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);
router.patch('/change-password', verifyToken, changePassword);

module.exports = router;
