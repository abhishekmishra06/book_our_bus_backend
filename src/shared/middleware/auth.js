const jwt = require('jsonwebtoken');
const config = require('../../config');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      data: null,
      error: {
        code: 'TOKEN_MISSING',
        details: 'Authentication token is required'
      },
      meta: {
        requestId: require('uuid').v4(),
        timestamp: new Date().toISOString()
      }
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        data: null,
        error: {
          code: 'TOKEN_INVALID',
          details: 'The provided token is invalid or has expired'
        },
        meta: {
          requestId: require('uuid').v4(),
          timestamp: new Date().toISOString()
        }
      });
    }
    
    req.user = user;
    next();
  });
};

module.exports = {
  authenticateToken
};