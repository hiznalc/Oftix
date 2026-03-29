const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.post('/register', registerLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username min 3 chars'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
], validateRequest, authController.register);

router.get('/verify-email/:token', authController.verifyEmail);

router.post('/login', loginLimiter, [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
], validateRequest, authController.login);

router.post('/logout', authController.logout);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').trim().isEmail(),
], validateRequest, authController.forgotPassword);

router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], validateRequest, authController.resetPassword);

module.exports = router;
