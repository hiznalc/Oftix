const express = require('express');
const { body } = require('express-validator');
const c = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();
router.use(verifyToken, requireRole(['admin']));

router.get('/dashboard', c.stats);

router.get('/users', c.listUsers);
router.put('/users/:id', [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin','branch','client']),
], validateRequest, c.updateUser);
router.delete('/users/:id', c.deleteUser);

router.get('/branches', c.getBranches);
router.post('/branches', [
  body('name').trim().notEmpty(),
  body('location').trim().notEmpty(),
], validateRequest, c.createBranch);
router.put('/branches/:id', [
  body('name').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
], validateRequest, c.updateBranch);
router.delete('/branches/:id', c.removeBranch);

router.get('/clients', c.getAllClients);
router.get('/payments', c.getAllPayments);
router.get('/tickets', c.getAllTickets);
router.get('/plans', c.getPlans);

module.exports = router;
