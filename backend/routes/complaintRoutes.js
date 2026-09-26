const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { uploadEvidence } = require('../config/multer');

// Public tracking by reference
router.get('/status/:reference', complaintController.getComplaintStatus);

// Protected routes
router.use(authenticate);

router.post(
  '/',
  authorize('citizen'),
  uploadEvidence.array('evidenceFiles', 10),
  complaintController.createComplaint
);

router.get('/', complaintController.getComplaints);
router.get('/:id', complaintController.getComplaintById);

router.post(
  '/:id/evidence',
  uploadEvidence.array('evidenceFiles', 10),
  complaintController.uploadEvidence
);

router.post(
  '/:id/respond',
  authorize('citizen'),
  uploadEvidence.array('evidenceFiles', 5),
  complaintController.respondToInfoRequest
);

module.exports = router;
