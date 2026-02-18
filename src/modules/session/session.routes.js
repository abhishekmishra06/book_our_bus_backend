const express = require('express');
const router = express.Router();
const { 
  getUserSessions, 
  revokeSession, 
  revokeOtherSessions, 
  logoutAllSessions 
} = require('./session.controller');
const { authenticateToken } = require('../../shared/middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.get('/my-sessions', getUserSessions);
router.delete('/revoke/:sessionId', revokeSession);
router.delete('/revoke-others', revokeOtherSessions);
router.delete('/logout-all', logoutAllSessions);

module.exports = router;