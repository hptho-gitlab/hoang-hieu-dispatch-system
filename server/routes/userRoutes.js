const express = require('express');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get(
  '/',
  verifyToken,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const filter = { isActive: true };
      if (req.query.role) {
        filter.role = req.query.role;
      }
      const users = await User.find(filter)
        .select('username fullName phone role isActive')
        .sort({ fullName: 1 });
      return res.status(200).json({ success: true, users });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
