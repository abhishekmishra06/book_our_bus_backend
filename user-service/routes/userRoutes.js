const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../../shared-services/utils/authUtils/authMiddleware');
const { formatResponse } = require('../../shared-services/utils/responseFormatter');

// Apply response formatting middleware
router.use(formatResponse);

// Route to handle auto account creation on login
router.post('/auto-create', userController.handleAutoAccountCreation);

// Get user profile (requires authentication)
router.get('/profile/:phone', authenticateToken, userController.getUserProfile);

// Update user profile (requires authentication)
router.put('/profile/:phone', authenticateToken, userController.updateUserProfile);

// Get current user profile (requires authentication)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // req.user is populated by the authenticateToken middleware
    const user = await require('../models/User').findOne({ phone: req.user.phone });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          details: 'User associated with token not found'
        },
        meta: {
          requestId: require('uuid').v4(),
          timestamp: new Date().toISOString()
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Current user profile retrieved successfully',
      data: user,
      error: null,
      meta: {
        requestId: require('uuid').v4(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving current user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile',
      data: null,
      error: {
        code: 'PROFILE_RETRIEVAL_ERROR',
        details: error.message
      },
      meta: {
        requestId: require('uuid').v4(),
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Update user role (requires authentication)
router.put('/role/:phone', authenticateToken, userController.updateUserRole);

// Promote user to agent (requires authentication)
router.post('/promote-to-agent/:phone', authenticateToken, userController.promoteToAgent);

module.exports = router;