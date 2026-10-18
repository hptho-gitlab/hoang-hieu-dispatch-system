const mongoose = require('mongoose');
const User = require('../models/User');

function validationError(res, message) {
  return res.status(400).json({ success: false, message });
}

async function getUsers(req, res, next) {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive === 'true') {
      filter.isActive = true;
    } else if (req.query.isActive === 'false') {
      filter.isActive = false;
    } else if (req.query.role === 'technician') {
      filter.isActive = true;
    }
    const users = await User.find(filter)
      .select('username fullName phone role isActive createdAt')
      .sort({ fullName: 1 });
    return res.status(200).json({ success: true, users });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const {
      username, password, fullName, phone, role,
    } = req.body || {};
    if (
      typeof username !== 'string'
      || typeof password !== 'string'
      || typeof fullName !== 'string'
      || typeof phone !== 'string'
      || !username.trim()
      || !fullName.trim()
      || !phone.trim()
      || !['admin', 'technician'].includes(role)
    ) {
      return validationError(res, 'Vui lòng nhập đầy đủ thông tin nhân sự hợp lệ');
    }
    if (password.length < 6) {
      return validationError(res, 'Mật khẩu phải có ít nhất 6 ký tự');
    }

    const normalizedUsername = username.trim().toLowerCase();
    const existingUser = await User.findOne({ username: normalizedUsername });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Tên đăng nhập đã tồn tại',
      });
    }

    const user = await User.create({
      username: normalizedUsername,
      password,
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
    });
    return res.status(201).json({
      success: true,
      message: 'Tạo nhân sự thành công',
      user: user.toObject({ transform: (doc, value) => {
        delete value.password;
        return value;
      } }),
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return validationError(res, 'Thông tin nhân sự không hợp lệ');
    }
    return next(error);
  }
}

async function toggleActive(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân sự' });
    }
    if (String(req.user.id) === String(req.params.id)) {
      return validationError(res, 'Bạn không thể tự khóa tài khoản của mình');
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhân sự' });
    }
    user.isActive = !user.isActive;
    await user.save();
    return res.status(200).json({
      success: true,
      message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getUsers, createUser, toggleActive };
