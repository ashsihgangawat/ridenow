let ioInstance = null;

export const initRideSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join user or role specific rooms
    socket.on('join_user', ({ userId, role, driverId }) => {
      if (userId) socket.join(`user_${userId}`);
      if (driverId) socket.join(`driver_${driverId}`);
      if (role?.includes('ADMIN')) socket.join('admin_monitoring');
    });

    socket.on('join_ride', ({ rideId }) => {
      if (rideId) socket.join(`ride_${rideId}`);
    });

    socket.on('join_chat', ({ rideId }) => {
      if (rideId) socket.join(`chat_${rideId}`);
    });

    socket.on('leave_chat', ({ rideId }) => {
      if (rideId) socket.leave(`chat_${rideId}`);
    });

    // Real-time driver telemetry from mobile / browser GPS
    socket.on('update_driver_location', ({ driverId, lat, lng, heading, rideId }) => {
      const payload = { driverId, lat, lng, heading: heading || 0, rideId, timestamp: Date.now() };
      // Broadcast to admin monitoring
      io.to('admin_monitoring').emit('live_driver_moved', payload);
      // If bound to an active ride, stream directly to the passenger's ride room
      if (rideId) {
        io.to(`ride_${rideId}`).emit('driver_location_update', payload);
      }
    });

    socket.on('disconnect', () => {
      // console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

export const rideSocketEvents = {
  notifyRideRequested: (ride, nearbyDrivers) => {
    if (!ioInstance) return;
    nearbyDrivers.forEach(d => {
      ioInstance.to(`driver_${d.driverId}`).emit('new_ride_request', {
        ride,
        distanceKm: d.distanceKm,
        etaMinutes: d.etaMinutes
      });
    });
    ioInstance.to('admin_monitoring').emit('admin_ride_event', { type: 'RIDE_REQUESTED', ride });
  },

  notifyRideAccepted: (ride, driverInfo) => {
    if (!ioInstance) return;
    ioInstance.to(`ride_${ride.id}`).emit('ride_accepted', { ride, driver: driverInfo });
    ioInstance.to(`user_${ride.customerId}`).emit('ride_accepted', { ride, driver: driverInfo });
    ioInstance.to('admin_monitoring').emit('admin_ride_event', { type: 'RIDE_ACCEPTED', ride, driver: driverInfo });
  },

  notifyRideStatusChanged: (ride) => {
    if (!ioInstance) return;
    ioInstance.to(`ride_${ride.id}`).emit('ride_status_updated', { ride });
    ioInstance.to(`user_${ride.customerId}`).emit('ride_status_updated', { ride });
    if (ride.driverId) {
      ioInstance.to(`driver_${ride.driverId}`).emit('ride_status_updated', { ride });
    }
    ioInstance.to('admin_monitoring').emit('admin_ride_event', { type: 'RIDE_STATUS_UPDATED', ride });
  },

  notifyDriverLocation: (driver) => {
    if (!ioInstance) return;
    ioInstance.to('admin_monitoring').emit('driver_location_changed', driver);
  },

  notifyDriverOnlineStatus: (driver) => {
    if (!ioInstance) return;
    ioInstance.to('admin_monitoring').emit('driver_online_changed', driver);
  },

  notifySosAlert: (sosData) => {
    if (!ioInstance) return;
    ioInstance.to('admin_monitoring').emit('sos_triggered', sosData);
  },

  notifyNewChatMessage: (message) => {
    if (!ioInstance) return;
    ioInstance.to(`chat_${message.rideId}`).emit('new_chat_message', message);
    ioInstance.to(`ride_${message.rideId}`).emit('ride_chat_message', message);
    if (message.receiverId) {
      ioInstance.to(`user_${message.receiverId}`).emit('chat_notification', {
        rideId: message.rideId,
        message,
        senderName: message.senderName
      });
    }
    ioInstance.to('admin_monitoring').emit('admin_chat_event', {
      type: 'CHAT_MESSAGE',
      rideId: message.rideId,
      senderRole: message.senderRole,
      messageType: message.messageType
    });
  },

  notifyMessagesRead: ({ rideId, readerId, readAt }) => {
    if (!ioInstance) return;
    ioInstance.to(`chat_${rideId}`).emit('messages_read', { rideId, readerId, readAt });
    ioInstance.to(`ride_${rideId}`).emit('messages_read', { rideId, readerId, readAt });
  }
};

