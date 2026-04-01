const pool = require('../config/db');
const QRCode = require('qrcode');

const dashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [clients] = await pool.execute('SELECT id FROM clients WHERE user_id = ?', [userId]);
    const clientId = clients[0]?.id || null;
    let subscription = null;
    if (clientId) {
      const [subs] = await pool.execute(
        `SELECT s.*, p.name as plan_name, p.speed, p.price FROM subscriptions s
         JOIN plans p ON p.id = s.plan_id
         WHERE s.client_id = ? AND s.status = 'active' LIMIT 1`, [clientId]);
      subscription = subs[0] || null;
    }
    return res.json({ success: true, data: { has_subscription: !!subscription, subscription } });
  } catch (error) { next(error); }
};

const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, username, contact, address, role, branch_id FROM users WHERE id = ?',
      [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.json({ success: true, data: rows[0] });
  } catch (error) { next(error); }
};

const updateProfile = async (req, res, next) => {
  const { name, contact, address } = req.body;
  try {
    await pool.execute('UPDATE users SET name = ?, contact = ?, address = ? WHERE id = ?',
      [name, contact, address, req.user.id]);
    return res.json({ success: true, message: 'Profile updated.' });
  } catch (error) { next(error); }
};

const getSubscription = async (req, res, next) => {
  try {
    const [clients] = await pool.execute('SELECT id FROM clients WHERE user_id = ?', [req.user.id]);
    if (!clients.length) return res.json({ success: true, data: null });
    const [subs] = await pool.execute(
      `SELECT s.*, p.name as plan_name, p.speed, p.price, p.description
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.client_id = ? AND s.status = 'active' LIMIT 1`, [clients[0].id]);
    return res.json({ success: true, data: subs[0] || null });
  } catch (error) { next(error); }
};

const getPaymentQR = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.gcash_number, b.name AS branch_name, p.price
       FROM clients c
       JOIN branches b ON b.id = c.branch_id
       LEFT JOIN subscriptions s ON s.client_id = c.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE c.user_id = ? LIMIT 1`, [req.user.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'No client record found.' });
    const { gcash_number, branch_name, price } = rows[0];
    const deepLink = `gcash://pay?number=${gcash_number}&amount=${price || ''}`;
    const qr = await QRCode.toDataURL(deepLink);
    return res.json({ success: true, data: { qr, gcash_number, branch_name, amount: price } });
  } catch (error) { next(error); }
};

const getPayments = async (req, res, next) => {
  try {
    const [clients] = await pool.execute('SELECT id FROM clients WHERE user_id = ?', [req.user.id]);
    if (!clients.length) return res.json({ success: true, data: [] });
    const [payments] = await pool.execute(
      `SELECT p.id, p.amount, pm.name as method, p.reference_number, p.status, p.payment_date, p.verified_date
       FROM payments p LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
       WHERE p.client_id = ? ORDER BY p.created_at DESC`, [clients[0].id]);
    return res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

const submitPayment = async (req, res, next) => {
  const { payment_method_id, reference_number, amount } = req.body;
  try {
    const [clients] = await pool.execute('SELECT id, branch_id FROM clients WHERE user_id = ?', [req.user.id]);
    if (!clients.length) return res.status(400).json({ success: false, message: 'No active client record.' });
    const client = clients[0];
    const [subs] = await pool.execute("SELECT id FROM subscriptions WHERE client_id = ? AND status = 'active' LIMIT 1", [client.id]);
    if (!subs.length) return res.status(400).json({ success: false, message: 'No active subscription.' });
    await pool.execute(
      "INSERT INTO payments (subscription_id, client_id, branch_id, amount, payment_method_id, reference_number, status, payment_date) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())",
      [subs[0].id, client.id, client.branch_id, amount, payment_method_id, reference_number || null]);
    return res.status(201).json({ success: true, message: 'Payment submitted. Awaiting verification.' });
  } catch (error) { next(error); }
};

const getTickets = async (req, res, next) => {
  try {
    const [clients] = await pool.execute('SELECT id FROM clients WHERE user_id = ?', [req.user.id]);
    if (!clients.length) return res.json({ success: true, data: [] });
    const [tickets] = await pool.execute(
      'SELECT id, subject, message, priority, category, status, created_at, resolved_at FROM tickets WHERE client_id = ? ORDER BY created_at DESC',
      [clients[0].id]);
    return res.json({ success: true, data: tickets });
  } catch (error) { next(error); }
};

const submitTicket = async (req, res, next) => {
  const { subject, message, category } = req.body;
  try {
    const [clients] = await pool.execute('SELECT id, branch_id FROM clients WHERE user_id = ?', [req.user.id]);
    if (!clients.length) return res.status(400).json({ success: false, message: 'No active client record.' });
    const client = clients[0];
    await pool.execute(
      "INSERT INTO tickets (client_id, user_id, branch_id, subject, message, category, status) VALUES (?, ?, ?, ?, ?, ?, 'open')",
      [client.id, req.user.id, client.branch_id, subject, message, category || null]);
    return res.status(201).json({ success: true, message: 'Ticket submitted.' });
  } catch (error) { next(error); }
};

const applyConnection = async (req, res, next) => {
  const { plan_id, address, contact } = req.body;
  try {
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ success: false, message: 'No branch assigned to your account.' });
    const [existing] = await pool.execute(
      "SELECT id FROM applications WHERE user_id = ? AND status NOT IN ('rejected','cancelled')", [req.user.id]);
    if (existing.length) return res.status(409).json({ success: false, message: 'You already have an active application.' });
    if (address || contact) {
      await pool.execute('UPDATE users SET address = COALESCE(?, address), contact = COALESCE(?, contact) WHERE id = ?',
        [address || null, contact || null, req.user.id]);
    }
    await pool.execute(
      "INSERT INTO applications (user_id, branch_id, plan_id, status, application_date) VALUES (?, ?, ?, 'pending', NOW())",
      [req.user.id, branchId, plan_id]);
    return res.status(201).json({ success: true, message: 'Application submitted.' });
  } catch (error) { next(error); }
};

const getPlans = async (req, res, next) => {
  try {
    const [plans] = await pool.execute("SELECT id, name, speed, price, description FROM plans WHERE status = 'active' ORDER BY price ASC");
    return res.json({ success: true, data: plans });
  } catch (error) { next(error); }
};

module.exports = { dashboard, getProfile, updateProfile, getSubscription, getPaymentQR, getPayments, submitPayment, getTickets, submitTicket, applyConnection, getPlans };
