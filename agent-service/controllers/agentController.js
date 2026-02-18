const User = require('../../user-service/models/User');
const Agent = require('../models/Agent');
const { sendSuccess, sendError } = require('../../shared-services/utils/responseFormatter');
const { generateAuthTokens } = require('../../shared-services/utils/authUtils/jwtUtils');

/**
 * Completes the agent profile for an existing user
 */
const completeAgentProfile = async (req, res) => {
  try {
    // req.user is populated by authentication middleware
    const userId = req.user.userId || req.user._id;

    const {
      companyName,
      gst,
      bankDetails,
      supportContact,
      address
    } = req.body;

    // Validate required fields
    if (!companyName || !gst || !bankDetails || !supportContact || !address) {
      return sendError(res, 'Missing required fields for agent profile', {
        code: 'VALIDATION_ERROR',
        details: 'companyName, gst, bankDetails, supportContact, and address are required'
      }, 400);
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: 'The authenticated user does not exist'
      }, 404);
    }

    // Check if user is already an agent
    let existingAgent = await Agent.findOne({ userId: userId });
    if (existingAgent) {
      return sendError(res, 'Agent profile already exists', {
        code: 'AGENT_PROFILE_EXISTS',
        details: 'This user already has an agent profile'
      }, 409);
    }

    // Create agent profile
    const agent = new Agent({
      userId: userId,
      companyName,
      gst,
      bankDetails,
      supportContact,
      address,
      verificationStatus: 'PENDING' // Default to pending verification
    });

    await agent.save();

    // Update user role to AGENT
    user.role = 'AGENT';
    await user.save();

    // Generate new tokens with updated role
    const tokens = generateAuthTokens(user.toObject());

    return sendSuccess(res, {
      agent,
      user,
      tokens
    }, 'Agent profile completed successfully');
  } catch (error) {
    console.error('Error completing agent profile:', error);

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to complete agent profile', {
      code: 'AGENT_PROFILE_COMPLETION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Gets the agent profile for the authenticated user
 */
const getAgentProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const agent = await Agent.findOne({ userId: userId }).populate('userId', '-password');

    if (!agent) {
      return sendError(res, 'Agent profile not found', {
        code: 'AGENT_PROFILE_NOT_FOUND',
        details: 'No agent profile exists for this user'
      }, 404);
    }

    return sendSuccess(res, agent, 'Agent profile retrieved successfully');
  } catch (error) {
    console.error('Error retrieving agent profile:', error);
    return sendError(res, 'Failed to retrieve agent profile', {
      code: 'AGENT_PROFILE_RETRIEVAL_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Updates the agent profile for the authenticated user
 */
const updateAgentProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const updateData = { ...req.body };

    // Don't allow updating userId or verificationStatus through this endpoint
    delete updateData.userId;
    delete updateData.verificationStatus;

    const agent = await Agent.findOne({ userId: userId });

    if (!agent) {
      return sendError(res, 'Agent profile not found', {
        code: 'AGENT_PROFILE_NOT_FOUND',
        details: 'No agent profile exists for this user'
      }, 404);
    }

    // Update agent profile
    Object.assign(agent, updateData);
    await agent.save();

    return sendSuccess(res, agent, 'Agent profile updated successfully');
  } catch (error) {
    console.error('Error updating agent profile:', error);

    // Check for validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 'Validation failed', {
        code: 'VALIDATION_ERROR',
        details: errors.join(', ')
      }, 400);
    }

    return sendError(res, 'Failed to update agent profile', {
      code: 'AGENT_PROFILE_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Uploads agent document
 */
const uploadAgentDocument = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;

    const { type, url } = req.body;

    if (!type || !url) {
      return sendError(res, 'Document type and URL are required', {
        code: 'VALIDATION_ERROR',
        details: 'Both document type and URL are required'
      }, 400);
    }

    const agent = await Agent.findOne({ userId: userId });

    if (!agent) {
      return sendError(res, 'Agent profile not found', {
        code: 'AGENT_PROFILE_NOT_FOUND',
        details: 'No agent profile exists for this user'
      }, 404);
    }

    // Add document to agent's documents array
    agent.documents.push({
      type,
      url
    });

    await agent.save();

    return sendSuccess(res, { document: agent.documents[agent.documents.length - 1] }, 'Document uploaded successfully');
  } catch (error) {
    console.error('Error uploading agent document:', error);
    return sendError(res, 'Failed to upload agent document', {
      code: 'DOCUMENT_UPLOAD_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  completeAgentProfile,
  getAgentProfile,
  updateAgentProfile,
  uploadAgentDocument
};