const { verifyAccessToken } = require('./jwtUtils');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ success: false, message: 'Invalid token' });

  req.user = decoded;
  next();
}

module.exports = authMiddleware;
