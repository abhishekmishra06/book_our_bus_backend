const { v4: uuidv4 } = require('uuid');

const formatResponse = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    if (typeof data === 'object' && ('success' in data || 'message' in data)) {
      return originalJson.call(this, data);
    }
    const formattedResponse = {
      success: true,
      message: 'Request successful',
      data: data,
      error: null,
      meta: { requestId: uuidv4(), timestamp: new Date().toISOString() }
    };
    return originalJson.call(this, formattedResponse);
  };
  next();
};

const sendSuccess = (res, data = null, message = 'Request successful', meta = {}) => {
  const response = {
    success: true,
    message: message,
    data: data,
    error: null,
    meta: { requestId: meta.requestId || uuidv4(), timestamp: meta.timestamp || new Date().toISOString(), ...meta }
  };
  return res.status(200).json(response);
};

const sendError = (res, message = 'Request failed', error = null, statusCode = 400, meta = {}) => {
  const response = {
    success: false,
    message: message,
    data: null,
    error: error || { code: 'GENERAL_ERROR', details: message },
    meta: { requestId: meta.requestId || uuidv4(), timestamp: meta.timestamp || new Date().toISOString(), ...meta }
  };
  return res.status(statusCode).json(response);
};

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);
  const statusCode = err.statusCode || 500;
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    data: null,
    error: { code: err.code || 'INTERNAL_ERROR', details: err.details || err.message || 'An unexpected error occurred' },
    meta: { requestId: uuidv4(), timestamp: new Date().toISOString() }
  };
  res.status(statusCode).json(errorResponse);
};

module.exports = { formatResponse, sendSuccess, sendError, errorHandler };