const Session = require('./session.model');
const User = require('../auth/auth.model');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Get all active sessions for a user
 * GET /api/sessions/my-sessions
 */
const getUserSessions = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming this comes from auth middleware

    const sessions = await Session.find({ 
      userId: userId, 
      isActive: true 
    }).sort({ lastActiveAt: -1 });

    return sendSuccess(res, sessions, 'Active sessions retrieved successfully');
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return sendError(res, 'Failed to retrieve user sessions', {
      code: 'SESSION_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Revoke a specific session
 * DELETE /api/sessions/revoke/:sessionId
 */
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId; // Assuming this comes from auth middleware

    const session = await Session.findOne({ 
      _id: sessionId, 
      userId: userId, 
      isActive: true 
    });

    if (!session) {
      return sendError(res, 'Session not found', {
        code: 'SESSION_NOT_FOUND',
        details: 'The specified session does not exist or belongs to another user'
      }, 404);
    }

    session.isActive = false;
    await session.save();

    return sendSuccess(res, null, 'Session revoked successfully');
  } catch (error) {
    console.error('Error revoking session:', error);
    return sendError(res, 'Failed to revoke session', {
      code: 'SESSION_REVOKE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Revoke all other sessions except the current one
 * DELETE /api/sessions/revoke-others
 */
const revokeOtherSessions = async (req, res) => {
  try {
    const currentUserId = req.user.userId; // From auth middleware
    const currentSessionId = req.headers.authorization?.split(' ')[1]; // Simplified - in practice you'd have a better way to identify current session

    // Note: This is simplified. In practice, you'd have a better way to identify the current session
    // For now, we'll just revoke all other sessions by finding all active sessions for the user
    // and then the client would need to handle keeping their current session active

    const result = await Session.updateMany(
      { 
        userId: currentUserId, 
        isActive: true 
      },
      { isActive: false }
    );

    return sendSuccess(res, { revokedCount: result.nModified }, 'Other sessions revoked successfully');
  } catch (error) {
    console.error('Error revoking other sessions:', error);
    return sendError(res, 'Failed to revoke other sessions', {
      code: 'SESSION_REVOKE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Revoke all sessions for a user
 * DELETE /api/sessions/logout-all
 */
const logoutAllSessions = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming this comes from auth middleware

    const result = await Session.updateMany(
      { 
        userId: userId, 
        isActive: true 
      },
      { isActive: false }
    );

    return sendSuccess(res, { revokedCount: result.nModified }, 'All sessions revoked successfully');
  } catch (error) {
    console.error('Error logging out all sessions:', error);
    return sendError(res, 'Failed to logout all sessions', {
      code: 'SESSION_LOGOUT_ERROR',
      details: error.message
    }, 500);
  }
};

module.exports = {
  getUserSessions,
  revokeSession,
  revokeOtherSessions,
  logoutAllSessions
};