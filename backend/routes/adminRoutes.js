const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken, requireRole(['admin']));

router.get('/dashboard', adminController.stats);
router.get('/users', adminController.listUsers);
router.put('/users/:id', [
  body('name').optional().trim().notEmpty(),
  body('email').optional().isEmail(),
  body('role').optional().isIn(['admin','branch','client']),
], validateRequest, adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

router.get('/branches', adminController.getBranches);
router.post('/branches', [
  body('name').trim().notEmpty(),
  body('location').trim().notEmpty(),
  body('admin_id').optional().isInt(),
], validateRequest, adminController.createBranch);
router.put('/branches/:id', [
  body('name').optional().trim().notEmpty(),
  body('location').optional().trim().notEmpty(),
  body('admin_id').optional().isInt(),
], validateRequest, adminController.updateBranch);
router.delete('/branches/:id', adminController.removeBranch);

module.exports = router;
