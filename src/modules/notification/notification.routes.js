const express = require('express');
const router = express.Router();
const { 
  sendNotification, 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  getUnreadCount,
  deleteNotification
} = require('./notification.controller');
const { authenticateToken } = require('../../shared/middleware/auth');

// Apply authentication middleware to all routes except sendNotification
// (sendNotification can be called internally by system)
router.get('/', authenticateToken, getUserNotifications);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/mark-all-read', authenticateToken, markAllAsRead);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.delete('/:id', authenticateToken, deleteNotification);

// Route for system to send notifications (could be protected differently)
router.post('/', authenticateToken, sendNotification);

module.exports = router;