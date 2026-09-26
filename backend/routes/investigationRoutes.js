const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigationController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { uploadDocument } = require('../config/multer');

router.use(authenticate);

// View investigation details
router.get('/:firId', investigationController.getInvestigationByFIRId);

// Add investigation update (Police & Admin only)
router.post(
  '/:firId/updates',
  authorize('police', 'admin'),
  uploadDocument.single('document'),
  investigationController.addInvestigationUpdate
);

module.exports = router;
