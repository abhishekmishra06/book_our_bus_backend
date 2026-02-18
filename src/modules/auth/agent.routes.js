const express = require('express');
const router = express.Router();
const { completeAgentProfile, getAgentProfile, updateAgentProfile } = require('./agent.controller');
const { authenticateToken } = require('../../shared/middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.post('/complete-profile', completeAgentProfile);
router.get('/profile', getAgentProfile);
router.put('/profile', updateAgentProfile);

module.exports = router;