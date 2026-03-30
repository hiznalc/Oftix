const express = require('express');
const { body } = require('express-validator');
const c = require('../controllers/branchController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();
router.use(verifyToken, requireRole(['branch']));

router.get('/dashboard', c.dashboard);

router.get('/clients', c.listClients);
router.put('/clients/:id', [body('status').notEmpty()], validateRequest, c.updateClient);

router.get('/applications', c.listApplications);
router.put('/applications/:id', [body('status').notEmpty()], validateRequest, c.updateApplication);

router.get('/payments', c.listPayments);
router.put('/payments/:id/verify', c.verifyPayment);

router.get('/tickets', c.listTickets);
router.put('/tickets/:id', [body('status').notEmpty()], validateRequest, c.updateTicket);

router.get('/schedule', c.listSchedule);
router.post('/schedule', [
  body('application_id').isInt(),
  body('scheduled_date').notEmpty(),
], validateRequest, c.addSchedule);

module.exports = router;
