const pool = require('../config/db');

const dashboard = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ success: false, message: 'Branch not assigned.' });
    const [[{ total_clients }]] = await pool.execute('SELECT COUNT(*) as total_clients FROM clients WHERE branch_id = ?', [branchId]);
    const [[{ total_tickets }]] = await pool.execute("SELECT COUNT(*) as total_tickets FROM tickets WHERE branch_id = ? AND status NOT IN ('resolved','closed')", [branchId]);
    const [[{ pending_apps }]] = await pool.execute("SELECT COUNT(*) as pending_apps FROM applications WHERE branch_id = ? AND status = 'pending'", [branchId]);
    const [[{ monthly_revenue }]] = await pool.execute("SELECT COALESCE(SUM(amount),0) as monthly_revenue FROM payments WHERE branch_id = ? AND status = 'verified' AND MONTH(payment_date) = MONTH(NOW()) AND YEAR(payment_date) = YEAR(NOW())", [branchId]);
    const [recent_apps] = await pool.execute(
      `SELECT a.id, u.name, p.name as plan, a.application_date, a.status
       FROM applications a
       JOIN users u ON u.id = a.user_id
       JOIN plans p ON p.id = a.plan_id
       WHERE a.branch_id = ? ORDER BY a.created_at DESC LIMIT 5`, [branchId]);
    return res.json({ success: true, data: { total_clients, total_tickets, pending_apps, monthly_revenue, recent_apps } });
  } catch (error) { next(error); }
};

const listClients = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const [clients] = await pool.execute(
      `SELECT c.id, u.name, u.email, u.contact, u.address, c.status, c.installation_date,
              p.name as plan, p.speed, p.price, s.payment_status, s.next_billing_date
       FROM clients c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN subscriptions s ON s.client_id = c.id AND s.status = 'active'
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE c.branch_id = ? ORDER BY c.created_at DESC`, [branchId]);
    return res.json({ success: true, data: clients });
  } catch (error) { next(error); }
};

const updateClient = async (req, res, next) => {
  const { id } = req.params;
  const branchId = req.user.branch_id;
  const { status } = req.body;
  try {
    const [rows] = await pool.execute('SELECT branch_id FROM clients WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Client not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });
    await pool.execute('UPDATE clients SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);
    return res.json({ success: true, message: 'Client updated.' });
  } catch (error) { next(error); }
};

const listApplications = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const [apps] = await pool.execute(
      `SELECT a.id, u.name, u.contact, u.address, p.name as plan, p.price,
              a.status, a.application_date, a.approval_date, a.installation_date, a.notes
       FROM applications a
       JOIN users u ON u.id = a.user_id
       JOIN plans p ON p.id = a.plan_id
       WHERE a.branch_id = ? ORDER BY a.created_at DESC`, [branchId]);
    return res.json({ success: true, data: apps });
  } catch (error) { next(error); }
};

const updateApplication = async (req, res, next) => {
  const { id } = req.params;
  const branchId = req.user.branch_id;
  const { status, notes } = req.body;
  try {
    const [rows] = await pool.execute('SELECT branch_id, user_id, plan_id FROM applications WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });

    const approval_date = status === 'approved' ? new Date() : null;
    const install_date  = status === 'installed' ? new Date() : null;

    await pool.execute(
      'UPDATE applications SET status = ?, notes = ?, approval_date = COALESCE(?, approval_date), installation_date = COALESCE(?, installation_date), updated_at = NOW() WHERE id = ?',
      [status, notes || null, approval_date, install_date, id]);

    // When installed → create client record + subscription
    if (status === 'installed') {
      const { user_id, plan_id } = rows[0];
      const [existing] = await pool.execute('SELECT id FROM clients WHERE user_id = ? AND branch_id = ?', [user_id, branchId]);
      let clientId;
      if (!existing.length) {
        const [ins] = await pool.execute(
          'INSERT INTO clients (user_id, branch_id, status, installation_date) VALUES (?, ?, ?, NOW())',
          [user_id, branchId, 'active']);
        clientId = ins.insertId;
      } else {
        clientId = existing[0].id;
        await pool.execute("UPDATE clients SET status = 'active', installation_date = NOW() WHERE id = ?", [clientId]);
      }
      const [existSub] = await pool.execute("SELECT id FROM subscriptions WHERE client_id = ? AND status = 'active'", [clientId]);
      if (!existSub.length) {
        const nextBilling = new Date(); nextBilling.setMonth(nextBilling.getMonth() + 1);
        await pool.execute(
          "INSERT INTO subscriptions (client_id, plan_id, start_date, next_billing_date, status, payment_status) VALUES (?, ?, NOW(), ?, 'active', 'unpaid')",
          [clientId, plan_id, nextBilling]);
      }
    }
    return res.json({ success: true, message: 'Application updated.' });
  } catch (error) { next(error); }
};

const listPayments = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const [payments] = await pool.execute(
      `SELECT p.id, u.name as client, p.amount, pm.name as method,
              p.reference_number, p.status, p.payment_date, p.verified_date, p.receipt_url
       FROM payments p
       JOIN clients c ON c.id = p.client_id
       JOIN users u ON u.id = c.user_id
       LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
       WHERE p.branch_id = ? ORDER BY p.created_at DESC`, [branchId]);
    return res.json({ success: true, data: payments });
  } catch (error) { next(error); }
};

const verifyPayment = async (req, res, next) => {
  const { id } = req.params;
  const branchId = req.user.branch_id;
  try {
    const [rows] = await pool.execute('SELECT branch_id, subscription_id FROM payments WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });
    await pool.execute(
      "UPDATE payments SET status = 'verified', verified_date = NOW(), verified_by = ? WHERE id = ?",
      [req.user.id, id]);
    await pool.execute(
      "UPDATE subscriptions SET payment_status = 'paid' WHERE id = ?",
      [rows[0].subscription_id]);
    return res.json({ success: true, message: 'Payment verified.' });
  } catch (error) { next(error); }
};

const listTickets = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const [tickets] = await pool.execute(
      `SELECT t.id, u.name as client, t.subject, t.message, t.priority, t.category,
              t.status, t.created_at, t.resolved_at
       FROM tickets t
       JOIN users u ON u.id = t.user_id
       WHERE t.branch_id = ? ORDER BY t.created_at DESC`, [branchId]);
    return res.json({ success: true, data: tickets });
  } catch (error) { next(error); }
};

const updateTicket = async (req, res, next) => {
  const { id } = req.params;
  const branchId = req.user.branch_id;
  const { status } = req.body;
  try {
    const [rows] = await pool.execute('SELECT branch_id FROM tickets WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });
    const resolved_at = status === 'resolved' ? new Date() : null;
    await pool.execute(
      'UPDATE tickets SET status = ?, resolved_at = COALESCE(?, resolved_at), updated_at = NOW() WHERE id = ?',
      [status, resolved_at, id]);
    return res.json({ success: true, message: 'Ticket updated.' });
  } catch (error) { next(error); }
};

const listSchedule = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    const [schedule] = await pool.execute(
      `SELECT s.id, u.name as client, u.address, p.name as plan,
              s.scheduled_date, s.technician_team, s.status, s.notes
       FROM installation_schedule s
       JOIN applications a ON a.id = s.application_id
       JOIN users u ON u.id = a.user_id
       JOIN plans p ON p.id = a.plan_id
       WHERE a.branch_id = ? ORDER BY s.scheduled_date ASC`, [branchId]);
    return res.json({ success: true, data: schedule });
  } catch (error) { next(error); }
};

const addSchedule = async (req, res, next) => {
  const { application_id, scheduled_date, technician_team, notes } = req.body;
  const branchId = req.user.branch_id;
  try {
    const [rows] = await pool.execute('SELECT branch_id FROM applications WHERE id = ?', [application_id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });
    await pool.execute(
      "INSERT INTO installation_schedule (application_id, scheduled_date, technician_team, notes, status) VALUES (?, ?, ?, ?, 'scheduled')",
      [application_id, scheduled_date, technician_team || null, notes || null]);
    await pool.execute("UPDATE applications SET status = 'scheduled' WHERE id = ?", [application_id]);
    return res.status(201).json({ success: true, message: 'Scheduled.' });
  } catch (error) { next(error); }
};

module.exports = { dashboard, listClients, updateClient, listApplications, updateApplication, listPayments, verifyPayment, listTickets, updateTicket, listSchedule, addSchedule };
