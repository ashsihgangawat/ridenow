import express from 'express';
import { CustomerController } from '../controllers/customerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth('RIDER'));
router.use(requireRole(['RIDER', 'CUSTOMER'], 'RIDER'));

router.get('/profile', CustomerController.getProfile);
router.put('/profile', CustomerController.updateProfile);
router.post('/rides/request', CustomerController.requestRide);
router.get('/rides/history', CustomerController.getRideHistory);
router.get('/rides/:rideId', CustomerController.getRideDetails);
router.post('/rides/:rideId/cancel', CustomerController.cancelRide);
router.post('/rides/:rideId/rate', CustomerController.rateRide);
router.post('/rides/sos', CustomerController.triggerSos);

export default router;
