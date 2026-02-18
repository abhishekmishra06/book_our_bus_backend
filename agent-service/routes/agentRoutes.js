const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { authenticateToken } = require('../../shared-services/utils/authUtils/authMiddleware');
const { formatResponse } = require('../../shared-services/utils/responseFormatter');

// Apply response formatting middleware
router.use(formatResponse);

// Complete agent profile (converts user to agent)
router.post('/complete-profile', authenticateToken, agentController.completeAgentProfile);

// Get agent profile
router.get('/profile', authenticateToken, agentController.getAgentProfile);

// Update agent profile
router.put('/profile', authenticateToken, agentController.updateAgentProfile);

// Upload agent document
router.post('/documents', authenticateToken, agentController.uploadAgentDocument);

module.exports = router;