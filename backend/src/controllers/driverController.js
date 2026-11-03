import { db } from '../services/db.js';
import { rideSocketEvents } from '../sockets/rideSocket.js';
import { TrackingService } from '../services/trackingService.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// 7 Mandatory verification documents
export const REQUIRED_DOCUMENT_TYPES = [
  'DRIVING_LICENSE',
  'VEHICLE_RC',
  'VEHICLE_INSURANCE',
  'PUC_CERTIFICATE',
  'IDENTITY_PROOF',
  'DRIVER_SELFIE',
  'VEHICLE_PHOTO'
];

export class DriverController {
  /**
   * Helper: Get or lazily create a driver profile and vehicle for a user
   */
  static getOrCreateDriverProfile(userId, defaultDocNumber, defaultCategory = 'AUTO') {
    let driver = db.driverProfiles.findFirst({ where: { userId } });
    if (!driver) {
      driver = db.driverProfiles.create({
        data: {
          userId,
          licenseNumber: defaultDocNumber || `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
          verificationStatus: 'DOCUMENTS_PENDING',
          mobileVerified: true,
          profileCompleted: true,
          adminApproved: false,
          isOnline: false,
          rating: 5.0,
          walletBalance: 0.0
        }
      });

      // Update user role to DRIVER if not admin
      const user = db.users.findUnique({ where: { id: userId } });
      if (user && !user.role?.includes('ADMIN')) {
        db.users.update({
          where: { id: userId },
          data: { role: 'DRIVER' }
        });
      }
    }

    // Ensure vehicle exists for this driver
    let vehicle = db.vehicles.findFirst({ where: { driverId: driver.id } });
    if (!vehicle) {
      vehicle = db.vehicles.create({
        data: {
          driverId: driver.id,
          category: defaultCategory,
          make: defaultCategory === 'BIKE' ? 'Hero' : defaultCategory === 'CAR' ? 'Maruti Suzuki' : 'Bajaj',
          model: defaultCategory === 'BIKE' ? 'Splendor Plus' : defaultCategory === 'CAR' ? 'WagonR' : 'Compact RE',
          year: 2024,
          registrationNumber: `MP 09 RN ${Math.floor(1000 + Math.random() * 9000)}`,
          color: defaultCategory === 'BIKE' ? 'Black' : defaultCategory === 'CAR' ? 'White' : 'Yellow-Green',
          capacity: defaultCategory === 'BIKE' ? 1 : defaultCategory === 'CAR' ? 4 : 3
        }
      });
    }

    return { driver, vehicle };
  }

  /**
   * Driver Registration Workflow (Multi-step Onboarding)
   * Supports Bike & Car driver registration
   */
  static async registerDriver(req, res) {
    try {
      const {
        fullName,
        phone,
        email,
        dateOfBirth,
        address,
        profilePhotoUrl,
        password = 'Password@123',
        vehicleCategory = 'BIKE',
        make,
        model,
        registrationNumber,
        color,
        manufacturingYear = 2024
      } = req.body;

      if (!fullName || !phone) {
        return res.status(400).json({
          success: false,
          message: 'Full name and mobile phone number are required.'
        });
      }

      // Format & Validate Phone
      const cleanPhone = phone.trim();
      const existingUser = db.users.findUnique({ where: { phone: cleanPhone } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'This mobile number is already registered. Please login to your Driver account.'
        });
      }

      // Check duplicate vehicle registration if supplied
      if (registrationNumber) {
        const cleanReg = registrationNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const allVehicles = db.vehicles.findMany();
        const duplicateReg = allVehicles.find(v => {
          const vReg = (v.registrationNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
          return vReg && vReg === cleanReg;
        });
        if (duplicateReg) {
          return res.status(400).json({
            success: false,
            message: `Vehicle registration number '${registrationNumber}' is already registered with another driver account.`
          });
        }
      }

      // Create User
      const passwordHash = await bcrypt.hash(password, 10);
      const user = db.users.create({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: email ? email.toLowerCase().trim() : undefined,
          passwordHash,
          role: 'DRIVER',
          status: 'ACTIVE',
          profilePhotoUrl: profilePhotoUrl || null,
          preferredLang: 'en'
        }
      });

      // Create Driver Profile
      const category = ['BIKE', 'CAR', 'AUTO'].includes(vehicleCategory.toUpperCase())
        ? vehicleCategory.toUpperCase()
        : 'BIKE';

      const driver = db.driverProfiles.create({
        data: {
          userId: user.id,
          licenseNumber: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
          verificationStatus: 'DOCUMENTS_PENDING',
          mobileVerified: true,
          profileCompleted: true,
          adminApproved: false,
          dateOfBirth: dateOfBirth || '1995-01-01',
          address: address || 'Indore, Madhya Pradesh, India',
          profilePhotoUrl: profilePhotoUrl || null,
          isOnline: false,
          rating: 5.0,
          walletBalance: 0.0,
          totalTrips: 0
        }
      });

      // Create Vehicle
      const vehicle = db.vehicles.create({
        data: {
          driverId: driver.id,
          category,
          make: make || (category === 'BIKE' ? 'Hero' : category === 'CAR' ? 'Maruti Suzuki' : 'Bajaj'),
          model: model || (category === 'BIKE' ? 'Splendor Plus' : category === 'CAR' ? 'WagonR' : 'Compact RE'),
          year: parseInt(manufacturingYear, 10) || 2024,
          registrationNumber: registrationNumber ? registrationNumber.toUpperCase().trim() : `MP 09 RN ${Math.floor(1000 + Math.random() * 9000)}`,
          color: color || (category === 'BIKE' ? 'Black' : category === 'CAR' ? 'White' : 'Yellow-Green'),
          capacity: category === 'BIKE' ? 1 : category === 'CAR' ? 4 : 3,
          isActive: true
        }
      });

      // Log Audit Entry
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: driver.id,
          action: 'REGISTRATION_SUBMITTED',
          performedBy: user.id,
          previousStatus: 'NOT_SUBMITTED',
          newStatus: 'DOCUMENTS_PENDING',
          notes: `Driver registration initiated for ${fullName} (${category})`,
          timestamp: new Date().toISOString()
        }
      });

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, role: 'DRIVER', phone: user.phone },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn || '30d' }
      );

      return res.status(201).json({
        success: true,
        message: 'Driver registered successfully. Please proceed to upload required verification documents.',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status
        },
        driver: {
          ...driver,
          vehicle
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Verify Driver Mobile OTP
   */
  static async verifyOtp(req, res) {
    try {
      const { phone, otp, firebaseUid } = req.body;
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
      }

      // In free/test mode, accept '123456', '999999', or any valid 6-digit test OTP, or Firebase UID confirmation
      const isValidOtp = otp === '123456' || otp === '999999' || (otp && otp.length === 6) || firebaseUid;
      if (!isValidOtp) {
        return res.status(400).json({ success: false, message: 'Invalid OTP. For testing, use 123456.' });
      }

      const user = db.users.findUnique({ where: { phone: phone.trim() } });
      if (user) {
        const driver = db.driverProfiles.findFirst({ where: { userId: user.id } });
        if (driver) {
          db.driverProfiles.update({
            where: { id: driver.id },
            data: { mobileVerified: true }
          });
        }
      }

      return res.json({
        success: true,
        message: 'Mobile number successfully verified.',
        firebaseUid: firebaseUid || `mock-uid-${Date.now()}`
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Comprehensive Driver Verification Status
   * Returns verification status of all 7 mandatory documents
   */
  static async getVerificationStatus(req, res) {
    try {
      const { driver, vehicle } = DriverController.getOrCreateDriverProfile(req.user.id);
      const docs = db.driverDocuments.findMany({ where: { driverId: driver.id } });

      const todayStr = new Date().toISOString().slice(0, 10);

      // Build status for each of the 7 required documents
      const documentStatusList = REQUIRED_DOCUMENT_TYPES.map(docType => {
        const found = docs.find(d => d.documentType === docType);
        if (!found) {
          return {
            documentType: docType,
            status: 'NOT_UPLOADED',
            documentNumber: null,
            fileUrl: null,
            expiryDate: null,
            isExpired: false,
            rejectionReason: null,
            uploadedAt: null
          };
        }

        const isExpired = found.expiryDate ? found.expiryDate < todayStr : false;
        const effectiveStatus = isExpired ? 'EXPIRED' : found.status || 'PENDING';

        return {
          documentType: docType,
          status: effectiveStatus,
          documentNumber: found.documentNumber,
          fileUrl: found.fileUrl,
          fileName: found.fileName,
          fileSize: found.fileSize,
          expiryDate: found.expiryDate,
          isExpired,
          rejectionReason: found.rejectionReason || found.rejectionNote || null,
          uploadedAt: found.createdAt || found.uploadedAt
        };
      });

      const uploadedCount = documentStatusList.filter(d => d.status !== 'NOT_UPLOADED').length;
      const approvedCount = documentStatusList.filter(d => d.status === 'APPROVED').length;
      const rejectedCount = documentStatusList.filter(d => d.status === 'REJECTED').length;
      const expiredCount = documentStatusList.filter(d => d.isExpired).length;

      // Determine overall status
      let overallStatus = driver.verificationStatus || 'DOCUMENTS_PENDING';
      if (overallStatus !== 'SUSPENDED') {
        if (uploadedCount === 0) {
          overallStatus = 'NOT_SUBMITTED';
        } else if (uploadedCount < REQUIRED_DOCUMENT_TYPES.length) {
          overallStatus = 'DOCUMENTS_PENDING';
        } else if (rejectedCount > 0) {
          overallStatus = 'CORRECTION_REQUIRED';
        } else if (expiredCount > 0) {
          overallStatus = 'CORRECTION_REQUIRED';
        } else if (approvedCount === REQUIRED_DOCUMENT_TYPES.length && driver.adminApproved) {
          overallStatus = 'APPROVED';
        } else if (overallStatus !== 'REJECTED') {
          overallStatus = 'UNDER_REVIEW';
        }
      }

      // Sync status if changed
      if (driver.verificationStatus !== overallStatus) {
        db.driverProfiles.update({
          where: { id: driver.id },
          data: { verificationStatus: overallStatus }
        });
      }

      const auditLogs = db.auditLogs.findMany({
        where: { entityType: 'DRIVER', entityId: driver.id },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      return res.json({
        success: true,
        verificationStatus: overallStatus,
        driverId: driver.id,
        isOnline: driver.isOnline,
        mobileVerified: driver.mobileVerified !== false,
        profileCompleted: driver.profileCompleted !== false,
        adminApproved: driver.adminApproved === true,
        vehicle,
        documents: documentStatusList,
        stats: {
          totalRequired: REQUIRED_DOCUMENT_TYPES.length,
          uploadedCount,
          approvedCount,
          rejectedCount,
          expiredCount,
          completionPercentage: Math.round((uploadedCount / REQUIRED_DOCUMENT_TYPES.length) * 100)
        },
        auditLogs
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Upload Driver KYC / Verification Document (with file format & expiry validation)
   */
  static async uploadKycDocument(req, res) {
    try {
      const {
        documentType,
        documentNumber,
        fileUrl,
        fileName = 'document.jpg',
        fileSize = 1024000,
        fileType = 'image/jpeg',
        expiryDate
      } = req.body;

      if (!documentType || !fileUrl) {
        return res.status(400).json({
          success: false,
          message: 'Document type and file payload/URL are required.'
        });
      }

      if (!REQUIRED_DOCUMENT_TYPES.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid documentType. Must be one of: ${REQUIRED_DOCUMENT_TYPES.join(', ')}`
        });
      }

      // Validate File Size (max 5MB)
      if (fileSize > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds maximum allowed limit of 5MB.'
        });
      }

      // Validate File Format (PDF, JPG, PNG)
      const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
      const isAllowedFormat = allowedExtensions.includes(ext) ||
        fileType.includes('pdf') ||
        fileType.includes('jpeg') ||
        fileType.includes('jpg') ||
        fileType.includes('png');

      if (!isAllowedFormat) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Only PDF, JPG, and PNG documents are accepted.'
        });
      }

      // Validate Expiry Date if provided
      if (expiryDate) {
        const todayStr = new Date().toISOString().slice(0, 10);
        if (expiryDate < todayStr) {
          return res.status(400).json({
            success: false,
            message: `Document has already expired on ${expiryDate}. Please upload a valid document.`
          });
        }
      }

      const { driver } = DriverController.getOrCreateDriverProfile(req.user.id, documentNumber);

      // Check existing document
      const existing = db.driverDocuments.findFirst({
        where: { driverId: driver.id, documentType }
      });

      let doc;
      if (existing) {
        doc = db.driverDocuments.update({
          where: { id: existing.id },
          data: {
            fileUrl,
            fileName,
            fileSize,
            fileType,
            documentNumber: documentNumber || existing.documentNumber,
            expiryDate: expiryDate || existing.expiryDate || null,
            status: 'PENDING',
            rejectionReason: null,
            rejectionNote: null,
            reviewedAt: null,
            reviewedBy: null,
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        doc = db.driverDocuments.create({
          data: {
            driverId: driver.id,
            documentType,
            documentNumber: documentNumber || `DOC-${Date.now().toString(36)}`,
            fileUrl,
            fileName,
            fileSize,
            fileType,
            expiryDate: expiryDate || null,
            status: 'PENDING',
            rejectionReason: null,
            uploadedAt: new Date().toISOString()
          }
        });
      }

      // Check all documents for driver
      const allDocs = db.driverDocuments.findMany({ where: { driverId: driver.id } });
      const uploadedTypes = new Set(allDocs.map(d => d.documentType));
      const hasAllRequired = REQUIRED_DOCUMENT_TYPES.every(type => uploadedTypes.has(type));

      let nextStatus = hasAllRequired ? 'UNDER_REVIEW' : 'DOCUMENTS_PENDING';
      const anyRejected = allDocs.some(d => d.status === 'REJECTED');
      if (anyRejected && !hasAllRequired) {
        nextStatus = 'CORRECTION_REQUIRED';
      }

      db.driverProfiles.update({
        where: { id: driver.id },
        data: { verificationStatus: nextStatus }
      });

      // Audit Log
      db.auditLogs.create({
        data: {
          entityType: 'DRIVER',
          entityId: driver.id,
          action: 'DOCUMENT_UPLOADED',
          performedBy: req.user.id,
          previousStatus: driver.verificationStatus,
          newStatus: nextStatus,
          notes: `${documentType} uploaded (${fileName}, ${(fileSize / 1024).toFixed(1)} KB)`,
          timestamp: new Date().toISOString()
        }
      });

      return res.json({
        success: true,
        message: `${documentType} uploaded successfully. ${hasAllRequired ? 'All documents submitted. Under review by Compliance Team.' : 'Document saved. Upload remaining documents.'}`,
        document: doc,
        overallStatus: nextStatus
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Driver Dashboard Profile
   */
  static async getProfile(req, res) {
    try {
      const { driver, vehicle } = DriverController.getOrCreateDriverProfile(req.user.id);
      const documents = db.driverDocuments.findMany({ where: { driverId: driver.id } });
      const activeRide = db.rides.findMany({ where: { driverId: driver.id } })
        .find(r => ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)) || null;

      return res.json({
        success: true,
        driver: {
          ...req.user,
          ...driver,
          vehicle,
          documents,
          activeRide
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update Driver Profile & Vehicle Details
   */
  static async updateProfile(req, res) {
    try {
      const {
        fullName,
        phone,
        email,
        dateOfBirth,
        address,
        profilePhotoUrl,
        make,
        model,
        registrationNumber,
        color,
        category,
        manufacturingYear
      } = req.body;

      const { driver, vehicle } = DriverController.getOrCreateDriverProfile(req.user.id);

      // Update User Info
      if (fullName || phone || email || profilePhotoUrl) {
        db.users.update({
          where: { id: req.user.id },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(email && { email }),
            ...(profilePhotoUrl && { profilePhotoUrl })
          }
        });
      }

      // Update Driver Profile
      if (dateOfBirth || address || profilePhotoUrl) {
        db.driverProfiles.update({
          where: { id: driver.id },
          data: {
            ...(dateOfBirth && { dateOfBirth }),
            ...(address && { address }),
            ...(profilePhotoUrl && { profilePhotoUrl })
          }
        });
      }

      // Update Vehicle Info
      let updatedVehicle = vehicle;
      if (vehicle && (make || model || registrationNumber || color || category || manufacturingYear)) {
        updatedVehicle = db.vehicles.update({
          where: { id: vehicle.id },
          data: {
            ...(make && { make }),
            ...(model && { model }),
            ...(registrationNumber && { registrationNumber: registrationNumber.toUpperCase().trim() }),
            ...(color && { color }),
            ...(category && { category: category.toUpperCase() }),
            ...(manufacturingYear && { year: parseInt(manufacturingYear, 10) })
          }
        });
      }

      const refreshedUser = db.users.findUnique({ where: { id: req.user.id } });
      const refreshedDriver = db.driverProfiles.findUnique({ where: { id: driver.id } });

      return res.json({
        success: true,
        message: 'Driver profile updated successfully.',
        driver: {
          ...refreshedUser,
          ...refreshedDriver,
          vehicle: updatedVehicle
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Toggle Online / Offline Availability (Strict Enforcement!)
   * Drivers cannot go online unless status is APPROVED and no documents are expired.
   */
  static async toggleAvailability(req, res) {
    try {
      const driver = db.driverProfiles.findFirst({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      // 1. Strict Verification Check
      if (driver.verificationStatus !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          code: 'VERIFICATION_REQUIRED',
          message: 'Cannot go online. Your driver account is not approved yet. Verification status: ' + driver.verificationStatus,
          verificationStatus: driver.verificationStatus
        });
      }

      // 2. Document Expiry Check (DL, RC, Insurance)
      const docs = db.driverDocuments.findMany({ where: { driverId: driver.id } });
      const todayStr = new Date().toISOString().slice(0, 10);
      const expiredDocs = docs.filter(d => d.expiryDate && d.expiryDate < todayStr);
      if (expiredDocs.length > 0) {
        const expiredNames = expiredDocs.map(d => d.documentType).join(', ');
        return res.status(403).json({
          success: false,
          code: 'DOCUMENTS_EXPIRED',
          message: `Cannot go online. The following documents have expired: ${expiredNames}. Please upload renewed documents.`,
          expiredDocuments: expiredDocs
        });
      }

      const { isOnline, lat, lng } = req.body;
      const targetState = isOnline !== undefined ? Boolean(isOnline) : !driver.isOnline;

      const updated = db.driverProfiles.update({
        where: { id: driver.id },
        data: {
          isOnline: targetState,
          ...(lat && lng && { lastLatitude: lat, lastLongitude: lng, lastLocationUpdate: new Date().toISOString() })
        }
      });

      if (lat && lng) {
        TrackingService.updateDriverLocation(driver.id, lat, lng);
      }

      return res.json({
        success: true,
        isOnline: updated.isOnline,
        message: updated.isOnline ? 'You are now ONLINE. You can accept passenger rides.' : 'You are now OFFLINE.'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update Driver Live Location
   */
  static async updateLocation(req, res) {
    try {
      const { latitude, longitude, heading = 0 } = req.body;
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ success: false, message: 'latitude and longitude are required.' });
      }

      const driver = db.driverProfiles.findFirst({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      db.driverProfiles.update({
        where: { id: driver.id },
        data: {
          lastLatitude: latitude,
          lastLongitude: longitude,
          heading,
          lastLocationUpdate: new Date().toISOString()
        }
      });

      TrackingService.updateDriverLocation(driver.id, latitude, longitude);

      return res.json({ success: true, message: 'Location updated' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Nearby Pending Ride Requests
   */
  static async getNearbyRequests(req, res) {
    try {
      const driver = db.driverProfiles.findFirst({ where: { userId: req.user.id } });
      if (!driver || !driver.isOnline) {
        return res.json({ success: true, requests: [] });
      }

      const pendingRides = db.rides.findMany({
        where: { status: 'REQUESTED' }
      });

      return res.json({
        success: true,
        requests: pendingRides
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Accept Ride Request
   */
  static async acceptRide(req, res) {
    try {
      const { rideId } = req.params;
      const driver = db.driverProfiles.findFirst({ where: { userId: req.user.id } });
      if (!driver) {
        return res.status(404).json({ success: false, message: 'Driver profile not found.' });
      }

      if (driver.verificationStatus !== 'APPROVED') {
        return res.status(403).json({
          success: false,
          message: 'Cannot accept rides. Driver account pending verification.'
        });
      }

      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride request not found.' });
      }

      if (ride.status !== 'REQUESTED') {
        return res.status(400).json({ success: false, message: 'Ride has already been accepted or cancelled.' });
      }

      const updatedRide = db.rides.update({
        where: { id: rideId },
        data: {
          driverId: driver.id,
          status: 'ACCEPTED',
          acceptedAt: new Date().toISOString()
        }
      });

      rideSocketEvents.emitRideStatusUpdated(updatedRide);

      return res.json({
        success: true,
        message: 'Ride accepted successfully.',
        ride: updatedRide
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Driver Arrived at Pickup
   */
  static async arrivedAtPickup(req, res) {
    try {
      const { rideId } = req.params;
      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      const updated = db.rides.update({
        where: { id: rideId },
        data: {
          status: 'ARRIVED',
          arrivedAt: new Date().toISOString()
        }
      });

      rideSocketEvents.emitRideStatusUpdated(updated);
      return res.json({ success: true, ride: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Start Ride
   */
  static async startRide(req, res) {
    try {
      const { rideId } = req.params;
      const { otp } = req.body;
      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      if (ride.otp && otp && ride.otp !== otp) {
        return res.status(400).json({ success: false, message: 'Invalid start ride OTP entered.' });
      }

      const updated = db.rides.update({
        where: { id: rideId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date().toISOString()
        }
      });

      rideSocketEvents.emitRideStatusUpdated(updated);
      return res.json({ success: true, ride: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Complete Ride
   */
  static async completeRide(req, res) {
    try {
      const { rideId } = req.params;
      const ride = db.rides.findUnique({ where: { id: rideId } });
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found.' });
      }

      const updated = db.rides.update({
        where: { id: rideId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        }
      });

      // Credit earnings to driver wallet
      const driver = db.driverProfiles.findUnique({ where: { id: ride.driverId } });
      if (driver) {
        db.driverProfiles.update({
          where: { id: driver.id },
          data: {
            walletBalance: (driver.walletBalance || 0) + (ride.driverEarnings || (ride.fare * 0.85)),
            totalTrips: (driver.totalTrips || 0) + 1
          }
        });
      }

      rideSocketEvents.emitRideStatusUpdated(updated);
      return res.json({ success: true, ride: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Driver Earnings Summary
   */
  static async getEarnings(req, res) {
    try {
      const { driver } = DriverController.getOrCreateDriverProfile(req.user.id);
      const completedRides = db.rides.findMany({
        where: {
          driverId: driver.id,
          status: 'COMPLETED'
        },
        orderBy: { completedAt: 'desc' }
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayRides = completedRides.filter(r => r.completedAt?.startsWith(todayStr));

      const todayEarnings = todayRides.reduce((sum, r) => sum + (r.driverEarnings || (r.fare * 0.85)), 0);
      const totalEarnings = completedRides.reduce((sum, r) => sum + (r.driverEarnings || (r.fare * 0.85)), 0);

      return res.json({
        success: true,
        summary: {
          todayEarnings: Math.round(todayEarnings * 100) / 100,
          todayTrips: todayRides.length,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalTrips: completedRides.length,
          walletBalance: Math.round((driver.walletBalance || 0) * 100) / 100,
          recentRides: completedRides.slice(0, 10)
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
