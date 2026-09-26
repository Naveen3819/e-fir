const express = require('express');
const router = express.Router();
const policeController = require('../controllers/policeController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('police', 'admin'));

router.get('/dashboard', policeController.getPoliceDashboard);
router.put('/complaints/:id/verify', policeController.verifyComplaint);
router.post('/complaints/:id/request-information', policeController.requestInformation);
router.put('/complaints/:id/reject', policeController.rejectComplaint);
router.put('/complaints/:id/assign', policeController.assignOfficer);
router.put('/complaints/:id/status', policeController.updateComplaintStatus);

module.exports = router;
