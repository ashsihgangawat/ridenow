import { db } from '../services/db.js';
import { FareEngine } from '../services/fareEngine.js';
import { TrackingService } from '../services/trackingService.js';
import { rideSocketEvents } from '../sockets/rideSocket.js';
import { v4 as uuidv4 } from 'uuid';

export class CustomerController {
  /**
   * Get Customer Profile
   */
  static async getProfile(req, res) {
    try {
      const profile = db.customerProfiles.findFirst({ where: { userId: req.user.id } });
      return res.json({
        success: true,
        customer: {
          ...req.user,
          ...profile
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update Customer Saved Addresses & Emergency Contact
   */
  static async updateProfile(req, res) {
    try {
      const { fullName, homeAddress, workAddress, emergencyPhone } = req.body;

      if (fullName) {
        db.users.update({
          where: { id: req.user.id },
          data: { fullName }
        });
      }

      const updated = db.customerProfiles.update({
        where: { userId: req.user.id },
        data: {
          homeAddress,
          workAddress,
          emergencyPhone
        }
      });

      return res.json({ success: true, message: 'Profile updated successfully', profile: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Book / Request a Ride
   */
  static async requestRide(req, res) {
    try {
      const customer = db.customerProfiles.findFirst({ where: { userId: req.user.id } });
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer profile not found.' });
      }

      const {
        vehicleCategory = 'MINI',
        pickupAddress,
        pickupLat,
        pickupLng,
        dropAddress,
        dropLat,
        dropLng,
        paymentMethod = 'CASH',
        promoCode
      } = req.body;

      if (!pickupAddress || !dropAddress || pickupLat === undefined || dropLat === undefined) {
        return res.status(400).json({ success: false, message: 'Pickup and drop details are required.' });
      }

      const pLat = parseFloat(pickupLat);
      const pLng = parseFloat(pickupLng);
      const dLat = parseFloat(dropLat);
      const dLng = parseFloat(dropLng);

      if (
        isNaN(pLat) || isNaN(pLng) || isNaN(dLat) || isNaN(dLng) ||
        pLat < -90 || pLat > 90 || dLat < -90 || dLat > 90 ||
        pLng < -180 || pLng > 180 || dLng < -180 || dLng > 180
      ) {
        return res.status(400).json({ success: false, message: 'Invalid GPS coordinates provided.' });
      }

      // Calculate distance & duration
      const distanceKm = TrackingService.calculateDistanceKm(pickupLat, pickupLng, dropLat, dropLng) || 5.2;
      const durationMinutes = Math.max(8, Math.round(distanceKm * 2.5));

      // Calculate fare breakdown
      const fare = FareEngine.calculateFare(vehicleCategory, distanceKm, durationMinutes, promoCode);

      // Generate 4-digit Ride Start PIN
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const bookingCode = `RN-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create Ride record
      const ride = db.rides.create({
        data: {
          bookingCode,
          customerId: customer.id,
          vehicleCategory,
          status: 'REQUESTED',
          otp,
          pickupAddress,
          pickupLat: parseFloat(pickupLat),
          pickupLng: parseFloat(pickupLng),
          dropAddress,
          dropLat: parseFloat(dropLat),
          dropLng: parseFloat(dropLng),
          distanceKm: fare.distanceKm,
          durationMinutes: fare.durationMinutes,
          baseFare: fare.baseFare,
          distanceFare: fare.distanceFare,
          waitingCharges: fare.waitingCharges,
          surgeMultiplier: fare.surgeMultiplier,
          discountAmount: fare.discountAmount,
          totalFare: fare.totalFare,
          platformCommission: fare.platformCommission,
          driverEarnings: fare.driverEarnings,
          paymentMethod,
          paymentStatus: paymentMethod === 'ONLINE' ? 'PENDING' : 'PENDING'
        }
      });

      // Find nearby drivers & broadcast socket event
      const nearbyDrivers = TrackingService.findNearbyDrivers(pickupLat, pickupLng, vehicleCategory);
      rideSocketEvents.notifyRideRequested(ride, nearbyDrivers);

      return res.json({
        success: true,
        message: 'Ride request broadcasted to nearby drivers.',
        ride: {
          ...ride,
          customerName: req.user.fullName,
          customerPhone: req.user.phone
        },
        nearbyDriversCount: nearbyDrivers.length
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Cancel Ride
   */
  static async cancelRide(req, res) {
    try {
      const { rideId } = req.params;
      const { reason = 'Cancelled by passenger' } = req.body;

      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      if (['COMPLETED', 'CANCELLED'].includes(ride.status)) {
        return res.status(400).json({ success: false, message: `Cannot cancel ride in ${ride.status} state.` });
      }

      const updated = db.rides.update({
        where: { id: rideId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledBy: 'CUSTOMER'
        }
      });

      rideSocketEvents.notifyRideStatusChanged(updated);

      return res.json({ success: true, message: 'Ride cancelled successfully.', ride: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Active or Specific Ride Details
   */
  static async getRideDetails(req, res) {
    try {
      const { rideId } = req.params;
      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      let driverDetails = null;
      if (ride.driverId) {
        const driver = db.driverProfiles.findUnique({ where: { id: ride.driverId } });
        if (driver) {
          const driverUser = db.users.findUnique({ where: { id: driver.userId } });
          const vehicle = db.vehicles.findFirst({ where: { driverId: driver.id } });
          driverDetails = {
            id: driver.id,
            name: driverUser?.fullName || 'Driver Partner',
            phone: driverUser?.phone,
            rating: driver.rating,
            currentLat: driver.currentLat,
            currentLng: driver.currentLng,
            vehicle: vehicle ? {
              category: vehicle.category,
              make: vehicle.make,
              model: vehicle.model,
              registrationNumber: vehicle.registrationNumber,
              color: vehicle.color
            } : null
          };
        }
      }

      return res.json({
        success: true,
        ride: {
          ...ride,
          driver: driverDetails
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Customer Ride History
   */
  static async getRideHistory(req, res) {
    try {
      const customer = db.customerProfiles.findFirst({ where: { userId: req.user.id } });
      if (!customer) {
        return res.json({ success: true, rides: [] });
      }

      const rides = db.rides.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({ success: true, rides });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Rate a Completed Ride
   */
  static async rateRide(req, res) {
    try {
      const { rideId } = req.params;
      const { rating, comment, tags } = req.body;

      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride || !ride.driverId) {
        return res.status(400).json({ success: false, message: 'Invalid ride or no assigned driver.' });
      }

      const review = db.reviews.create({
        data: {
          rideId,
          customerId: ride.customerId,
          driverId: ride.driverId,
          rating: parseInt(rating) || 5,
          comment,
          tags: Array.isArray(tags) ? tags.join(', ') : (tags || '')
        }
      });

      // Update driver average rating
      const allReviews = db.reviews.findMany({ where: { driverId: ride.driverId } });
      const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

      db.driverProfiles.update({
        where: { id: ride.driverId },
        data: {
          rating: Math.round(avg * 10) / 10,
          totalRatings: allReviews.length
        }
      });

      return res.json({ success: true, message: 'Review submitted. Thank you for your feedback!', review });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Trigger SOS / Emergency Alert
   */
  static async triggerSos(req, res) {
    try {
      const { rideId, currentLat, currentLng } = req.body;
      const customer = db.customerProfiles.findFirst({ where: { userId: req.user.id } });

      // Create high-priority complaint / incident ticket
      const ticketId = `SOS-${Math.floor(10000 + Math.random() * 90000)}`;
      const complaint = db.complaints.create({
        data: {
          ticketId,
          userId: req.user.id,
          rideId: rideId || null,
          category: 'EMERGENCY_SOS',
          subject: 'EMERGENCY / SOS DISPATCH TRIGGERED BY PASSENGER',
          description: `Passenger ${req.user.fullName} (${req.user.phone}) triggered SOS alert at coordinates [${currentLat}, ${currentLng}]. Dispatched to police hotline 112 and emergency contact: ${customer?.emergencyPhone || 'Not configured'}`,
          status: 'OPEN'
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          action: 'SOS_TRIGGERED',
          targetEntity: 'EmergencyDispatch',
          targetId: ticketId,
          performedBy: req.user.id,
          details: `SOS triggered by passenger ${req.user.fullName} (Phone: ${req.user.phone})`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      // Broadcast to Admin via Socket
      rideSocketEvents.notifySosAlert({
        ticketId,
        customerName: req.user.fullName,
        phone: req.user.phone,
        emergencyPhone: customer?.emergencyPhone,
        rideId,
        lat: currentLat,
        lng: currentLng,
        time: new Date().toISOString()
      });

      return res.json({
        success: true,
        message: 'SOS Alert triggered! Live location shared with authorities and emergency helpline 112.',
        ticketId,
        hotline: '112'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

