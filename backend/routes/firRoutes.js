const express = require('express');
const router = express.Router();
const firController = require('../controllers/firController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// List FIRs (Role-filtered in controller)
router.get('/', firController.getFIRs);
router.get('/:id', firController.getFIRById);

// Register FIR (Police & Admin only)
router.post('/', authorize('police', 'admin'), firController.registerFIR);
router.put('/:id', authorize('police', 'admin'), firController.updateFIR);

module.exports = router;
