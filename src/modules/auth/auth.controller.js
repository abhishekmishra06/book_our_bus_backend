const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP } = require('../../shared/utils/otpUtils/otpService');
const { createOrUpdateUser } = require('../user/user.service');
const User = require('./auth.model');
const Session = require('../session/session.model');
const config = require('../../config');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
const sendOTPController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, 'Phone number is required', {
        code: 'VALIDATION_ERROR',
        details: 'Phone number is required to send OTP'
      }, 400);
    }

    const result = await sendOTP(phone);

    if (result.success) {
      return sendSuccess(res, {
        phoneNumber: result.phoneNumber,
        otpSent: result.testOtp, // Include OTP in response for testing purposes (remove in production)
        otpExpiry: result.otpExpiry
      }, result.message);
    } else {
      return sendError(res, result.message, {
        code: 'OTP_SEND_FAILED',
        details: result.message
      }, 400);
    }
  } catch (error) {
    console.error('Error in send OTP:', error);
    return sendError(res, 'Failed to send OTP', {
      code: 'INTERNAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Verify OTP and login/create user
 * POST /api/auth/verify-otp
 */
const verifyOTPController = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return sendError(res, 'Phone number and OTP are required', {
        code: 'VALIDATION_ERROR',
        details: 'Both phone number and OTP are required for verification'
      }, 400);
    }

    // Verify OTP
    const otpResult = await verifyOTP(phone, otp);

    if (!otpResult.success) {
      return sendError(res, otpResult.message, {
        code: 'OTP_VERIFICATION_FAILED',
        details: otpResult.message
      }, 400);
    }

    // OTP verified, create or get user
    const userResult = await createOrUpdateUser(phone, `User-${Date.now()}`, null);

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: userResult.user._id, phone: userResult.user.phone, role: userResult.user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: userResult.user._id, phone: userResult.user.phone },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    // Create a session record
    const session = new Session({
      userId: userResult.user._id,
      refreshToken,
      ip: req.ip || req.connection.remoteAddress,
      deviceInfo: {
        deviceId: req.headers['device-id'] || null,
        deviceType: req.headers['device-type'] || 'unknown',
        deviceModel: req.headers['device-model'] || null,
        os: req.headers['os'] || 'unknown',
        browser: req.headers['browser'] || 'unknown',
        userAgent: req.headers['user-agent']
      },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    await session.save();

    return sendSuccess(res, {
      user: {
        id: userResult.user._id,
        phone: userResult.user.phone,
        name: userResult.user.name,
        email: userResult.user.email,
        role: userResult.user.role,
        status: userResult.user.status
      },
      tokens: {
        accessToken,
        refreshToken
      },
      isNewUser: userResult.isNew
    }, userResult.isNew ? 'User created and logged in successfully' : 'Logged in successfully');
  } catch (error) {
    console.error('Error in verify OTP:', error);
    return sendError(res, 'Failed to verify OTP and login', {
      code: 'INTERNAL_ERROR',
      details: error.message
    }, 500);
  }
};


const refreshTokenController = async (req, res) => {
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

module.exports = {
  sendOTPController,
  verifyOTPController,
  refreshTokenController
};