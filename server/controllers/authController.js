const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  generateAccessToken,
  sendTokenResponse,
  getUserResponse,
} = require('../utils/tokenUtils');

function validationError(res, message) {
  return res.status(400).json({ success: false, message });
}

async function register(req, res, next) {
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
    ) {
      return validationError(res, 'Vui lòng nhập đầy đủ thông tin bắt buộc');
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
      fullName,
      phone,
      role,
    });

    return sendTokenResponse(user, res, 201, 'Tạo tài khoản thành công');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return validationError(res, 'Thông tin tài khoản không hợp lệ');
    }
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string'
      || !username.trim() || !password) {
      return validationError(res, 'Vui lòng nhập tên đăng nhập và mật khẩu');
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không đúng',
      });
    }
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị vô hiệu hóa',
      });
    }

    return sendTokenResponse(user, res, 200, 'Đăng nhập thành công');
  } catch (error) {
    return next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Làm mới phiên đăng nhập thành công',
      accessToken: generateAccessToken(user),
      user: getUserResponse(user),
    });
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError'
      || error.name === 'TokenExpiredError'
      || error.name === 'CastError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token không hợp lệ hoặc đã hết hạn',
      });
    }
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  return res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
}

async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
      });
    }

    return res.status(200).json({
      success: true,
      user: getUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};
