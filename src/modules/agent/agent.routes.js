const express = require('express');
const router = express.Router();
const agentController = require('./agent.controller');
const authenticateToken = require('../../shared/utils/authUtils/authMiddleware');
const { formatResponse } = require('../../shared/utils/responseFormatter');

router.use(formatResponse);

router.post('/complete-profile', authenticateToken, agentController.completeAgentProfile);
router.get('/profile', authenticateToken, agentController.getAgentProfile);
router.put('/profile', authenticateToken, agentController.updateAgentProfile);
router.post('/documents', authenticateToken, agentController.uploadAgentDocument);

module.exports = router;

