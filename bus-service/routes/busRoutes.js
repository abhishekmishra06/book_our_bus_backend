const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { authenticateToken, authorizeRoles } = require('../../shared-services/utils/authUtils/authMiddleware');
const { formatResponse } = require('../../shared-services/utils/responseFormatter');

// Apply response formatting middleware
router.use(formatResponse);

// Routes that require authentication and agent/admin role
router.post('/', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), busController.createBus);
router.get('/:id', authenticateToken, busController.getBusById);
router.put('/:id', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), busController.updateBus);
router.delete('/:id', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), busController.deleteBus);

// Route for agents to get their own buses
router.get('/my-buses', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), busController.getBusesByAgent);

// Public route for getting all buses (with optional filtering)
router.get('/', authenticateToken, busController.getAllBuses);

module.exports = router;