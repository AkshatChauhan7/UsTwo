const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 * Sets req.user with decoded token data
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        msg: 'No token provided. Authorization required.',
        code: 'NO_TOKEN'
      });
    }

    const secret = process.env.JWT_SECRET || 'your_secret_key';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // { id: userId, iat: ..., exp: ... }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        msg: 'Token expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        msg: 'Invalid token. Authorization required.',
        code: 'INVALID_TOKEN'
      });
    }
    res.status(500).json({
      msg: 'Authentication error',
      error: err.message
    });
  }
};

module.exports = authMiddleware;
