const express = require('express');
const { body } = require('express-validator');
const clientController = require('../controllers/clientController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken, requireRole(['client']));

router.get('/dashboard', clientController.dashboard);
router.get('/profile', clientController.getProfile);
router.put('/profile', [
  body('name').optional().trim().notEmpty(),
  body('contact').optional().trim(),
  body('address').optional().trim(),
], validateRequest, clientController.updateProfile);

module.exports = router;
