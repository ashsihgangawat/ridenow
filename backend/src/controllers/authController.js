import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/db.js';
import { config } from '../config/index.js';
import { OtpService } from '../services/otpService.js';
import { validatePhone } from '../validators/index.js';

export class AuthController {
  /**
   * Send SMS OTP to phone number
   */
  static async sendOtp(req, res) {
    try {
      const { phone, role = 'CUSTOMER' } = req.body;

      if (!validatePhone(phone)) {
        return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number.' });
      }

      const otp = OtpService.generateOtp(phone);

      return res.json({
        success: true,
        message: `OTP sent successfully to ${phone}. (For demo, use code: ${otp} or 1234)`,
        demoOtp: otp
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Verify OTP and Login/Register
   */
  static async verifyOtp(req, res) {
    try {
      const { phone, otp, fullName = 'RideNow User', role = 'CUSTOMER', vehicleDetails } = req.body;

      if (!validatePhone(phone) || !otp) {
        return res.status(400).json({ success: false, message: 'Phone and OTP are required.' });
      }

      const isValid = OtpService.verifyOtp(phone, otp);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please use code 1234.' });
      }

      let user = db.users.findUnique({ where: { phone } });

      if (!user) {
        // Register new user
        user = db.users.create({
          data: {
            phone,
            fullName: fullName || (role === 'DRIVER' ? 'Partner Driver' : 'Customer'),
            role: role || 'CUSTOMER',
            status: 'ACTIVE',
            preferredLang: 'en'
          }
        });

        if (user.role === 'CUSTOMER') {
          db.customerProfiles.create({
            data: {
              userId: user.id,
              walletBalance: 150.0 // Welcome bonus credits
            }
          });
        } else if (user.role === 'DRIVER') {
          const driverProf = db.driverProfiles.create({
            data: {
              userId: user.id,
              licenseNumber: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
              verificationStatus: 'PENDING',
              isOnline: false,
              rating: 5.0,
              walletBalance: 0.0
            }
          });

          // Create initial vehicle
          db.vehicles.create({
            data: {
              driverId: driverProf.id,
              category: vehicleDetails?.category || 'MINI',
              make: vehicleDetails?.make || 'Maruti Suzuki',
              model: vehicleDetails?.model || 'WagonR',
              year: 2023,
              registrationNumber: vehicleDetails?.regNumber || `DL 01 RN ${Math.floor(1000 + Math.random() * 9000)}`,
              color: 'White',
              capacity: 4
            }
          });
        }
      } else if (role === 'DRIVER') {
        // If user already existed but is logging in as Driver, ensure driverProfile exists
        let driverProf = db.driverProfiles.findFirst({ where: { userId: user.id } });
        if (!driverProf) {
          driverProf = db.driverProfiles.create({
            data: {
              userId: user.id,
              licenseNumber: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
              verificationStatus: 'PENDING',
              isOnline: false,
              rating: 5.0,
              walletBalance: 0.0
            }
          });

          db.vehicles.create({
            data: {
              driverId: driverProf.id,
              category: vehicleDetails?.category || 'AUTO',
              make: vehicleDetails?.make || 'Bajaj',
              model: vehicleDetails?.model || 'Compact RE',
              year: 2024,
              registrationNumber: vehicleDetails?.regNumber || `DL 01 RN ${Math.floor(1000 + Math.random() * 9000)}`,
              color: 'Yellow-Green',
              capacity: 3
            }
          });

          if (!user.role?.includes('ADMIN')) {
            user = db.users.update({
              where: { id: user.id },
              data: { role: 'DRIVER' }
            });
          }
        }
      }

      // Check account status
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
      }

      const tokenPortal = user.role === 'DRIVER' ? 'DRIVER' : (['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN'].includes(user.role) ? 'ADMIN' : 'RIDER');
      const token = jwt.sign(
        { userId: user.id, role: user.role, phone: user.phone, portal: tokenPortal },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const customerProfile = db.customerProfiles.findFirst({ where: { userId: user.id } });
      const driverProfile = db.driverProfiles.findFirst({ where: { userId: user.id } });
      const vehicle = driverProfile ? db.vehicles.findFirst({ where: { driverId: driverProfile.id } }) : null;

      return res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          preferredLang: user.preferredLang,
          customerProfile,
          driverProfile: driverProfile ? { ...driverProfile, vehicle } : null
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Password Login (For Super Admin, Operations Admin, Finance Admin, etc.)
   */
  static async passwordLogin(req, res) {
    return AuthController.adminLogin(req, res);
  }

  /**
   * Rider Portal Registration
   */
  static async riderSignup(req, res) {
    try {
      const { name, fullName, email, phone, password } = req.body;
      const resolvedName = fullName || name;

      if (!resolvedName || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, mobile number, and password are required.'
        });
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number.'
        });
      }

      // Check if user already exists
      const existingPhone = db.users.findUnique({ where: { phone: phone.trim() } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'This mobile number is already registered. Please login to your Rider account.'
        });
      }

      if (email) {
        const existingEmail = db.users.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'This email is already in use by another account.'
          });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = db.users.create({
        data: {
          fullName: resolvedName.trim(),
          phone: phone.trim(),
          email: email ? email.toLowerCase().trim() : undefined,
          passwordHash,
          role: 'RIDER',
          status: 'ACTIVE',
          preferredLang: 'en'
        }
      });

      const customerProfile = db.customerProfiles.create({
        data: {
          userId: user.id,
          walletBalance: 150.0 // Welcome bonus credits
        }
      });

      const session = db.sessions.create({
        data: {
          userId: user.id,
          portal: 'RIDER',
          userAgent: req.headers['user-agent'] || 'RiderApp',
          ipAddress: req.ip || '127.0.0.1',
          isActive: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: 'RIDER', portal: 'RIDER', sessionId: session.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(201).json({
        success: true,
        message: 'Rider registered successfully! Welcome to RideNow.',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          customerProfile
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Rider Portal Login
   */
  static async riderLogin(req, res) {
    try {
      const { identifier, email, phone, password } = req.body;
      const loginId = identifier || email || phone;

      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email/Phone and password are required.'
        });
      }

      const cleanId = loginId.trim();
      let user = db.users.findUnique({ where: { phone: cleanId } });
      if (!user && !cleanId.startsWith('+91')) {
        user = db.users.findUnique({ where: { phone: `+91${cleanId}` } });
      }
      if (!user && cleanId.startsWith('+91')) {
        user = db.users.findUnique({ where: { phone: cleanId.replace('+91', '') } });
      }
      if (!user) {
        user = db.users.findUnique({ where: { email: cleanId.toLowerCase() } });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Account not found.' });
      }

      // Check portal role restriction: Rider portal ONLY allows RIDER or CUSTOMER
      if (!['RIDER', 'CUSTOMER'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied: This account has the role ${user.role}. Please login through the dedicated ${user.role === 'DRIVER' ? 'Driver Partner' : 'Admin'} portal.`
        });
      }

      if (!user.passwordHash) {
        return res.status(401).json({
          success: false,
          message: 'Account has no password set. Please use demo password Admin@123 or sign up.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your rider account has been suspended by administration.' });
      }

      let customerProfile = db.customerProfiles.findFirst({ where: { userId: user.id } });
      if (!customerProfile) {
        customerProfile = db.customerProfiles.create({
          data: { userId: user.id, walletBalance: 100.0 }
        });
      }

      const session = db.sessions.create({
        data: {
          userId: user.id,
          portal: 'RIDER',
          userAgent: req.headers['user-agent'] || 'RiderApp',
          ipAddress: req.ip || '127.0.0.1',
          isActive: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role, portal: 'RIDER', sessionId: session.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        success: true,
        message: 'Rider login successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          customerProfile
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Driver Portal Registration
   */
  static async driverSignup(req, res) {
    try {
      const {
        name,
        fullName,
        email,
        phone,
        password,
        vehicleCategory = 'AUTO',
        make = 'Bajaj',
        model = 'Compact RE',
        registrationNumber
      } = req.body;
      const resolvedName = fullName || name;

      if (!resolvedName || !phone || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, mobile number, and password are required.'
        });
      }

      if (!validatePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid 10-digit mobile number.'
        });
      }

      const existingPhone = db.users.findUnique({ where: { phone: phone.trim() } });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered. Please login to your Driver account.'
        });
      }

      if (email) {
        const existingEmail = db.users.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (existingEmail) {
          return res.status(400).json({
            success: false,
            message: 'This email is already in use by another account.'
          });
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = db.users.create({
        data: {
          fullName: resolvedName.trim(),
          phone: phone.trim(),
          email: email ? email.toLowerCase().trim() : undefined,
          passwordHash,
          role: 'DRIVER',
          status: 'ACTIVE',
          preferredLang: 'en'
        }
      });

      const driverProfile = db.driverProfiles.create({
        data: {
          userId: user.id,
          licenseNumber: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
          verificationStatus: 'PENDING',
          isOnline: false,
          rating: 5.0,
          walletBalance: 0.0,
          totalTrips: 0
        }
      });

      const vehicle = db.vehicles.create({
        data: {
          driverId: driverProfile.id,
          category: vehicleCategory,
          make,
          model,
          year: 2024,
          registrationNumber: registrationNumber || `DL 01 RN ${Math.floor(1000 + Math.random() * 9000)}`,
          color: vehicleCategory === 'AUTO' ? 'Yellow-Green' : 'White',
          capacity: vehicleCategory === 'BIKE' ? 1 : vehicleCategory === 'AUTO' ? 3 : 4
        }
      });

      const session = db.sessions.create({
        data: {
          userId: user.id,
          portal: 'DRIVER',
          userAgent: req.headers['user-agent'] || 'DriverApp',
          ipAddress: req.ip || '127.0.0.1',
          isActive: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: 'DRIVER', portal: 'DRIVER', sessionId: session.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.status(201).json({
        success: true,
        message: 'Driver registration completed. Your account is pending KYC document verification.',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          driverProfile: {
            ...driverProfile,
            vehicle
          }
        },
        verificationStatus: 'PENDING'
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Driver Portal Login
   */
  static async driverLogin(req, res) {
    try {
      const { identifier, email, phone, password } = req.body;
      const loginId = identifier || email || phone;

      if (!loginId || !password) {
        return res.status(400).json({
          success: false,
          message: 'Phone/Email and password are required.'
        });
      }

      const cleanId = loginId.trim();
      let user = db.users.findUnique({ where: { phone: cleanId } });
      if (!user && !cleanId.startsWith('+91')) {
        user = db.users.findUnique({ where: { phone: `+91${cleanId}` } });
      }
      if (!user && cleanId.startsWith('+91')) {
        user = db.users.findUnique({ where: { phone: cleanId.replace('+91', '') } });
      }
      if (!user) {
        user = db.users.findUnique({ where: { email: cleanId.toLowerCase() } });
      }

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Driver account not found.' });
      }

      // Strict role validation: MUST be DRIVER
      if (user.role !== 'DRIVER') {
        return res.status(403).json({
          success: false,
          message: `Access denied: This account is registered as ${user.role}. Please use the ${user.role === 'RIDER' || user.role === 'CUSTOMER' ? 'Rider' : 'Admin'} portal.`
        });
      }

      if (!user.passwordHash) {
        return res.status(401).json({
          success: false,
          message: 'Account has no password set. Please use demo password Admin@123 or sign up.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. Password incorrect.' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Your driver account has been suspended by administration.' });
      }

      let driverProfile = db.driverProfiles.findFirst({ where: { userId: user.id } });
      if (!driverProfile) {
        driverProfile = db.driverProfiles.create({
          data: {
            userId: user.id,
            licenseNumber: `DL-${Math.floor(10000000 + Math.random() * 90000000)}`,
            verificationStatus: 'PENDING',
            isOnline: false,
            rating: 5.0,
            walletBalance: 0.0
          }
        });
      }

      const vehicle = db.vehicles.findFirst({ where: { driverId: driverProfile.id } });

      const session = db.sessions.create({
        data: {
          userId: user.id,
          portal: 'DRIVER',
          userAgent: req.headers['user-agent'] || 'DriverApp',
          ipAddress: req.ip || '127.0.0.1',
          isActive: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: 'DRIVER', portal: 'DRIVER', sessionId: session.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return res.json({
        success: true,
        message: 'Driver partner login successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          driverProfile: {
            ...driverProfile,
            vehicle
          }
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Enterprise Admin Portal Login
   */
  static async adminLogin(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const user = db.users.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!user || !user.passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      const adminRoles = ['ADMIN', 'SUPER_ADMIN', 'OPERATIONS_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN'];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not possess administrative clearance to access this portal.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({ success: false, message: 'Administrative account is suspended.' });
      }

      const session = db.sessions.create({
        data: {
          userId: user.id,
          portal: 'ADMIN',
          userAgent: req.headers['user-agent'] || 'AdminApp',
          ipAddress: req.ip || '127.0.0.1',
          isActive: true
        }
      });

      const token = jwt.sign(
        { userId: user.id, role: user.role, email: user.email, portal: 'ADMIN', sessionId: session.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const adminProfile = db.adminProfiles.findFirst({ where: { userId: user.id } });

      // Audit Log
      db.auditLogs.create({
        data: {
          action: 'ADMIN_LOGIN',
          targetEntity: 'AdminSession',
          targetId: user.id,
          performedBy: user.id,
          details: `Admin user logged in with role ${user.role}`,
          ipAddress: req.ip || '127.0.0.1'
        }
      });

      return res.json({
        success: true,
        message: 'Admin authentication successful',
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          adminProfile
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Universal / Portal Logout
   */
  static async logout(req, res) {
    try {
      if (req.sessionId) {
        try {
          db.sessions.update({
            where: { id: req.sessionId },
            data: { isActive: false, endedAt: new Date().toISOString() }
          });
        } catch (_) { }
      }
      return res.json({ success: true, message: 'Session closed and logged out successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Get Current Authenticated Profile
   */
  static async getMe(req, res) {
    try {
      const user = req.user;
      const customerProfile = db.customerProfiles.findFirst({ where: { userId: user.id } });
      const driverProfile = db.driverProfiles.findFirst({ where: { userId: user.id } });
      const vehicle = driverProfile ? db.vehicles.findFirst({ where: { driverId: driverProfile.id } }) : null;
      const adminProfile = db.adminProfiles.findFirst({ where: { userId: user.id } });

      return res.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          role: user.role,
          status: user.status,
          preferredLang: user.preferredLang,
          customerProfile,
          driverProfile: driverProfile ? { ...driverProfile, vehicle } : null,
          adminProfile
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Update Language Preference ('en' or 'hi')
   */
  static async updateLanguage(req, res) {
    try {
      const { lang } = req.body;
      if (!['en', 'hi'].includes(lang)) {
        return res.status(400).json({ success: false, message: 'Language must be en or hi.' });
      }

      db.users.update({
        where: { id: req.user.id },
        data: { preferredLang: lang }
      });

      return res.json({ success: true, message: `Language updated to ${lang}` });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

