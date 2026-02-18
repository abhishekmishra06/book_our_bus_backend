const express = require('express');
const router = express.Router();
const { sendOTP, verifyOTP } = require('../../shared-services/utils/otpUtils/otpService');
const User = require('../../user-service/models/User');
const { createOrUpdateUser } = require('../../user-service/controllers/userController');
const { generateAuthTokens } = require('../../shared-services/utils/authUtils/jwtUtils');
const { formatResponse } = require('../../shared-services/utils/responseFormatter');

// Apply response formatting middleware
router.use(formatResponse);

/**
 * Send OTP to phone number
 * POST /api/auth/send-otp
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Phone number is required to send OTP'
        }
      });
    }

    const result = await sendOTP(phone);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: {
          phoneNumber: result.phoneNumber,
          otpExpiry: result.otpExpiry
        },
        error: null
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
        data: null,
        error: {
          code: 'OTP_SEND_FAILED',
          details: result.message
        }
      });
    }
  } catch (error) {
    console.error('Error in send OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        details: error.message
      }
    });
  }
});

/**
 * Verify OTP and login/create user
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Both phone number and OTP are required for verification'
        }
      });
    }

    // Verify OTP
    const otpResult = await verifyOTP(phone, otp);

    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message,
        data: null,
        error: {
          code: 'OTP_VERIFICATION_FAILED',
          details: otpResult.message
        }
      });
    }

    // OTP verified, create or get user
    const userResult = await createOrUpdateUser(phone, `User-${Date.now()}`, null);

    // Generate auth tokens
    const tokens = generateAuthTokens(userResult.user);

    return res.status(200).json({
      success: true,
      message: userResult.isNew ? 'User created and logged in successfully' : 'Logged in successfully',
      data: {
        user: {
          id: userResult.user._id,
          phone: userResult.user.phone,
          name: userResult.user.name,
          email: userResult.user.email,
          role: userResult.user.role,
          status: userResult.user.status
        },
        tokens: tokens,
        isNewUser: userResult.isNew
      },
      error: null
    });
  } catch (error) {
    console.error('Error in verify OTP:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP and login',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        details: error.message
      }
    });
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          details: 'Refresh token is required to generate new access token'
        }
      });
    }

    // In a real implementation, you would verify the refresh token
    // and possibly store refresh tokens in a database to check validity
    // For this demo, we'll just generate new tokens
    
    // Decode the refresh token to get user info
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret');
    } catch (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired refresh token',
        data: null,
        error: {
          code: 'REFRESH_TOKEN_INVALID',
          details: 'The provided refresh token is invalid or has expired'
        }
      });
    }

    // Fetch user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          details: 'The user associated with this refresh token does not exist'
        }
      });
    }

    // Generate new tokens
    const newTokens = generateAuthTokens(user);

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken // Could be a new refresh token or the same one
      },
      error: null
    });
  } catch (error) {
    console.error('Error in refresh token:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
      data: null,
      error: {
        code: 'INTERNAL_ERROR',
        details: error.message
      }
    });
  }
});

module.exports = router;