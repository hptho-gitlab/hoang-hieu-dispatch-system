const express = require('express');
const {
  getOrders,
  getOrderById,
  createOrder,
  assignTechnician,
  updateStatus,
  completeOrder,
} = require('../controllers/orderController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { uploadCompletionPhotos } = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(verifyToken);
router.get('/', getOrders);
router.post('/', requireRole('admin'), createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/assign', requireRole('admin'), assignTechnician);
router.patch('/:id/status', requireRole('technician'), updateStatus);
router.post(
  '/:id/complete',
  requireRole('technician'),
  uploadCompletionPhotos,
  completeOrder
);

module.exports = router;
