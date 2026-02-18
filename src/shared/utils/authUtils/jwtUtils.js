require('dotenv').config();
const jwt = require('jsonwebtoken');

function generateAccessToken(payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn || '1d' });
}

function generateRefreshToken(payload, secret = process.env.REFRESH_TOKEN_SECRET, expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn || '7d' });
}

function verifyAccessToken(token, secret = process.env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Access token verification failed:', error.message);
    return null;
  }
}

function verifyRefreshToken(token, secret = process.env.REFRESH_TOKEN_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
}

function generateAuthTokens(user) {
  const accessToken = generateAccessToken({
    userId: user._id || user.id,
    phone: user.phone,
    role: user.role || 'USER'
  });

  const refreshToken = generateRefreshToken({
    userId: user._id || user.id,
    phone: user.phone
  });

  return {
    accessToken,
    refreshToken
  };
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateAuthTokens
};
