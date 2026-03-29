const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

const verifyToken = (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required.' });

    // jwt.verify throws if expired or invalid — no manual exp check needed
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role, email: decoded.email };
    next();
  } catch (error) {
    logger.warn({ message: 'Auth failure', error: error.message, ip: req.ip });
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient privileges.' });
  }
  next();
};

module.exports = { verifyToken, requireRole };
