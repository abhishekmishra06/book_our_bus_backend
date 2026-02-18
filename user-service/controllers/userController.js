const User = require('../models/User');
const { sendSuccess, sendError } = require('../../shared-services/utils/responseFormatter');

/**
 * Creates a new user account if it doesn't exist
 * @param {string} phone - User's phone number
 * @param {string} name - User's name
 * @param {string} email - User's email (optional)
 * @returns {Promise<User>} - Created or existing user
 */
async function createOrUpdateUser(phone, name, email = null) {
  try {
    // Check if user already exists
    let user = await User.findOne({ phone: phone });

    if (user) {
      // User already exists, return existing user
      return {
        user: user,
        isNew: false
      };
    }

    // Create new user
    user = new User({
      phone: phone,
      name: name,
      email: email || undefined // Don't store email if not provided
    });

    await user.save();

    return {
      user: user,
      isNew: true
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Controller function to handle user creation/update on login
 */
const handleAutoAccountCreation = async (req, res) => {
  try {
    const { phone, name, email } = req.body;

    if (!phone || !name) {
      return sendError(res, 'Phone and name are required', {
        code: 'VALIDATION_ERROR',
        details: 'Both phone and name fields are required for account creation'
      }, 400);
    }

    const result = await createOrUpdateUser(phone, name, email);

    return sendSuccess(
      res, 
      { user: result.user, isNew: result.isNew }, 
      result.isNew ? 'Account created successfully' : 'Existing account found'
    );
  } catch (error) {
    console.error('Error in auto account creation:', error);
    return sendError(res, 'Failed to create or find user account', {
      code: 'ACCOUNT_CREATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get user profile by phone number
 */
const getUserProfile = async (req, res) => {
  try {
    const { phone } = req.params;

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: `No user found with phone number: ${phone}`
      }, 404);
    }

    return sendSuccess(res, user, 'User profile retrieved successfully');
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    return sendError(res, 'Failed to retrieve user profile', {
      code: 'PROFILE_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, email } = req.body;

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: `No user found with phone number: ${phone}`
      }, 404);
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email !== undefined) user.email = email; // Allow clearing email

    await user.save();

    return sendSuccess(res, user, 'User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
    return sendError(res, 'Failed to update user profile', {
      code: 'PROFILE_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

const { generateAuthTokens } = require('../../shared-services/utils/authUtils/jwtUtils');

/**
 * Updates user role
 */
const updateUserRole = async (req, res) => {
  try {
    const { phone } = req.params;
    const { role } = req.body;

    // Validate role
    if (!['USER', 'AGENT'].includes(role)) {
      return sendError(res, 'Invalid role specified', {
        code: 'INVALID_ROLE',
        details: 'Role must be either USER or AGENT'
      }, 400);
    }

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: `No user found with phone number: ${phone}`
      }, 404);
    }

    // Update role
    user.role = role;
    await user.save();

    return sendSuccess(res, user, 'User role updated successfully');
  } catch (error) {
    console.error('Error updating user role:', error);
    return sendError(res, 'Failed to update user role', {
      code: 'ROLE_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Promotes a user to agent
 */
const promoteToAgent = async (req, res) => {
  try {
    const { phone } = req.params;

    const user = await User.findOne({ phone: phone });

    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: `No user found with phone number: ${phone}`
      }, 404);
    }

    // Update role to agent
    user.role = 'AGENT';
    await user.save();

    // Generate new tokens with updated role
    const tokens = generateAuthTokens(user);

    return sendSuccess(res, { user, tokens }, 'User promoted to agent successfully');
  } catch (error) {
    console.error('Error promoting user to agent:', error);
    return sendError(res, 'Failed to promote user to agent', {
      code: 'AGENT_PROMOTION_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  createOrUpdateUser,
  handleAutoAccountCreation,
  getUserProfile,
  updateUserProfile,
  updateUserRole,
  promoteToAgent
};