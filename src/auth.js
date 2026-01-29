const jwt = require('jsonwebtoken');
const config = require('../config');

function createToken() {
  return jwt.sign({ role: 'admin' }, config.jwtSecret, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch {
    return null;
  }
}

// Middleware: require admin auth for mutating routes
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.buoy_token;
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware: attach auth status to request (for any route)
function attachAuth(req, res, next) {
  const token = req.cookies && req.cookies.buoy_token;
  req.isAdmin = !!(token && verifyToken(token));
  next();
}

module.exports = { createToken, verifyToken, requireAdmin, attachAuth };
