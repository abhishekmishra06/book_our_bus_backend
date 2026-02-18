const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { authenticateToken, authorizeRoles } = require('../../shared-services/utils/authUtils/authMiddleware');
const { formatResponse } = require('../../shared-services/utils/responseFormatter');

// Apply response formatting middleware
router.use(formatResponse);

// Routes that require authentication and agent/admin role
router.post('/', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), routeController.createRoute);
router.get('/:id', authenticateToken, routeController.getRouteById);
router.put('/:id', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), routeController.updateRoute);
router.delete('/:id', authenticateToken, authorizeRoles(['AGENT', 'ADMIN']), routeController.deleteRoute);

// Public route for getting all routes
router.get('/', authenticateToken, routeController.getAllRoutes);

// Route for advanced search functionality
router.get('/search', authenticateToken, routeController.searchRoutes);

module.exports = router;