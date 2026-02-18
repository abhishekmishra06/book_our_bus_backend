const User = require('../user/User');
const Agent = require('./Agent');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');
const { generateAuthTokens } = require('../../shared/utils/authUtils/jwtUtils');

const completeAgentProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { companyName, gst, bankDetails, supportContact, address } = req.body;

    if (!companyName || !gst || !bankDetails || !supportContact || !address) {
      return sendError(res, 'Missing required fields for agent profile', { code: 'VALIDATION_ERROR' }, 400);
    }

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', { code: 'USER_NOT_FOUND' }, 404);

    const existingAgent = await Agent.findOne({ userId });
    if (existingAgent) return sendError(res, 'Agent profile already exists', { code: 'AGENT_PROFILE_EXISTS' }, 409);

    const agent = new Agent({ userId, companyName, gst, bankDetails, supportContact, address, verificationStatus: 'PENDING' });
    await agent.save();

    user.role = 'AGENT';
    await user.save();

    const tokens = generateAuthTokens(user.toObject());

    return sendSuccess(res, { agent, user, tokens }, 'Agent profile completed successfully');
  } catch (error) {
    console.error('Error completing agent profile:', error);
    return sendError(res, 'Failed to complete agent profile', { code: 'AGENT_PROFILE_COMPLETION_ERROR', details: error.message }, 500);
  }
};

const getAgentProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const agent = await Agent.findOne({ userId }).populate('userId', '-password');
    if (!agent) return sendError(res, 'Agent profile not found', { code: 'AGENT_PROFILE_NOT_FOUND' }, 404);
    return sendSuccess(res, agent, 'Agent profile retrieved successfully');
  } catch (error) {
    console.error('Error retrieving agent profile:', error);
    return sendError(res, 'Failed to retrieve agent profile', { code: 'AGENT_PROFILE_RETRIEVAL_ERROR', details: error.message }, 500);
  }
};

const updateAgentProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const updateData = { ...req.body };
    delete updateData.userId;
    delete updateData.verificationStatus;

    const agent = await Agent.findOne({ userId });
    if (!agent) return sendError(res, 'Agent profile not found', { code: 'AGENT_PROFILE_NOT_FOUND' }, 404);

    Object.assign(agent, updateData);
    await agent.save();

    return sendSuccess(res, agent, 'Agent profile updated successfully');
  } catch (error) {
    console.error('Error updating agent profile:', error);
    return sendError(res, 'Failed to update agent profile', { code: 'AGENT_PROFILE_UPDATE_ERROR', details: error.message }, 500);
  }
};

const uploadAgentDocument = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id;
    const { type, url } = req.body;
    if (!type || !url) return sendError(res, 'Document type and URL are required', { code: 'VALIDATION_ERROR' }, 400);

    const agent = await Agent.findOne({ userId });
    if (!agent) return sendError(res, 'Agent profile not found', { code: 'AGENT_PROFILE_NOT_FOUND' }, 404);

    agent.documents.push({ type, url });
    await agent.save();

    return sendSuccess(res, { document: agent.documents[agent.documents.length - 1] }, 'Document uploaded successfully');
  } catch (error) {
    console.error('Error uploading agent document:', error);
    return sendError(res, 'Failed to upload agent document', { code: 'DOCUMENT_UPLOAD_ERROR', details: error.message }, 500);
  }
};

module.exports = { completeAgentProfile, getAgentProfile, updateAgentProfile, uploadAgentDocument };
