import express from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// 1. Separate Portal Authentication Endpoints
router.post('/rider/signup', AuthController.riderSignup);
router.post('/rider/login', AuthController.riderLogin);

router.post('/driver/signup', AuthController.driverSignup);
router.post('/driver/login', AuthController.driverLogin);

router.post('/admin/login', AuthController.adminLogin);

// 2. Session & Logout
router.post('/logout', requireAuth(), AuthController.logout);

// 3. User & Settings
router.get('/me', requireAuth(), AuthController.getMe);
router.post('/language', requireAuth(), AuthController.updateLanguage);

// 4. Legacy Phone OTP Support (Preserved for backwards compatibility & tests)
router.post('/send-otp', AuthController.sendOtp);
router.post('/verify-otp', AuthController.verifyOtp);

export default router;
