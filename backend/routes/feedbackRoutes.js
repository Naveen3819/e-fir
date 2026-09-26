const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);

// Submit feedback (Citizen only)
router.post('/', authorize('citizen'), feedbackController.submitFeedback);

module.exports = router;
