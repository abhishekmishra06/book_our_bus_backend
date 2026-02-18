const Agent = require('./agent.model');
const User = require('./auth.model');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Complete agent profile
 * POST /api/auth/agent/complete-profile
 */
const completeAgentProfile = async (req, res) => {
  try {
    const {
      fullName,
      password,
      companyName,
      city,
      aadharNumber,
      aadharPhoto,
      panCardNumber,
      panCardPhoto,
      msme,
      gstNumber,
      corporateEntity,
      termsAccepted,
      whatsappConsent
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'fullName', 'password', 'companyName', 'city', 
      'aadharNumber', 'aadharPhoto', 'panCardNumber', 
      'panCardPhoto', 'termsAccepted', 'whatsappConsent'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: `Required fields missing: ${missingFields.join(', ')}`
      }, 400);
    }

    // Check if user exists and is not already an agent
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: 'User associated with token not found'
      }, 404);
    }

    if (user.role === 'AGENT') {
      return sendError(res, 'User is already an agent', {
        code: 'ALREADY_AGENT',
        details: 'This user is already registered as an agent'
      }, 400);
    }

    // Check if agent profile already exists
    const existingAgent = await Agent.findOne({ userId: user._id });
    if (existingAgent) {
      return sendError(res, 'Agent profile already exists', {
        code: 'AGENT_EXISTS',
        details: 'Agent profile already created for this user'
      }, 400);
    }

    // Check if aadhar or pan already exists
    const duplicateAadhar = await Agent.findOne({ aadharNumber });
    if (duplicateAadhar) {
      return sendError(res, 'Aadhar number already exists', {
        code: 'DUPLICATE_AADHAR',
        details: 'This aadhar number is already registered'
      }, 400);
    }

    const duplicatePan = await Agent.findOne({ panCardNumber });
    if (duplicatePan) {
      return sendError(res, 'PAN card number already exists', {
        code: 'DUPLICATE_PAN',
        details: 'This PAN card number is already registered'
      }, 400);
    }

    // Create agent profile
    const agentData = {
      userId: user._id,
      fullName,
      password,
      companyName,
      city,
      aadharNumber,
      aadharPhoto,
      panCardNumber,
      panCardPhoto,
      msme: msme || false,
      gstNumber: gstNumber || null,
      corporateEntity: corporateEntity || false,
      termsAccepted: termsAccepted === true,
      whatsappConsent: whatsappConsent === true
    };

    const agent = new Agent(agentData);
    const savedAgent = await agent.save();

    // Update user role to AGENT
    user.role = 'AGENT';
    await user.save();

    // Prepare response data (exclude sensitive fields)
    const responseData = {
      agentId: savedAgent._id,
      userId: savedAgent.userId,
      fullName: savedAgent.fullName,
      companyName: savedAgent.companyName,
      city: savedAgent.city,
      aadharNumber: savedAgent.aadharNumber,
      panCardNumber: savedAgent.panCardNumber,
      msme: savedAgent.msme,
      gstNumber: savedAgent.gstNumber,
      corporateEntity: savedAgent.corporateEntity,
      verificationStatus: savedAgent.verificationStatus,
      termsAccepted: savedAgent.termsAccepted,
      whatsappConsent: savedAgent.whatsappConsent,
      createdAt: savedAgent.createdAt
    };

    return sendSuccess(res, responseData, 'Agent profile completed successfully');
  } catch (error) {
    console.error('Error completing agent profile:', error);
    return sendError(res, 'Failed to complete agent profile', {
      code: 'AGENT_PROFILE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get agent profile
 * GET /api/auth/agent/profile
 */
const getAgentProfile = async (req, res) => {
  try {
    const agent = await Agent.findOne({ userId: req.user.id })
      .select('-password -documents');

    if (!agent) {
      return sendError(res, 'Agent profile not found', {
        code: 'AGENT_NOT_FOUND',
        details: 'No agent profile found for this user'
      }, 404);
    }

    return sendSuccess(res, agent, 'Agent profile retrieved successfully');
  } catch (error) {
    console.error('Error getting agent profile:', error);
    return sendError(res, 'Failed to retrieve agent profile', {
      code: 'AGENT_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Update agent profile
 * PUT /api/auth/agent/profile
 */
const updateAgentProfile = async (req, res) => {
  try {
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated
    delete updateData.password;
    delete updateData.aadharNumber;
    delete updateData.panCardNumber;
    delete updateData.userId;

    const agent = await Agent.findOneAndUpdate(
      { userId: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -documents');

    if (!agent) {
      return sendError(res, 'Agent profile not found', {
        code: 'AGENT_NOT_FOUND',
        details: 'No agent profile found for this user'
      }, 404);
    }

    return sendSuccess(res, agent, 'Agent profile updated successfully');
  } catch (error) {
    console.error('Error updating agent profile:', error);
    return sendError(res, 'Failed to update agent profile', {
      code: 'AGENT_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  completeAgentProfile,
  getAgentProfile,
  updateAgentProfile
};