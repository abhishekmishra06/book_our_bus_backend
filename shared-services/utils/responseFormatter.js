/**
 * Unified API response format middleware
 * Implements the response format specified in the PRD:
 * {
 *   "success": true,
 *   "message": "Booking confirmed",
 *   "data": {},
 *   "error": null,
 *   "meta": {
 *     "requestId": "uuid",
 *     "timestamp": "2026-01-22T10:20:30Z"
 *   }
 * }
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware to format all API responses consistently
 */
const formatResponse = (req, res, next) => {
  // Store original json method
  const originalJson = res.json;

  // Override res.json to format responses
  res.json = function(data) {
    // If data is already in the correct format, send as-is
    if (typeof data === 'object' && 
        ('success' in data || 'message' in data)) {
      return originalJson.call(this, data);
    }

    // Format the response according to PRD specification
    const formattedResponse = {
      success: true,
      message: 'Request successful',
      data: data,
      error: null,
      meta: {
        requestId: uuidv4(),
        timestamp: new Date().toISOString()
      }
    };

    return originalJson.call(this, formattedResponse);
  };

  next();
};

/**
 * Utility function to send success response
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 */
const sendSuccess = (res, data = null, message = 'Request successful', meta = {}) => {
  const response = {
    success: true,
    message: message,
    data: data,
    error: null,
    meta: {
      requestId: meta.requestId || uuidv4(),
      timestamp: meta.timestamp || new Date().toISOString(),
      ...meta
    }
  };

  return res.status(200).json(response);
};

/**
 * Utility function to send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {Object} error - Error details
 * @param {number} statusCode - HTTP status code
 * @param {Object} meta - Additional metadata
 */
const sendError = (res, message = 'Request failed', error = null, statusCode = 400, meta = {}) => {
  const response = {
    success: false,
    message: message,
    data: null,
    error: error || {
      code: 'GENERAL_ERROR',
      details: message
    },
    meta: {
      requestId: meta.requestId || uuidv4(),
      timestamp: meta.timestamp || new Date().toISOString(),
      ...meta
    }
  };

  return res.status(statusCode).json(response);
};

/**
 * Middleware to handle errors and format them according to PRD specification
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Format error response according to PRD specification
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      details: err.details || err.message || 'An unexpected error occurred'
    },
    meta: {
      requestId: uuidv4(),
      timestamp: new Date().toISOString()
    }
  };

  res.status(statusCode).json(errorResponse);
};

module.exports = {
  formatResponse,
  sendSuccess,
  sendError,
  errorHandler
};