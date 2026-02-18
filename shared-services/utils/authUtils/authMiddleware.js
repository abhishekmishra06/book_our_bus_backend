const { verifyAccessToken } = require('../utils/authUtils/jwtUtils');

/**
 * Middleware to authenticate user with JWT access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticateToken = (req, res, next) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      data: null,
      error: {
        code: 'TOKEN_MISSING',
        details: 'Authorization header missing or malformed'
      }
    });
  }

  // Verify token
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      data: null,
      error: {
        code: 'TOKEN_INVALID',
        details: 'The provided access token is invalid or has expired'
      }
    });
  }

  // Attach user info to request object
  req.user = decoded;
  next();
};

/**
 * Middleware to authenticate user and check role
 * @param {Array<string>} roles - Allowed roles
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          details: 'User must be authenticated'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        data: null,
        error: {
          code: 'FORBIDDEN',
          details: `User role '${req.user.role}' does not have permission to access this resource`
        }
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};