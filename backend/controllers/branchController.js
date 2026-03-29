const pool = require('../config/db');

const dashboard = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ success: false, message: 'Branch not assigned.' });
    const [[{ total_clients }]] = await pool.execute('SELECT COUNT(*) as total_clients FROM clients WHERE branch_id = ?', [branchId]);
    const [[{ total_tickets }]] = await pool.execute('SELECT COUNT(*) as total_tickets FROM tickets WHERE branch_id = ?', [branchId]);
    return res.json({ success: true, data: { total_clients, total_tickets }, message: 'Branch dashboard data.' });
  } catch (error) { next(error); }
};

const listClients = async (req, res, next) => {
  try {
    const branchId = req.user.branch_id;
    if (!branchId) return res.status(400).json({ success: false, message: 'Branch not assigned.' });
    const [clients] = await pool.execute('SELECT * FROM clients WHERE branch_id = ?', [branchId]);
    return res.json({ success: true, data: clients, message: 'Clients fetched.' });
  } catch (error) { next(error); }
};

const updateClient = async (req, res, next) => {
  const { id } = req.params;
  const branchId = req.user.branch_id;
  const { details } = req.body;
  try {
    const [rows] = await pool.execute('SELECT branch_id FROM clients WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Client not found.' });
    if (rows[0].branch_id !== branchId) return res.status(403).json({ success: false, message: 'Forbidden.' });

    await pool.execute('UPDATE clients SET details = ?, updated_at = NOW() WHERE id = ?', [details, id]);
    return res.json({ success: true, message: 'Client updated.' });
  } catch (error) { next(error); }
};

module.exports = { dashboard, listClients, updateClient };
