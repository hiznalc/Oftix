const pool = require('../config/db');

const dashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [[{ client_count }]] = await pool.execute('SELECT COUNT(*) as client_count FROM clients WHERE user_id = ?', [userId]);
    return res.json({ success: true, data: { client_count }, message: 'Client dashboard data.' });
  } catch (error) { next(error); }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute('SELECT id, name, email, username, contact, address, role, branch_id FROM users WHERE id = ?', [userId]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User profile not found.' });
    return res.json({ success: true, data: rows[0], message: 'Profile fetched.' });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, contact, address } = req.body;
    await pool.execute('UPDATE users SET name = ?, contact = ?, address = ? WHERE id = ?', [name, contact, address, userId]);
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error) { next(error); }
};

module.exports = { dashboard, getProfile, updateProfile };
