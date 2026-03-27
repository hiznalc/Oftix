const express = require('express');
const { body } = require('express-validator');
const branchController = require('../controllers/branchController');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.use(verifyToken, requireRole(['branch']));

router.get('/dashboard', branchController.dashboard);
router.get('/clients', branchController.listClients);
router.put('/clients/:id', [body('details').trim().notEmpty()], validateRequest, branchController.updateClient);

module.exports = router;
