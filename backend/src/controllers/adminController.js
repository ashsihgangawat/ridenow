import { db } from '../services/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class AdminController {
  /**
   * 1. Dashboard Overview Stats
   */
  static async getDashboardStats(req, res) {
    try {
      const customers = db.customerProfiles.findMany();
      const drivers = db.driverProfiles.findMany();
      const onlineDrivers = drivers.filter(d => d.isOnline);
      const activeDrivers = drivers.filter(d => d.verificationStatus === 'APPROVED');
      const pendingDrivers = drivers.filter(d => d.verificationStatus === 'PENDING');

      const rides = db.rides.findMany();
      const ongoingRides = rides.filter(r => ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status));
      const completedRides = rides.filter(r => r.status === 'COMPLETED');
      const cancelledRides = rides.filter(r => r.status === 'CANCELLED');

      const totalRevenue = completedRides.reduce((sum, r) => sum + r.totalFare, 0);
      const platformCommission = completedRides.reduce((sum, r) => sum + r.platformCommission, 0);

      return res.json({
        success: true,
        stats: {
          totalCustomers: customers.length,
          totalDrivers: drivers.length,
          activeDrivers: activeDrivers.length,
          onlineDrivers: onlineDrivers.length,
          pendingDriverApprovals: pendingDrivers.length,
          totalRides: rides.length,
          ongoingRides: ongoingRides.length,
          completedRides: completedRides.length,
          cancelledRides: cancelledRides.length,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          platformCommission: Math.round(platformCommission * 100) / 100
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 2. Customers Management
   */
  static async getCustomers(req, res) {
    try {
      const users = db.users.findMany({ where: { role: 'CUSTOMER' }, orderBy: { createdAt: 'desc' } });
      const customers = users.map(u => {
        const profile = db.customerProfiles.findFirst({ where: { userId: u.id } });
        const ridesCount = db.rides.count({ where: { customerId: profile?.id } });
        return {
          ...u,
          walletBalance: profile?.walletBalance || 0,
          totalRides: ridesCount
        };
      });
      return res.json({ success: true, customers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async toggleCustomerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // ACTIVE or SUSPENDED

      const updated = db.users.update({
        where: { id },
        data: { status }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          action: 'TOGGLE_CUSTOMER_STATUS',
          targetEntity: 'Customer',
          targetId: id,
          performedBy: req.user.id,
          details: `Changed customer ${updated.fullName} status to ${status}`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: `Customer marked as ${status}`, customer: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 3. Drivers Management
   */
  static async getDrivers(req, res) {
    try {
      const users = db.users.findMany({ where: { role: 'DRIVER' }, orderBy: { createdAt: 'desc' } });
      const drivers = users.map(u => {
        const profile = db.driverProfiles.findFirst({ where: { userId: u.id } });
        const vehicle = profile ? db.vehicles.findFirst({ where: { driverId: profile.id } }) : null;
        const docs = profile ? db.driverDocuments.findMany({ where: { driverId: profile.id } }) : [];
        return {
          ...u,
          driverId: profile?.id,
          verificationStatus: profile?.verificationStatus,
          isOnline: profile?.isOnline,
          rating: profile?.rating,
          totalTrips: profile?.totalTrips,
          walletBalance: profile?.walletBalance,
          licenseNumber: profile?.licenseNumber,
          vehicle,
          documentsCount: docs.length
        };
      });
      return res.json({ success: true, drivers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async toggleDriverStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updated = db.users.update({
        where: { id },
        data: { status }
      });

      db.auditLogs.create({
        data: {
          action: 'TOGGLE_DRIVER_STATUS',
          targetEntity: 'Driver',
          targetId: id,
          performedBy: req.user.id,
          details: `Changed driver ${updated.fullName} status to ${status}`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: `Driver status changed to ${status}`, driver: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 4. Driver Verification (KYC)
   */
  static async getPendingVerifications(req, res) {
    try {
      const pendingProfiles = db.driverProfiles.findMany({
        where: {
          // Find all pending, under review or correction required
        }
      }).filter(dp => ['PENDING', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CORRECTION_REQUIRED'].includes(dp.verificationStatus));

      const list = pendingProfiles.map(dp => {
        const user = db.users.findUnique({ where: { id: dp.userId } });
        const vehicle = db.vehicles.findFirst({ where: { driverId: dp.id } });
        const documents = db.driverDocuments.findMany({ where: { driverId: dp.id } });
        return {
          driverId: dp.id,
          userId: dp.userId,
          fullName: user?.fullName,
          phone: user?.phone,
          email: user?.email,
          profilePhotoUrl: user?.profilePhotoUrl || dp.profilePhotoUrl,
          licenseNumber: dp.licenseNumber,
          verificationStatus: dp.verificationStatus,
          rejectionReason: dp.rejectionReason,
          vehicle,
          documents,
          documentsCount: documents.length,
          appliedAt: dp.createdAt
        };
      });

      return res.json({ success: true, pendingVerifications: list });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Specific Driver Details with All 7 Documents and Audit Trail
   */
  static async getDriverDetails(req, res) {
    try {
      const driverId = req.params.driverId || req.params.id;
      let driver = db.driverProfiles.findUnique({ where: { id: driverId } });
      if (!driver) {
        driver = db.driverProfiles.findFirst({ where: { userId: driverId } });
      }
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      const user = db.users.findUnique({ where: { id: driver.userId } });
      const vehicle = db.vehicles.findFirst({ where: { driverId: driver.id } });
      const documents = db.driverDocuments.findMany({ where: { driverId: driver.id } });
      const auditLogs = db.auditLogs.findMany({
        where: { entityType: 'DRIVER', entityId: driver.id },
        orderBy: { timestamp: 'desc' }
      });

      return res.json({
        success: true,
        driver: {
          ...user,
          ...driver,
          vehicle,
          documents,
          auditLogs
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Approve Individual Document
   */
  static async approveDocument(req, res) {
    try {
      const documentId = req.params.documentId || req.params.id;
      const doc = db.driverDocuments.findUnique({ where: { id: documentId } });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const updatedDoc = db.driverDocuments.update({
        where: { id: documentId },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user?.id || 'SUPER_ADMIN'
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: doc.driverId,
          action: 'DOCUMENT_APPROVED',
          performedBy: req.user?.id || 'SUPER_ADMIN',
          previousStatus: doc.status,
          newStatus: 'APPROVED',
          notes: `${doc.documentType} was approved by Admin`,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: `${doc.documentType} successfully approved.`,
        document: updatedDoc
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Reject Individual Document (with Reason)
   */
  static async rejectDocument(req, res) {
    try {
      const documentId = req.params.documentId || req.params.id;
      const { rejectionReason = 'Document is blurred, illegible, or invalid' } = req.body;

      const doc = db.driverDocuments.findUnique({ where: { id: documentId } });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Document not found.' });
      }

      const updatedDoc = db.driverDocuments.update({
        where: { id: documentId },
        data: {
          status: 'REJECTED',
          rejectionReason,
          reviewedAt: new Date().toISOString(),
          reviewedBy: req.user?.id || 'SUPER_ADMIN'
        }
      });

      // Transition driver status to CORRECTION_REQUIRED
      db.driverProfiles.update({
        where: { id: doc.driverId },
        data: {
          verificationStatus: 'CORRECTION_REQUIRED',
          rejectionReason
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: doc.driverId,
          action: 'DOCUMENT_REJECTED',
          performedBy: req.user?.id || 'SUPER_ADMIN',
          previousStatus: doc.status,
          newStatus: 'REJECTED',
          notes: `${doc.documentType} rejected: ${rejectionReason}`,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: `${doc.documentType} rejected. Driver notified for correction.`,
        document: updatedDoc
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Final Driver Approval
   */
  static async approveDriver(req, res) {
    try {
      const driverId = req.params.driverId || req.params.id;
      let driver = db.driverProfiles.findUnique({ where: { id: driverId } });
      if (!driver) {
        driver = db.driverProfiles.findFirst({ where: { userId: driverId } });
      }
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      const updated = db.driverProfiles.update({
        where: { id: driver.id },
        data: {
          verificationStatus: 'APPROVED',
          adminApproved: true,
          rejectionReason: null
        }
      });

      // Mark all pending docs as approved
      const docs = db.driverDocuments.findMany({ where: { driverId: driver.id } });
      docs.forEach(d => {
        if (d.status !== 'APPROVED') {
          db.driverDocuments.update({
            where: { id: d.id },
            data: { status: 'APPROVED', reviewedAt: new Date().toISOString(), reviewedBy: req.user?.id || 'SUPER_ADMIN' }
          });
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: driver.id,
          action: 'DRIVER_APPROVED',
          performedBy: req.user?.id || 'SUPER_ADMIN',
          previousStatus: driver.verificationStatus,
          newStatus: 'APPROVED',
          notes: 'Driver profile and all documents approved by compliance admin',
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Driver successfully approved. Driver can now go online and accept ride bookings.',
        driver: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Reject Driver
   */
  static async rejectDriver(req, res) {
    try {
      const driverId = req.params.driverId || req.params.id;
      const { rejectionReason = 'Verification criteria not satisfied' } = req.body;

      let driver = db.driverProfiles.findUnique({ where: { id: driverId } });
      if (!driver) {
        driver = db.driverProfiles.findFirst({ where: { userId: driverId } });
      }
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      const updated = db.driverProfiles.update({
        where: { id: driver.id },
        data: {
          verificationStatus: 'REJECTED',
          adminApproved: false,
          isOnline: false,
          rejectionReason
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: driver.id,
          action: 'DRIVER_REJECTED',
          performedBy: req.user?.id || 'SUPER_ADMIN',
          previousStatus: driver.verificationStatus,
          newStatus: 'REJECTED',
          notes: `Driver rejected: ${rejectionReason}`,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Driver verification rejected.',
        driver: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Suspend Driver
   */
  static async suspendDriver(req, res) {
    try {
      const driverId = req.params.driverId || req.params.id;
      const { suspensionReason = 'Account suspended due to policy violation or safety complaints' } = req.body;

      let driver = db.driverProfiles.findUnique({ where: { id: driverId } });
      if (!driver) {
        driver = db.driverProfiles.findFirst({ where: { userId: driverId } });
      }
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      const updated = db.driverProfiles.update({
        where: { id: driver.id },
        data: {
          verificationStatus: 'SUSPENDED',
          adminApproved: false,
          isOnline: false,
          rejectionReason: suspensionReason
        }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: driver.id,
          action: 'DRIVER_SUSPENDED',
          performedBy: req.user?.id || 'SUPER_ADMIN',
          previousStatus: driver.verificationStatus,
          newStatus: 'SUSPENDED',
          notes: `Driver suspended: ${suspensionReason}`,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: 'Driver suspended successfully. Real-time dispatch disabled.',
        driver: updated
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Driver Verification Metrics & Stats
   */
  static async getVerificationStats(req, res) {
    try {
      const drivers = db.driverProfiles.findMany();
      const vehicles = db.vehicles.findMany();

      const totalDrivers = drivers.length;
      const pendingVerification = drivers.filter(d => ['PENDING', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'CORRECTION_REQUIRED'].includes(d.verificationStatus)).length;
      const approvedDrivers = drivers.filter(d => d.verificationStatus === 'APPROVED').length;
      const rejectedDrivers = drivers.filter(d => d.verificationStatus === 'REJECTED').length;
      const suspendedDrivers = drivers.filter(d => d.verificationStatus === 'SUSPENDED').length;

      const bikeDrivers = vehicles.filter(v => v.category === 'BIKE').length;
      const carDrivers = vehicles.filter(v => ['CAR', 'SEDAN', 'SUV', 'MINI'].includes(v.category)).length;

      return res.json({
        success: true,
        stats: {
          totalDrivers,
          pendingVerification,
          approvedDrivers,
          rejectedDrivers,
          suspendedDrivers,
          bikeDrivers,
          carDrivers
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async verifyDriver(req, res) {
    try {
      const { driverId } = req.params;
      const { status, rejectionReason } = req.body; // 'APPROVED' or 'REJECTED'

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
      }

      if (status === 'APPROVED') {
        req.params.driverId = driverId;
        return AdminController.approveDriver(req, res);
      } else {
        req.params.driverId = driverId;
        req.body.rejectionReason = rejectionReason;
        return AdminController.rejectDriver(req, res);
      }
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 5. Vehicles Fleet Management
   */
  static async getVehicles(req, res) {
    try {
      const vehicles = db.vehicles.findMany();
      const enriched = vehicles.map(v => {
        const driver = db.driverProfiles.findUnique({ where: { id: v.driverId } });
        const user = driver ? db.users.findUnique({ where: { id: driver.userId } }) : null;
        return {
          ...v,
          driverName: user?.fullName || 'Unassigned',
          driverPhone: user?.phone
        };
      });
      return res.json({ success: true, vehicles: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 6. Ride Management
   */
  static async getRides(req, res) {
    try {
      const { status, category } = req.query;
      let rides = db.rides.findMany({ orderBy: { createdAt: 'desc' } });

      if (status) {
        rides = rides.filter(r => r.status === status);
      }
      if (category) {
        rides = rides.filter(r => r.vehicleCategory === category);
      }

      const enriched = rides.map(r => {
        const customer = db.customerProfiles.findUnique({ where: { id: r.customerId } });
        const customerUser = customer ? db.users.findUnique({ where: { id: customer.userId } }) : null;
        const driver = r.driverId ? db.driverProfiles.findUnique({ where: { id: r.driverId } }) : null;
        const driverUser = driver ? db.users.findUnique({ where: { id: driver.userId } }) : null;

        return {
          ...r,
          customerName: customerUser?.fullName || 'Customer',
          customerPhone: customerUser?.phone,
          driverName: driverUser?.fullName || 'Unassigned',
          driverPhone: driverUser?.phone
        };
      });

      return res.json({ success: true, rides: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 7. Live Ride & Driver Telemetry Tracking
   */
  static async getLiveTracking(req, res) {
    try {
      const ongoingRides = db.rides.findMany({
        where: {
          status: ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS']
        }
      });

      const onlineDrivers = db.driverProfiles.findMany({
        where: { isOnline: true }
      }).map(d => {
        const user = db.users.findUnique({ where: { id: d.userId } });
        const vehicle = db.vehicles.findFirst({ where: { driverId: d.id } });
        return {
          driverId: d.id,
          name: user?.fullName,
          phone: user?.phone,
          lat: d.currentLat || 28.6139,
          lng: d.currentLng || 77.2090,
          category: vehicle?.category || 'MINI',
          rating: d.rating
        };
      });

      return res.json({
        success: true,
        activeRidesCount: ongoingRides.length,
        onlineDriversCount: onlineDrivers.length,
        rides: ongoingRides,
        drivers: onlineDrivers
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 8. Fare Management
   */
  static async getFareConfigurations(req, res) {
    try {
      const configs = db.fareConfigurations.findMany();
      return res.json({ success: true, fareConfigurations: configs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateFareConfiguration(req, res) {
    try {
      const { category } = req.params;
      const { baseFare, perKmRate, waitingRateMin, minimumFare, surgeMultiplier } = req.body;

      const updated = db.fareConfigurations.update({
        where: { category },
        data: {
          baseFare: parseFloat(baseFare),
          perKmRate: parseFloat(perKmRate),
          waitingRateMin: parseFloat(waitingRateMin),
          minimumFare: parseFloat(minimumFare),
          surgeMultiplier: parseFloat(surgeMultiplier || 1.0)
        }
      });

      db.auditLogs.create({
        data: {
          action: 'UPDATE_FARE_CONFIG',
          targetEntity: 'FareConfiguration',
          targetId: category,
          performedBy: req.user.id,
          details: `Updated rates for ${category}: Base ₹${baseFare}, Per KM ₹${perKmRate}, Surge ${surgeMultiplier}x`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: `Fare config for ${category} updated.`, fareConfig: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 9. Payments & Refunds Management
   */
  static async getPayments(req, res) {
    try {
      const rides = db.rides.findMany({
        where: { paymentStatus: 'SUCCESS' },
        orderBy: { createdAt: 'desc' }
      });

      const payments = rides.map(r => ({
        id: r.id,
        bookingCode: r.bookingCode,
        amount: r.totalFare,
        method: r.paymentMethod,
        status: r.paymentStatus,
        platformCommission: r.platformCommission,
        driverEarnings: r.driverEarnings,
        date: r.completedAt || r.createdAt
      }));

      return res.json({ success: true, payments });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async processRefund(req, res) {
    try {
      const { rideId } = req.params;
      const { reason, amount } = req.body;

      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      const refund = db.refunds.create({
        data: {
          paymentId: rideId,
          amount: parseFloat(amount) || ride.totalFare,
          reason: reason || 'Customer dispute resolution',
          status: 'SUCCESS',
          processedBy: req.user.id
        }
      });

      db.rides.update({
        where: { id: rideId },
        data: { paymentStatus: 'REFUNDED' }
      });

      db.auditLogs.create({
        data: {
          action: 'PROCESS_REFUND',
          targetEntity: 'Payment',
          targetId: rideId,
          performedBy: req.user.id,
          details: `Refunded ₹${amount} for ride ${ride.bookingCode}. Reason: ${reason}`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: 'Refund processed successfully.', refund });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 10. Platform Commission Management
   */
  static async getCommissionStats(req, res) {
    try {
      const records = db.commissionRecords.findMany();
      const totalCommission = records.reduce((sum, r) => sum + r.platformAmount, 0);
      const totalGross = records.reduce((sum, r) => sum + r.grossFare, 0);
      const setting = db.systemSettings.findFirst({ where: { key: 'PLATFORM_COMMISSION_PERCENT' } });

      return res.json({
        success: true,
        currentRatePercent: setting ? parseFloat(setting.value) : 15.0,
        totalGrossVolume: Math.round(totalGross * 100) / 100,
        totalPlatformCommission: Math.round(totalCommission * 100) / 100,
        records: records.slice(0, 50)
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateCommissionRate(req, res) {
    try {
      const { ratePercent } = req.body;
      const num = parseFloat(ratePercent);
      if (isNaN(num) || num < 0 || num > 50) {
        return res.status(400).json({ success: false, message: 'Commission rate must be between 0% and 50%.' });
      }

      db.systemSettings.update({
        where: { key: 'PLATFORM_COMMISSION_PERCENT' },
        data: { value: num.toString() }
      });

      db.auditLogs.create({
        data: {
          action: 'UPDATE_COMMISSION_RATE',
          targetEntity: 'SystemSetting',
          targetId: 'PLATFORM_COMMISSION_PERCENT',
          performedBy: req.user.id,
          details: `Platform commission rate updated to ${num}%`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: `Commission updated to ${num}%`, ratePercent: num });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 11. Promo Codes
   */
  static async getPromoCodes(req, res) {
    try {
      const promoCodes = db.promoCodes.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json({ success: true, promoCodes });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createPromoCode(req, res) {
    try {
      const { code, description, discountPercent, maxDiscount, minRideAmount, validUntil } = req.body;

      const promo = db.promoCodes.create({
        data: {
          code: code.toUpperCase().trim(),
          description,
          discountPercent: parseFloat(discountPercent),
          maxDiscount: parseFloat(maxDiscount),
          minRideAmount: parseFloat(minRideAmount || 100),
          validUntil: validUntil || '2028-12-31T23:59:59.000Z',
          maxUses: 1000,
          usedCount: 0,
          isActive: true
        }
      });

      return res.json({ success: true, message: 'Promo code created.', promo });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 12. Customer & Driver Complaints
   */
  static async getComplaints(req, res) {
    try {
      const complaints = db.complaints.findMany({ orderBy: { createdAt: 'desc' } });
      const enriched = complaints.map(c => {
        const user = db.users.findUnique({ where: { id: c.userId } });
        return {
          ...c,
          userName: user?.fullName || 'User',
          userRole: user?.role,
          phone: user?.phone
        };
      });
      return res.json({ success: true, complaints: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async resolveComplaint(req, res) {
    try {
      const { id } = req.params;
      const { resolution, status = 'RESOLVED' } = req.body;

      const updated = db.complaints.update({
        where: { id },
        data: {
          resolution,
          status,
          resolvedBy: req.user.fullName
        }
      });

      return res.json({ success: true, message: 'Complaint resolved.', complaint: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 13. Reviews & Ratings Moderation
   */
  static async getReviews(req, res) {
    try {
      const reviews = db.reviews.findMany({ orderBy: { createdAt: 'desc' } });
      const enriched = reviews.map(r => {
        const driver = db.driverProfiles.findUnique({ where: { id: r.driverId } });
        const driverUser = driver ? db.users.findUnique({ where: { id: driver.userId } }) : null;
        const customer = db.customerProfiles.findUnique({ where: { id: r.customerId } });
        const customerUser = customer ? db.users.findUnique({ where: { id: customer.userId } }) : null;
        return {
          ...r,
          driverName: driverUser?.fullName || 'Driver',
          customerName: customerUser?.fullName || 'Customer'
        };
      });
      return res.json({ success: true, reviews: enriched });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 14. Notifications Broadcast
   */
  static async broadcastNotification(req, res) {
    try {
      const { title, message, targetRole = 'ALL' } = req.body;

      let recipients = [];
      if (targetRole === 'ALL') {
        recipients = db.users.findMany();
      } else {
        recipients = db.users.findMany({ where: { role: targetRole } });
      }

      recipients.forEach(u => {
        db.notifications.create({
          data: {
            userId: u.id,
            title,
            message,
            type: 'BROADCAST'
          }
        });
      });

      return res.json({
        success: true,
        message: `Notification broadcasted to ${recipients.length} users.`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 15. Reports & Analytics / CSV Export
   */
  static async getAnalyticsReport(req, res) {
    try {
      const rides = db.rides.findMany();
      const completedRides = rides.filter(r => r.status === 'COMPLETED');

      // Daily breakdown
      const dailyMap = {};
      completedRides.forEach(r => {
        const date = (r.completedAt || r.createdAt).slice(0, 10);
        if (!dailyMap[date]) dailyMap[date] = { date, rides: 0, revenue: 0, commission: 0 };
        dailyMap[date].rides += 1;
        dailyMap[date].revenue += r.totalFare;
        dailyMap[date].commission += r.platformCommission;
      });

      const categoryMap = {};
      rides.forEach(r => {
        categoryMap[r.vehicleCategory] = (categoryMap[r.vehicleCategory] || 0) + 1;
      });

      return res.json({
        success: true,
        dailyBreakdown: Object.values(dailyMap),
        categoryShare: categoryMap,
        totalCompletedRides: completedRides.length
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async exportCsv(req, res) {
    try {
      const rides = db.rides.findMany({ orderBy: { createdAt: 'desc' } });

      let csv = 'BookingCode,VehicleCategory,Status,PickupAddress,DropAddress,DistanceKm,TotalFare,Commission,PaymentMethod,CreatedAt\n';
      rides.forEach(r => {
        const cleanPickup = (r.pickupAddress || '').replace(/"/g, '""');
        const cleanDrop = (r.dropAddress || '').replace(/"/g, '""');
        csv += `"${r.bookingCode}","${r.vehicleCategory}","${r.status}","${cleanPickup}","${cleanDrop}",${r.distanceKm},${r.totalFare},${r.platformCommission},"${r.paymentMethod}","${r.createdAt}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ridenow-rides-report.csv"');
      return res.send(csv);
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 16. Admin Users and Roles
   */
  static async getAdminUsers(req, res) {
    try {
      const adminUsers = db.users.findMany({
        where: {
          role: ['SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN']
        }
      });
      return res.json({ success: true, adminUsers });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async createAdminUser(req, res) {
    try {
      if (req.user?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden: Only Super Admin can create new administrative accounts.' });
      }

      const { fullName, email, password, role, department = 'Operations' } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Email, password and role are required.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = db.users.create({
        data: {
          fullName,
          email: email.toLowerCase().trim(),
          phone: `+919999${Math.floor(100000 + Math.random() * 900000)}`,
          passwordHash,
          role,
          status: 'ACTIVE'
        }
      });

      db.adminProfiles.create({
        data: {
          userId: user.id,
          department,
          permissions: role === 'SUPER_ADMIN' ? 'ALL' : 'MODULE_RESTRICTED'
        }
      });

      return res.json({ success: true, message: 'Admin user created successfully.', user });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 17. System Settings
   */
  static async getSystemSettings(req, res) {
    try {
      const settings = db.systemSettings.findMany();
      return res.json({ success: true, settings });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  static async updateSystemSetting(req, res) {
    try {
      const { key } = req.params;
      const { value, description } = req.body;

      const updated = db.systemSettings.update({
        where: { key },
        data: { value, description }
      });

      db.auditLogs.create({
        data: {
          action: 'UPDATE_SYSTEM_SETTING',
          targetEntity: 'SystemSetting',
          targetId: key,
          performedBy: req.user.id,
          details: `Updated ${key} to ${value}`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({ success: true, message: `Setting ${key} updated.`, setting: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 18. API Configuration
   */
  static async getApiConfiguration(req, res) {
    try {
      return res.json({
        success: true,
        configurations: {
          googleMaps: {
            status: 'CONNECTED',
            mode: 'MOCK_AND_PRODUCTION_FALLBACK',
            features: ['Geocoding', 'Directions API', 'Places Autocomplete', 'Distance Matrix']
          },
          razorpay: {
            status: 'CONNECTED',
            mode: 'TEST_MODE',
            merchantId: 'rzp_test_ridenow_india',
            upiSupported: true,
            cardsSupported: true,
            netBankingSupported: true
          },
          smsGateway: {
            status: 'ACTIVE',
            provider: 'RideNow India SMS Node',
            testOtpCode: '1234'
          }
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * 19. Audit Logs
   */
  static async getAuditLogs(req, res) {
    try {
      const logs = db.auditLogs.findMany({ orderBy: { timestamp: 'desc' }, take: 100 });
      return res.json({ success: true, auditLogs: logs });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

