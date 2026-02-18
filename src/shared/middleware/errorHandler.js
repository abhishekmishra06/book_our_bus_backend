const { v4: uuidv4 } = require('uuid');

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', err);

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Format error response according to unified format
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
  errorHandler
};