const express = require('express');
const {
  getSummaryStats,
  getTechnicianPerformance,
} = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken);
router.get('/summary', getSummaryStats);
router.get('/technician-performance', requireRole('admin'), getTechnicianPerformance);

module.exports = router;
