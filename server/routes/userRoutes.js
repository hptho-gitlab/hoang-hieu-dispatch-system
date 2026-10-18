const express = require('express');
const {
  getUsers,
  createUser,
  toggleActive,
} = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));
router.get('/', getUsers);
router.post('/', createUser);
router.patch('/:id/toggle-active', toggleActive);

module.exports = router;
