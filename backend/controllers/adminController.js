const pool = require('../config/db');

const stats = async (req, res, next) => {
  try {
    const [[{ total_users }]] = await pool.execute('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_branches }]] = await pool.execute('SELECT COUNT(*) as total_branches FROM branches');
    const [[{ total_clients }]] = await pool.execute('SELECT COUNT(*) as total_clients FROM clients');
    return res.json({ success: true, data: { total_users, total_branches, total_clients }, message: 'Admin dashboard data.' });
  } catch (error) { next(error); }
};

const listUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute('SELECT id,name,email,username,role,branch_id,created_at FROM users');
    return res.json({ success: true, data: users, message: 'Users fetched.' });
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, branch_id } = req.body;
  if (req.user.id.toString() === id.toString() && role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Cannot change own admin role.' });
  }
  try {
    await pool.execute('UPDATE users SET name=?, email=?, role=?, branch_id=? WHERE id=?', [name, email, role, branch_id, id]);
    return res.json({ success: true, message: 'User updated.' });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (req.user.id.toString() === id.toString()) return res.status(403).json({ success: false, message: 'Cannot delete yourself.' });
    await pool.execute('DELETE FROM users WHERE id=?', [id]);
    return res.json({ success: true, message: 'User deleted.' });
  } catch (error) { next(error); }
};

const getBranches = async (req, res, next) => {
  try {
    const [branches] = await pool.execute('SELECT * FROM branches');
    return res.json({ success: true, data: branches, message: 'Branches fetched.' });
  } catch (error) { next(error); }
};

const createBranch = async (req, res, next) => {
  const { name, location, admin_id } = req.body;
  try {
    await pool.execute('INSERT INTO branches (name,location,admin_id,created_at) VALUES(?,?,?,NOW())', [name, location, admin_id]);
    return res.status(201).json({ success: true, message: 'Branch created.' });
  } catch (error) { next(error); }
};

const updateBranch = async (req, res, next) => {
  const { id } = req.params;
  const { name, location, admin_id } = req.body;
  try {
    await pool.execute('UPDATE branches SET name=?, location=?, admin_id=? WHERE id=?', [name, location, admin_id, id]);
    return res.json({ success: true, message: 'Branch updated.' });
  } catch (error) { next(error); }
};

const removeBranch = async (req, res, next) => {
  const { id } = req.params;
  try {
    await pool.execute('DELETE FROM branches WHERE id=?', [id]);
    return res.json({ success: true, message: 'Branch deleted.' });
  } catch (error) { next(error); }
};

module.exports = { stats, listUsers, updateUser, deleteUser, getBranches, createBranch, updateBranch, removeBranch };
