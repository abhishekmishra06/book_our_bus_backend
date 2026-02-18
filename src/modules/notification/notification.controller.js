const Notification = require('./notification.model');
const User = require('../auth/auth.model');
const Booking = require('../booking/booking.model');
const { sendSuccess, sendError } = require('../../shared/utils/responseFormatter');

/**
 * Send a notification
 * POST /api/notifications
 */
const sendNotification = async (req, res) => {
  try {
    const { userId, title, message, type, channel, priority, payload } = req.body;

    // Validate required fields
    if (!userId || !title || !message || !type || !channel) {
      return sendError(res, 'Missing required fields', {
        code: 'VALIDATION_ERROR',
        details: 'userId, title, message, type, and channel are required'
      }, 400);
    }

    // Validate notification type
    const validTypes = [
      'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED',
      'SEAT_AVAILABILITY', 'JOURNEY_REMINDER', 'BOARDING_INFO', 'ARRIVAL_INFO',
      'SYSTEM_MESSAGE', 'PROMOTIONAL', 'LOGIN_ATTEMPT', 'SECURITY_ALERT'
    ];

    if (!validTypes.includes(type)) {
      return sendError(res, 'Invalid notification type', {
        code: 'VALIDATION_ERROR',
        details: `Type must be one of: ${validTypes.join(', ')}`
      }, 400);
    }

    // Validate channel
    const validChannels = ['SMS', 'EMAIL', 'PUSH', 'IN_APP'];
    if (!validChannels.includes(channel)) {
      return sendError(res, 'Invalid channel', {
        code: 'VALIDATION_ERROR',
        details: `Channel must be one of: ${validChannels.join(', ')}`
      }, 400);
    }

    // Get user details for recipient info
    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, 'User not found', {
        code: 'USER_NOT_FOUND',
        details: 'The specified user does not exist'
      }, 404);
    }

    // Prepare notification data
    const notificationData = {
      userId,
      title,
      message,
      type,
      channel,
      priority: priority || 'MEDIUM',
      recipient: {
        phone: user.phone,
        email: user.email
      },
      payload: payload || {}
    };

    // If expiresAt is provided, add it
    if (req.body.expiresAt) {
      notificationData.expiresAt = new Date(req.body.expiresAt);
    }

    const notification = new Notification(notificationData);
    const savedNotification = await notification.save();

    // In a real implementation, you would send the notification via the specified channel
    // For now, we'll just mark it as sent
    savedNotification.sent = true;
    savedNotification.sentAt = new Date();
    await savedNotification.save();

    return sendSuccess(res, savedNotification, 'Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    return sendError(res, 'Failed to send notification', {
      code: 'NOTIFICATION_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get user's notifications
 * GET /api/notifications
 */
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 10, read = 'all', type } = req.query;

    if (!userId) {
      return sendError(res, 'User ID is required', {
        code: 'VALIDATION_ERROR',
        details: 'userId parameter is required'
      }, 400);
    }

    const filter = { userId };
    
    // Filter by read status
    if (read === 'unread') {
      filter.read = false;
    } else if (read === 'read') {
      filter.read = true;
    }
    
    // Filter by type
    if (type) {
      filter.type = type;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const notifications = await Notification.paginate(filter, options);

    return sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    console.error('Error getting notifications:', error);
    return sendError(res, 'Failed to retrieve notifications', {
      code: 'NOTIFICATION_FETCH_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Mark notification as read
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 'Notification not found', {
        code: 'NOTIFICATION_NOT_FOUND',
        details: 'No notification found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return sendError(res, 'Failed to mark notification as read', {
      code: 'NOTIFICATION_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Mark all user's notifications as read
 * PUT /api/notifications/mark-all-read
 */
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return sendError(res, 'User ID is required', {
        code: 'VALIDATION_ERROR',
        details: 'userId is required in request body'
      }, 400);
    }

    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    return sendSuccess(res, { modifiedCount: result.modifiedCount }, 'All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return sendError(res, 'Failed to mark all notifications as read', {
      code: 'NOTIFICATION_UPDATE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Get user's unread notification count
 * GET /api/notifications/unread-count
 */
const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return sendError(res, 'User ID is required', {
        code: 'VALIDATION_ERROR',
        details: 'userId parameter is required'
      }, 400);
    }

    const count = await Notification.countDocuments({ userId, read: false });

    return sendSuccess(res, { count }, 'Unread notification count retrieved');
  } catch (error) {
    console.error('Error getting unread count:', error);
    return sendError(res, 'Failed to get unread notification count', {
      code: 'NOTIFICATION_COUNT_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return sendError(res, 'Notification not found', {
        code: 'NOTIFICATION_NOT_FOUND',
        details: 'No notification found with the provided ID'
      }, 404);
    }

    return sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    console.error('Error deleting notification:', error);
    return sendError(res, 'Failed to delete notification', {
      code: 'NOTIFICATION_DELETE_ERROR',
      details: error.message
    }, 500);
  }
};

/**
 * Create booking-related notifications
 * This function can be called internally when booking events occur
 */
const createBookingNotification = async (bookingId, eventType, userId, additionalData = {}) => {
  try {
    const booking = await Booking.findById(bookingId).populate('userId busId routeId');
    if (!booking) {
      throw new Error('Booking not found');
    }

    // Define notification templates based on event type
    const templates = {
      confirmed: {
        title: 'Booking Confirmed!',
        message: `Your booking for ${booking.busId.busNumber} from ${booking.routeId.source} to ${booking.routeId.destination} on ${booking.journeyDate.toDateString()} has been confirmed.`,
        type: 'BOOKING_CONFIRMED'
      },
      cancelled: {
        title: 'Booking Cancelled',
        message: `Your booking for ${booking.busId.busNumber} from ${booking.routeId.source} to ${booking.routeId.destination} on ${booking.journeyDate.toDateString()} has been cancelled.`,
        type: 'BOOKING_CANCELLED'
      },
      reminder: {
        title: 'Journey Reminder',
        message: `Your journey from ${booking.routeId.source} to ${booking.routeId.destination} is tomorrow at ${booking.departureTime}.`,
        type: 'JOURNEY_REMINDER'
      }
    };

    const template = templates[eventType];
    if (!template) {
      throw new Error('Invalid event type');
    }

    const notificationData = {
      userId: booking.userId._id,
      title: template.title,
      message: template.message,
      type: template.type,
      channel: 'IN_APP', // Default channel for booking notifications
      priority: 'HIGH',
      payload: {
        bookingId: booking._id,
        busId: booking.busId._id,
        routeId: booking.routeId._id,
        ...additionalData
      }
    };

    const notification = new Notification(notificationData);
    await notification.save();

    return notification;
  } catch (error) {
    console.error('Error creating booking notification:', error);
    throw error;
  }
};

/**
 * Schedule journey reminder notifications
 * This function can be called to schedule reminders before journey date
 */
const scheduleJourneyReminders = async () => {
  try {
    // Find all bookings for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const nextTomorrow = new Date(tomorrow);
    nextTomorrow.setDate(nextTomorrow.getDate() + 1);
    
    const upcomingBookings = await Booking.find({
      journeyDate: {
        $gte: tomorrow,
        $lt: nextTomorrow
      },
      status: 'confirmed'
    }).populate('userId busId routeId');
    
    for (const booking of upcomingBookings) {
      await createBookingNotification(
        booking._id,
        'reminder',
        booking.userId._id,
        { departureTime: booking.busId.departureTime }
      );
    }
    
    return { scheduled: upcomingBookings.length };
  } catch (error) {
    console.error('Error scheduling journey reminders:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  createBookingNotification,
  scheduleJourneyReminders
};