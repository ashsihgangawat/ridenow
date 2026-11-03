import { db } from '../services/db.js';
import { rideSocketEvents } from '../sockets/rideSocket.js';

// Sanitize text input to prevent XSS
const sanitizeText = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
};

export class ChatController {
  /**
   * Helper: verify ride and participant authorization
   */
  static getRideAndParticipants(rideId, userId, userRole) {
    const ride = db.rides.findUnique({ where: { id: rideId } });
    if (!ride) {
      return { error: { status: 404, message: 'Ride not found.' } };
    }

    const customerProfile = db.customerProfiles.findUnique({ where: { id: ride.customerId } });
    const customerUser = customerProfile ? db.users.findUnique({ where: { id: customerProfile.userId } }) : null;

    const driverProfile = ride.driverId ? db.driverProfiles.findUnique({ where: { id: ride.driverId } }) : null;
    const driverUser = driverProfile ? db.users.findUnique({ where: { id: driverProfile.userId } }) : null;

    const isCustomer = customerUser && customerUser.id === userId;
    const isDriver = driverUser && driverUser.id === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'].includes(userRole);

    if (!isCustomer && !isDriver && !isAdmin) {
      return {
        error: {
          status: 403,
          message: 'Access denied: You are not authorized to view or send messages for this ride.'
        }
      };
    }

    return {
      ride,
      customerProfile,
      customerUser,
      driverProfile,
      driverUser,
      isCustomer,
      isDriver,
      isAdmin
    };
  }

  /**
   * Get chat history for a ride
   */
  static async getChatHistory(req, res) {
    try {
      const { rideId } = req.params;
      const { error, ride, customerUser, driverUser, isCustomer, isDriver, isAdmin } =
        ChatController.getRideAndParticipants(rideId, req.user.id, req.user.role);

      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      // Query all messages for this ride in ascending chronological order
      const messages = db.chatMessages.findMany({
        where: { rideId },
        orderBy: { createdAt: 'asc' }
      });

      // Auto mark unread incoming messages as read for this participant
      const unreadIncoming = messages.filter(m => m.receiverId === req.user.id && !m.isRead);
      if (unreadIncoming.length > 0) {
        const readAt = new Date().toISOString();
        unreadIncoming.forEach(msg => {
          try {
            db.chatMessages.update({
              where: { id: msg.id },
              data: { isRead: true, readAt, status: 'READ' }
            });
            msg.isRead = true;
            msg.readAt = readAt;
            msg.status = 'READ';
          } catch (e) {
            // ignore
          }
        });

        rideSocketEvents.notifyMessagesRead({
          rideId,
          readerId: req.user.id,
          readAt
        });
      }

      const isReadOnly = ['COMPLETED', 'CANCELLED'].includes(ride.status);

      return res.json({
        success: true,
        rideId,
        rideStatus: ride.status,
        isReadOnly,
        partner: isCustomer ? {
          name: driverUser?.fullName || 'Driver Partner',
          role: 'DRIVER',
          avatarLetter: driverUser?.fullName?.[0] || 'D'
        } : isDriver ? {
          name: customerUser?.fullName || 'Passenger',
          role: 'RIDER',
          avatarLetter: customerUser?.fullName?.[0] || 'P'
        } : {
          name: 'Support Admin Observer',
          role: 'ADMIN'
        },
        messages
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Send a new chat message
   */
  static async sendMessage(req, res) {
    try {
      const { rideId } = req.params;
      const { message, messageType = 'TEXT' } = req.body;

      // 1. Validate payload
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
      }

      const sanitizedContent = sanitizeText(message);
      if (sanitizedContent.length < 1 || sanitizedContent.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Message length must be between 1 and 500 characters.'
        });
      }

      // 2. Validate participants and permissions
      const { error, ride, customerUser, driverUser, isCustomer, isDriver, isAdmin } =
        ChatController.getRideAndParticipants(rideId, req.user.id, req.user.role);

      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      // 3. Status checks: Read-only on COMPLETED or CANCELLED
      if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot send new messages. Ride is already ${ride.status.toLowerCase()}.`
        });
      }

      // 4. Must have an assigned driver to chat
      if (!ride.driverId || !driverUser) {
        return res.status(400).json({
          success: false,
          message: 'Driver partner has not been assigned to this ride yet.'
        });
      }

      // 5. Determine sender role and receiver
      let senderRole = 'RIDER';
      let receiverId = driverUser.id;

      if (isDriver) {
        senderRole = 'DRIVER';
        receiverId = customerUser.id;
      } else if (isAdmin) {
        senderRole = 'ADMIN';
        receiverId = isCustomer ? driverUser.id : customerUser.id;
      }

      // 6. Save message in DB
      const validMessageType = ['TEXT', 'QUICK_PICKUP', 'SYSTEM'].includes(messageType)
        ? messageType
        : 'TEXT';

      const newMessage = db.chatMessages.create({
        data: {
          rideId,
          senderId: req.user.id,
          receiverId,
          senderRole,
          senderName: req.user.fullName,
          message: sanitizedContent,
          messageType: validMessageType,
          isRead: false,
          readAt: null,
          status: 'SENT'
        }
      });

      // 7. Emit real-time WebSocket event
      rideSocketEvents.notifyNewChatMessage(newMessage);

      return res.status(201).json({
        success: true,
        message: newMessage
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Mark messages as read for a ride
   */
  static async markAsRead(req, res) {
    try {
      const { rideId } = req.params;
      const { error } = ChatController.getRideAndParticipants(rideId, req.user.id, req.user.role);
      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      const unreadList = db.chatMessages.findMany({
        where: { rideId, receiverId: req.user.id, isRead: false }
      });

      const readAt = new Date().toISOString();
      let updatedCount = 0;

      for (const msg of unreadList) {
        try {
          db.chatMessages.update({
            where: { id: msg.id },
            data: { isRead: true, readAt, status: 'READ' }
          });
          updatedCount++;
        } catch (e) {
          // ignore
        }
      }

      if (updatedCount > 0) {
        rideSocketEvents.notifyMessagesRead({
          rideId,
          readerId: req.user.id,
          readAt
        });
      }

      return res.json({ success: true, updatedCount, readAt });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get unread message count for current user
   */
  static async getUnreadCount(req, res) {
    try {
      const { rideId } = req.params;
      const query = { receiverId: req.user.id, isRead: false };
      if (rideId) query.rideId = rideId;

      const unread = db.chatMessages.findMany({ where: query });
      return res.json({ success: true, unreadCount: unread.length });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Secure Contact Details Endpoint:
   * Only allows assigned rider to get assigned driver's phone,
   * or assigned driver to get assigned rider's phone.
   */
  static async getContactDetails(req, res) {
    try {
      const { rideId } = req.params;
      const { error, ride, customerUser, driverUser, driverProfile, isCustomer, isDriver, isAdmin } =
        ChatController.getRideAndParticipants(rideId, req.user.id, req.user.role);

      if (error) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      if (!ride.driverId || !driverUser) {
        return res.status(400).json({
          success: false,
          message: 'No driver is assigned yet for this ride.'
        });
      }

      if (isCustomer) {
        const vehicle = db.vehicles.findFirst({ where: { driverId: driverProfile.id } });
        return res.json({
          success: true,
          contact: {
            role: 'DRIVER',
            name: driverUser.fullName,
            phone: driverUser.phone,
            rating: driverProfile.rating || 5.0,
            vehicle: vehicle ? {
              make: vehicle.make,
              model: vehicle.model,
              registrationNumber: vehicle.registrationNumber,
              color: vehicle.color,
              category: vehicle.category
            } : null
          }
        });
      }

      if (isDriver) {
        return res.json({
          success: true,
          contact: {
            role: 'RIDER',
            name: customerUser?.fullName || 'Passenger',
            phone: customerUser?.phone || '+919893011223'
          }
        });
      }

      if (isAdmin) {
        return res.json({
          success: true,
          contact: {
            rider: { name: customerUser?.fullName, phone: customerUser?.phone },
            driver: { name: driverUser.fullName, phone: driverUser.phone }
          }
        });
      }

      return res.status(403).json({ success: false, message: 'Unauthorized contact lookup.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Super Admin Safety & Dispute Chat Audit
   */
  static async getAdminAuditLogs(req, res) {
    try {
      const { rideId } = req.params;
      if (!req.user.role?.includes('ADMIN')) {
        return res.status(403).json({ success: false, message: 'Super Admin access required.' });
      }

      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      const messages = db.chatMessages.findMany({
        where: { rideId },
        orderBy: { createdAt: 'asc' }
      });

      // Record audit in db.auditLogs
      db.auditLogs.create({
        data: {
          adminId: req.user.id,
          action: 'AUDIT_CHAT_INSPECTION',
          resource: 'RideChat',
          resourceId: rideId,
          details: `Admin ${req.user.fullName} inspected chat logs for ride ${rideId} (${messages.length} messages)`
        }
      });

      return res.json({
        success: true,
        rideId,
        bookingCode: ride.bookingCode,
        rideStatus: ride.status,
        messageCount: messages.length,
        messages
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

