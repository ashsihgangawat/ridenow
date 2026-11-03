import express from 'express';
import { ChatController } from '../controllers/chatController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// All chat endpoints require a valid session token (RIDER, DRIVER, or ADMIN)
router.use(requireAuth());

// Ride Chat Communication
router.get('/:rideId/messages', ChatController.getChatHistory);
router.post('/:rideId/messages', ChatController.sendMessage);
router.post('/:rideId/read', ChatController.markAsRead);
router.get('/:rideId/unread-count', ChatController.getUnreadCount);
router.get('/:rideId/contact', ChatController.getContactDetails);

// Admin Audit & Safety
router.get('/admin/:rideId/audit', requireRole(['ADMIN', 'SUPER_ADMIN']), ChatController.getAdminAuditLogs);

export default router;

