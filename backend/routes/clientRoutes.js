const express = require('express');
const { body } = require('express-validator');
const c = require('../controllers/clientController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();
router.use(verifyToken, requireRole(['client']));

router.get('/payments/qr', c.getPaymentQR);
router.post('/payments/link', c.createPaymentLink);
router.get('/payments/link/:linkId', c.checkPaymentLink);

router.get('/dashboard', c.dashboard);
router.get('/profile', c.getProfile);
router.put('/profile', [
  body('name').optional().trim().notEmpty(),
  body('contact').optional().trim(),
  body('address').optional().trim(),
], validateRequest, c.updateProfile);

router.get('/subscription', c.getSubscription);

router.get('/payments', c.getPayments);
router.post('/payments', [
  body('payment_method_id').isInt(),
  body('amount').isNumeric(),
], validateRequest, c.submitPayment);

router.get('/tickets', c.getTickets);
router.post('/tickets', [
  body('subject').trim().notEmpty(),
  body('message').trim().notEmpty(),
], validateRequest, c.submitTicket);

router.post('/apply', [
  body('plan_id').isInt(),
], validateRequest, c.applyConnection);

router.get('/plans', c.getPlans);

module.exports = router;
