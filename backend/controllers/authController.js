const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { sendEmail } = require('../services/emailService');
const logger = require('../utils/logger');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
const jwtExpiry = process.env.JWT_EXPIRES_IN || '1d';
const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

const createCookie = (token, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  res.cookie('token', token, cookieOptions);
};

const createAuthResponse = (user) => ({
  success: true,
  data: {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch_id: user.branch_id,
  },
  message: 'Authenticated successfully.',
});

const register = async (req, res, next) => {
  const { name, email, username, password, contact, address, branch_id } = req.body;
  try {
    const [exists] = await pool.execute('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or username already in use.' });
    }

    const hashed = await bcrypt.hash(password, bcryptRounds);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 1000 * 60 * 45);

    const [result] = await pool.execute(`INSERT INTO users (name,email,username,password,role,contact,address,branch_id,email_verified,email_verification_token,email_verification_expires,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,NOW())`,
      [name, email, username, hashed, 'client', contact || null, address || null, branch_id || null, 0, verificationToken, verificationExpires]);

    await sendEmail(email, 'Verify your Oftix email', `Please verify: /api/auth/verify-email/${verificationToken}`);

    return res.status(201).json({ success: true, data: { id: result.insertId, email }, message: 'Registered successfully. Check your email to verify account.' });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  const { token } = req.params;
  try {
    const [rows] = await pool.execute('SELECT id,email_verification_expires FROM users WHERE email_verification_token = ?', [token]);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid verification link.' });
    const user = rows[0];
    if (new Date(user.email_verification_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification link expired.' });
    }

    await pool.execute('UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?', [user.id]);
    return res.json({ success: true, message: 'Email verified. You can now login.' });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { username, password, role } = req.body;
  try {
    const [rows] = await pool.execute('SELECT id,name,email,role,branch_id,password,email_verified FROM users WHERE username = ? OR email = ?', [username, username]);
    if (!rows.length) {
      logger.warn({ event: 'login_fail', reason: 'user_not_found', username, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    const user = rows[0];
    if (!user.email_verified) {
      return res.status(403).json({ success: false, message: 'Email not verified. Please verify before login.' });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      logger.warn({ event: 'login_fail', reason: 'wrong_password', username, ip: req.ip });
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (role && user.role !== role) {
      logger.warn({ event: 'login_fail', reason: 'role_mismatch', username, ip: req.ip });
      return res.status(403).json({ success: false, message: 'Role mismatch.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: jwtExpiry });
    createCookie(token, res);
    logger.info({ event: 'login_success', userId: user.id, role: user.role, ip: req.ip });

    return res.json(createAuthResponse(user));
  } catch (error) {
    next(error);
  }
};

const logout = async (_, res) => {
  res.clearCookie('token');
  return res.json({ success: true, message: 'Logged out successfully.' });
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
    }

    const user = rows[0];
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    await pool.execute(`INSERT INTO password_resets (user_id, token, expires_at, created_at)
      VALUES(?,?,?,NOW())`, [user.id, resetToken, expiresAt]);

    await sendEmail(email, 'Reset your Oftix password', `Token: ${resetToken}`);
    return res.json({ success: true, message: 'Password reset instructions sent if account exists.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT user_id, expires_at FROM password_resets WHERE token = ? AND used = 0', [token]);
    if (!rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    const reset = rows[0];
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Reset token has expired.' });
    }

    const hashed = await bcrypt.hash(password, bcryptRounds);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, reset.user_id]);
    await pool.execute('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);

    return res.json({ success: true, message: 'Password reset successful.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, verifyEmail, login, logout, forgotPassword, resetPassword };
