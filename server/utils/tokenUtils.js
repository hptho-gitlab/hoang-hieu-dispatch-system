const jwt = require('jsonwebtoken');

const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    accessSecret,
    { expiresIn: '15m' }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    refreshSecret,
    { expiresIn: '7d' }
  );
}

function getUserResponse(user) {
  return {
    id: user._id,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
  };
}

function sendTokenResponse(user, res, statusCode, message) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(statusCode).json({
    success: true,
    message,
    accessToken,
    user: getUserResponse(user),
  });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
  getUserResponse,
};
