const pool = require('../config/db');

const stats = async (req, res, next) => {
  try {
    const [[{ total_users }]]    = await pool.execute('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_branches }]] = await pool.execute('SELECT COUNT(*) as total_branches FROM branches');
    const [[{ total_clients }]]  = await pool.execute('SELECT COUNT(*) as total_clients FROM clients');
    const [[{ monthly_revenue }]] = await pool.execute(
      "SELECT COALESCE(SUM(amount),0) as monthly_revenue FROM payments WHERE status='verified' AND MONTH(payment_date)=MONTH(NOW()) AND YEAR(payment_date)=YEAR(NOW())");
    return res.json({ success: true, data: { total_users, total_branches, total_clients, monthly_revenue } });
  } catch (error) { next(error); }
};

const listUsers = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, username, role, branch_id, status, created_at FROM users ORDER BY created_at DESC');
    return res.json({ success: true, data: users });
  } catch (error) { next(error); }
};

const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { name, email, role, branch_id } = req.body;
  if (req.user.id.toString() === id.toString() && role !== 'admin')
    return res.status(403).json({ success: false, message: 'Cannot change own admin role.' });
  try {
    await pool.execute('UPDATE users SET name=?, email=?, role=?, branch_id=? WHERE id=?', [name, email, role, branch_id, id]);
    return res.json({ success: true, message: 'User updated.' });
  } catch (error) { next(error); }
};

const deleteUser = async (req, res, next) => {
  const { id } = req.params;
  if (req.user.id.toString() === id.toString())
    return res.status(403).json({ success: false, message: 'Cannot delete yourself.' });
  try {
    await pool.execute('DELETE FROM users WHERE id=?', [id]);
    return res.json({ success: true, message: 'User deleted.' });
  } catch (error) { next(error); }
};

const getBranches = async (req, res, next) => {
  try {
    const [branches] = await pool.execute('SELECT * FROM branches ORDER BY created_at DESC');
    return res.json({ success: true, data: branches });
  } catch (error) { next(error); }
};

const createBranch = async (req, res, next) => {
  const { name, location, gcash_number } = req.body;
  try {
    await pool.execute('INSERT INTO branches (name, location, gcash_number) VALUES (?, ?, ?)', [name, location, gcash_number || null]);
    return res.status(201).json({ success: true, message: 'Branch created.' });
  } catch (error) { next(error); }
};

const updateBranch = async (req, res, next) => {
  const { id } = req.params;
  const { name, location, gcash_number, status } = req.body;
  try {
    await pool.execute('UPDATE branches SET name=?, location=?, gcash_number=?, status=? WHERE id=?',
      [name, location, gcash_number || null, status || 'active', id]);
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

const getAllClients = async (req, res, next) => {
  try {
    const [clients] = await pool.execute(
      `SELECT c.id, u.name, u.email, u.contact, b.name as branch, p.name as plan,
              p.speed, p.price, c.status, c.installation_date, s.payment_status, s.next_billing_date
       FROM clients c
       JOIN users u ON u.id = c.user_id
       JOIN branches b ON b.id = c.branch_id
       LEFT JOIN subscriptions s ON s.client_id = c.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       ORDER BY c.created_at DESC`);
    return res.json({ success: true, data: clients });
  } catch (error) { next(error); }
};

const getAllPayments = async (req, res, next) => {
  try {
    const [payments] = await pool.execute(
      `SELECT p.id, u.name as client, b.name as branch, p.amount,
              pm.name as method, p.reference_number, p.status, p.payment_date, p.verified_date
       FROM payments p
       JOIN clients c ON c.id = p.client_id
       JOIN users u ON u.id = c.user_id
       JOIN branches b ON b.id = p.branch_id
       LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
       ORDER BY p.created_at DESC`);
    return res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

const getAllTickets = async (req, res, next) => {
  try {
    const [tickets] = await pool.execute(
      `SELECT t.id, u.name as client, b.name as branch, t.subject, t.priority,
              t.category, t.status, t.created_at, t.resolved_at
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN branches b ON b.id = t.branch_id
       ORDER BY t.created_at DESC`);
    return res.json({ success: true, data: tickets });
  } catch (error) { next(error); }
};

const getPlans = async (req, res, next) => {
  try {
    const [plans] = await pool.execute('SELECT * FROM plans ORDER BY price ASC');
    return res.json({ success: true, data: plans });
  } catch (error) { next(error); }
};

module.exports = { stats, listUsers, updateUser, deleteUser, getBranches, createBranch, updateBranch, removeBranch, getAllClients, getAllPayments, getAllTickets, getPlans };
