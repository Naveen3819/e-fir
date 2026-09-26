const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// Download / stream evidence file securely
router.get('/:id/download', evidenceController.getEvidenceFile);

// Download / stream official investigation report / document securely
router.get('/documents/:updateId/download', evidenceController.getDocumentFile);

module.exports = router;
