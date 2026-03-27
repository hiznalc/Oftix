const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs = 15 * 60 * 1000, max = 100, message } = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: message || 'Too many requests from this IP, please try again later.',
  });

const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many accounts created from this IP, please try later.',
});

const passwordResetLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 6,
  message: 'Too many password reset requests, please try later.',
});

module.exports = { createLimiter, loginLimiter, registerLimiter, passwordResetLimiter };
