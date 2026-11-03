import express from 'express';
import { DriverController } from '../controllers/driverController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// --- 1. Public Onboarding Endpoints ---
router.post('/register', DriverController.registerDriver);
router.post('/verify-otp', DriverController.verifyOtp);

// --- 2. Authenticated Driver Endpoints ---
router.use(requireAuth('DRIVER'));
router.use(requireRole(['DRIVER'], 'DRIVER'));

router.get('/verification-status', DriverController.getVerificationStatus);
router.post('/documents/upload', DriverController.uploadKycDocument);
router.get('/profile', DriverController.getProfile);
router.put('/profile', DriverController.updateProfile);
router.post('/toggle-online', DriverController.toggleAvailability);
router.post('/location', DriverController.updateLocation);
router.get('/requests', DriverController.getNearbyRequests);
router.post('/rides/:rideId/accept', DriverController.acceptRide);
router.post('/rides/:rideId/arrived', DriverController.arrivedAtPickup);
router.post('/rides/:rideId/start', DriverController.startRide);
router.post('/rides/:rideId/complete', DriverController.completeRide);
router.get('/earnings', DriverController.getEarnings);

export default router;
