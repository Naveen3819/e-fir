const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

router.use(authenticate);
router.use(authorize('admin'));

// Admin Dashboard Analytics
router.get('/dashboard', adminController.getAdminDashboard);

// User & Citizen Management
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.toggleUserStatus);

// Officers Management
router.get('/officers', adminController.getOfficers);
router.post('/officers', adminController.createOfficer);

// Police Stations Management
router.get('/stations', adminController.getStations);
router.post('/stations', adminController.createStation);
router.put('/stations/:id', adminController.updateStation);

// Complaint Categories
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

module.exports = router;
