require('dotenv').config();
const jwt = require('jsonwebtoken');

/**
 * Generates an access token
 * @param {Object} payload - The payload to include in the token
 * @param {string} secret - The secret key to sign the token
 * @param {string|number} expiresIn - Expiration time (default from env)
 * @returns {string} - The signed JWT token
 */
function generateAccessToken(payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn || '1d' });
}

/**
 * Generates a refresh token
 * @param {Object} payload - The payload to include in the token
 * @param {string} secret - The secret key to sign the token
 * @param {string|number} expiresIn - Expiration time (default from env)
 * @returns {string} - The signed JWT token
 */
function generateRefreshToken(payload, secret = process.env.REFRESH_TOKEN_SECRET, expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN) {
  return jwt.sign(payload, secret, { expiresIn: expiresIn || '7d' });
}

/**
 * Verifies an access token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret key to verify the token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyAccessToken(token, secret = process.env.JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Access token verification failed:', error.message);
    return null;
  }
}

/**
 * Verifies a refresh token
 * @param {string} token - The token to verify
 * @param {string} secret - The secret key to verify the token
 * @returns {Object|null} - Decoded token payload or null if invalid
 */
function verifyRefreshToken(token, secret = process.env.REFRESH_TOKEN_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    console.error('Refresh token verification failed:', error.message);
    return null;
  }
}

/**
 * Generates both access and refresh tokens for a user
 * @param {Object} user - The user object
 * @returns {Object} - Object containing both tokens
 */
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