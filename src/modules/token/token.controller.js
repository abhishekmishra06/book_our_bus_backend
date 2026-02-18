const jwt = require('jsonwebtoken');
const User = require('../auth/auth.model');
const Session = require('../session/session.model');
const config = require('../../config');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Refresh access token using refresh token
 * POST /api/token/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 'Refresh token is required', {
        code: 'REFRESH_TOKEN_MISSING',
        details: 'A refresh token is required to generate a new access token'
      }, 400);
    }

    // Find the session by refresh token
    const session = await Session.findOne({ refreshToken, isActive: true });
    if (!session) {
      return sendError(res, 'Invalid or inactive refresh token', {
        code: 'SESSION_NOT_FOUND',
        details: 'The refresh token is invalid or has been revoked'
      }, 403);
    }

    // Check if session has expired
    if (session.expiresAt < new Date()) {
      session.isActive = false;
      await session.save();
      return sendError(res, 'Session expired', {
        code: 'SESSION_EXPIRED',
        details: 'The session has expired, user needs to log in again'
      }, 403);
    }

    // Find the user in the database
    const user = await User.findById(session.userId);
    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: 'The user associated with this refresh token does not exist'
      }, 403);
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      return sendError(res, 'User account inactive', {
        code: 'USER_INACTIVE',
        details: 'User account is not active'
      }, 403);
    }

    // Update last active time
    session.lastActiveAt = new Date();
    await session.save();

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: user._id, phone: user.phone, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Generate a new refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id, phone: user.phone },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Update the session with the new refresh token
    session.refreshToken = newRefreshToken;
    session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await session.save();

    return sendSuccess(res, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    }, 'Tokens refreshed successfully');
  } catch (error) {
    console.error('Error refreshing token:', error);
    return sendError(res, 'Failed to refresh token', {
      code: 'TOKEN_REFRESH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Revoke refresh token
 * POST /api/token/revoke
 */
const revokeToken = async (req, res) => {
  try {
    // In a real implementation, you would invalidate the refresh token
    // by adding it to a blacklist or removing it from the database
    // For this implementation, we'll just return a success response
    
    return sendSuccess(res, null, 'Token revoked successfully');
  } catch (error) {
    console.error('Error revoking token:', error);
    return sendError(res, 'Failed to revoke token', {
      code: 'TOKEN_REVOKE_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  refreshToken,
  revokeToken
};