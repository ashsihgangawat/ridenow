import express from 'express';
import { AdminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];

router.use(requireAuth('ADMIN'));
router.use(requireRole(adminRoles, 'ADMIN'));

// 1. Dashboard Stats
router.get('/dashboard/stats', AdminController.getDashboardStats);

// 2. Customers
router.get('/customers', AdminController.getCustomers);
router.put('/customers/:id/status', AdminController.toggleCustomerStatus);

// 3. Drivers Management & Verification
router.get('/drivers', AdminController.getDrivers);
router.get('/drivers/pending', AdminController.getPendingVerifications);
router.get('/driver/:id', AdminController.getDriverDetails);
router.put('/drivers/:id/status', AdminController.toggleDriverStatus);

// Exact endpoints requested in prompt
router.post('/driver/:id/approve', AdminController.approveDriver);
router.post('/driver/:id/reject', AdminController.rejectDriver);
router.post('/driver/:id/suspend', AdminController.suspendDriver);

// Individual Document Approval & Rejection
router.post('/document/:id/approve', AdminController.approveDocument);
router.post('/document/:id/reject', AdminController.rejectDocument);

// Verification Stats & History
router.get('/verification-stats', AdminController.getVerificationStats);
router.get('/verifications/pending', AdminController.getPendingVerifications);
router.post('/verifications/:driverId/review', AdminController.verifyDriver);

// 5. Vehicles
router.get('/vehicles', AdminController.getVehicles);

// 6. Rides
router.get('/rides', AdminController.getRides);

// 7. Live Ride Tracking
router.get('/live-tracking', AdminController.getLiveTracking);

// 8. Fare Configurations
router.get('/fare-configurations', AdminController.getFareConfigurations);
router.put('/fare-configurations/:category', AdminController.updateFareConfiguration);

// 9. Payments & Refunds
router.get('/payments', AdminController.getPayments);
router.post('/payments/:rideId/refund', AdminController.processRefund);

// 10. Platform Commission
router.get('/commission', AdminController.getCommissionStats);
router.put('/commission', AdminController.updateCommissionRate);

// 11. Promo Codes
router.get('/promos', AdminController.getPromoCodes);
router.post('/promos', AdminController.createPromoCode);

// 12. Complaints
router.get('/complaints', AdminController.getComplaints);
router.put('/complaints/:id/resolve', AdminController.resolveComplaint);

// 13. Reviews
router.get('/reviews', AdminController.getReviews);

// 14. Notifications Broadcast
router.post('/notifications/broadcast', AdminController.broadcastNotification);

// 15. Reports & Analytics
router.get('/analytics', AdminController.getAnalyticsReport);
router.get('/analytics/export-csv', AdminController.exportCsv);

// 16. Admin Users & Roles
router.get('/users', AdminController.getAdminUsers);
router.post('/users', AdminController.createAdminUser);

// 17. System Settings
router.get('/settings', AdminController.getSystemSettings);
router.put('/settings/:key', AdminController.updateSystemSetting);

// 18. API Configuration
router.get('/api-config', AdminController.getApiConfiguration);

// 19. Audit Logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;

