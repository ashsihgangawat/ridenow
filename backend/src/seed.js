import bcrypt from 'bcryptjs';
import { db } from './services/db.js';

export async function seedDatabase() {
  console.log('[Seed] Seeding RideNow Indian Mobility Platform dataset...');

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Super Admin
  const adminUser = db.users.findUnique({ where: { email: 'admin@ridenow.in' } }) || db.users.create({
    data: {
      email: 'admin@ridenow.in',
      phone: '+919999000001',
      fullName: 'Vikrant Roy (Super Admin)',
      passwordHash,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      preferredLang: 'en'
    }
  });

  db.adminProfiles.findFirst({ where: { userId: adminUser.id } }) || db.adminProfiles.create({
    data: {
      userId: adminUser.id,
      department: 'Executive Operations',
      permissions: 'ALL'
    }
  });

  // 2. Operations Admin
  const opsUser = db.users.findUnique({ where: { email: 'ops@ridenow.in' } }) || db.users.create({
    data: {
      email: 'ops@ridenow.in',
      phone: '+919999000002',
      fullName: 'Pooja Nair (Operations Lead)',
      passwordHash,
      role: 'OPERATIONS_ADMIN',
      status: 'ACTIVE',
      preferredLang: 'en'
    }
  });

  db.adminProfiles.findFirst({ where: { userId: opsUser.id } }) || db.adminProfiles.create({
    data: {
      userId: opsUser.id,
      department: 'Fleet & Driver Ops',
      permissions: 'OPERATIONS_MODULES'
    }
  });

  // 3. Customers / Riders
  let cust1 = db.users.findUnique({ where: { phone: '+919811122233' } });
  if (cust1) {
    cust1 = db.users.update({ where: { id: cust1.id }, data: { role: 'RIDER', passwordHash } });
  } else {
    cust1 = db.users.create({
      data: {
        email: 'rahul.verma@gmail.com',
        phone: '+919811122233',
        fullName: 'Rahul Verma',
        passwordHash,
        role: 'RIDER',
        status: 'ACTIVE',
        preferredLang: 'en'
      }
    });
  }

  const cust1Prof = db.customerProfiles.findFirst({ where: { userId: cust1.id } }) || db.customerProfiles.create({
    data: {
      userId: cust1.id,
      homeAddress: 'Sector 62, Noida, Uttar Pradesh',
      workAddress: 'Cyber City, DLF Phase 2, Gurugram',
      walletBalance: 340.0,
      emergencyPhone: '+919811199999'
    }
  });

  let cust2 = db.users.findUnique({ where: { phone: '+919811122244' } });
  if (cust2) {
    cust2 = db.users.update({ where: { id: cust2.id }, data: { role: 'RIDER', passwordHash } });
  } else {
    cust2 = db.users.create({
      data: {
        email: 'ananya.sen@gmail.com',
        phone: '+919811122244',
        fullName: 'Ananya Sen',
        passwordHash,
        role: 'RIDER',
        status: 'ACTIVE',
        preferredLang: 'en'
      }
    });
  }

  db.customerProfiles.findFirst({ where: { userId: cust2.id } }) || db.customerProfiles.create({
    data: {
      userId: cust2.id,
      homeAddress: 'Indiranagar 100ft Road, Bengaluru, Karnataka',
      workAddress: 'Manyata Tech Park, Nagavara, Bengaluru',
      walletBalance: 520.0,
      emergencyPhone: '+919811188888'
    }
  });

  // Demo Mobile Rider (9893011223 / Rider@123)
  const riderDemoHash = await bcrypt.hash('Rider@123', 10);
  let demoRider = db.users.findUnique({ where: { phone: '+919893011223' } }) || db.users.findUnique({ where: { phone: '9893011223' } });
  if (demoRider) {
    demoRider = db.users.update({ where: { id: demoRider.id }, data: { role: 'RIDER', passwordHash: riderDemoHash } });
  } else {
    demoRider = db.users.create({
      data: {
        email: 'demo.rider@ridenow.in',
        phone: '+919893011223',
        fullName: 'Demo Rider',
        passwordHash: riderDemoHash,
        role: 'RIDER',
        status: 'ACTIVE',
        preferredLang: 'en'
      }
    });
  }

  db.customerProfiles.findFirst({ where: { userId: demoRider.id } }) || db.customerProfiles.create({
    data: {
      userId: demoRider.id,
      homeAddress: 'Vijay Nagar, Indore, Madhya Pradesh',
      workAddress: 'Palasia, Indore, Madhya Pradesh',
      walletBalance: 750.0,
      emergencyPhone: '+919893099999'
    }
  });

  // Demo Mobile Driver (9876543210 / Driver@123)
  const driverDemoHash = await bcrypt.hash('Driver@123', 10);

  // 4. Drivers
  // Driver 1: Auto (Approved & Online - Demo 9876543210 / Driver@123)
  let d1User = db.users.findUnique({ where: { phone: '+919876543210' } }) || db.users.findUnique({ where: { phone: '9876543210' } });
  if (d1User) {
    d1User = db.users.update({ where: { id: d1User.id }, data: { role: 'DRIVER', passwordHash: driverDemoHash } });
  } else {
    d1User = db.users.create({
      data: {
        email: 'rajesh.kumar@driver.ridenow.in',
        phone: '+919876543210',
        fullName: 'Rajesh Kumar (Auto Partner)',
        passwordHash: driverDemoHash,
        role: 'DRIVER',
        status: 'ACTIVE'
      }
    });
  }

  const d1Prof = db.driverProfiles.findFirst({ where: { userId: d1User.id } }) || db.driverProfiles.create({
    data: {
      userId: d1User.id,
      licenseNumber: 'DL-042018002931',
      verificationStatus: 'APPROVED',
      isOnline: true,
      currentLat: 28.6139,
      currentLng: 77.2090,
      rating: 4.9,
      totalRatings: 182,
      totalTrips: 240,
      walletBalance: 1850.0
    }
  });

  db.vehicles.findFirst({ where: { driverId: d1Prof.id } }) || db.vehicles.create({
    data: {
      driverId: d1Prof.id,
      category: 'AUTO',
      make: 'Bajaj',
      model: 'RE Compact CNG',
      year: 2022,
      registrationNumber: 'DL 1R 8842',
      color: 'Green & Yellow',
      capacity: 3
    }
  });

  // Driver 2: Sedan (Approved & Online)
  const d2User = db.users.findUnique({ where: { phone: '+919876543211' } }) || db.users.create({
    data: {
      email: 'amit.sharma@driver.ridenow.in',
      phone: '+919876543211',
      fullName: 'Amit Sharma (Sedan Premier)',
      passwordHash,
      role: 'DRIVER',
      status: 'ACTIVE'
    }
  });

  const d2Prof = db.driverProfiles.findFirst({ where: { userId: d2User.id } }) || db.driverProfiles.create({
    data: {
      userId: d2User.id,
      licenseNumber: 'HR-262019001188',
      verificationStatus: 'APPROVED',
      isOnline: true,
      currentLat: 28.5355,
      currentLng: 77.3910,
      rating: 4.85,
      totalRatings: 312,
      totalTrips: 450,
      walletBalance: 4200.0
    }
  });

  db.vehicles.findFirst({ where: { driverId: d2Prof.id } }) || db.vehicles.create({
    data: {
      driverId: d2Prof.id,
      category: 'SEDAN',
      make: 'Maruti Suzuki',
      model: 'Dzire VXi Prime',
      year: 2023,
      registrationNumber: 'HR 26 DQ 4920',
      color: 'Silver Metallic',
      capacity: 4
    }
  });

  // Driver 3: Bike (Pending Verification)
  const d3User = db.users.findUnique({ where: { phone: '+919876543213' } }) || db.users.create({
    data: {
      email: 'suresh.verma@driver.ridenow.in',
      phone: '+919876543213',
      fullName: 'Suresh Verma (Moto)',
      passwordHash,
      role: 'DRIVER',
      status: 'ACTIVE'
    }
  });

  const d3Prof = db.driverProfiles.findFirst({ where: { userId: d3User.id } }) || db.driverProfiles.create({
    data: {
      userId: d3User.id,
      licenseNumber: 'UP-162021009944',
      verificationStatus: 'PENDING',
      isOnline: false,
      currentLat: 28.5700,
      currentLng: 77.3200,
      rating: 5.0,
      totalRatings: 0,
      totalTrips: 0,
      walletBalance: 0.0
    }
  });

  db.vehicles.findFirst({ where: { driverId: d3Prof.id } }) || db.vehicles.create({
    data: {
      driverId: d3Prof.id,
      category: 'BIKE',
      make: 'Hero',
      model: 'Splendor Plus',
      year: 2024,
      registrationNumber: 'UP 16 CG 9012',
      color: 'Black & Red',
      capacity: 1
    }
  });

  db.driverDocuments.findFirst({ where: { driverId: d3Prof.id } }) || db.driverDocuments.create({
    data: {
      driverId: d3Prof.id,
      documentType: 'DRIVING_LICENSE',
      documentNumber: 'UP-162021009944',
      fileUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
      status: 'PENDING'
    }
  });

  // Driver 4: SUV (Approved)
  const d4User = db.users.findUnique({ where: { phone: '+919876543212' } }) || db.users.create({
    data: {
      email: 'vikram.malhotra@driver.ridenow.in',
      phone: '+919876543212',
      fullName: 'Vikram Malhotra (XL SUV)',
      passwordHash,
      role: 'DRIVER',
      status: 'ACTIVE'
    }
  });

  const d4Prof = db.driverProfiles.findFirst({ where: { userId: d4User.id } }) || db.driverProfiles.create({
    data: {
      userId: d4User.id,
      licenseNumber: 'DL-012015003344',
      verificationStatus: 'APPROVED',
      isOnline: true,
      currentLat: 28.4595,
      currentLng: 77.0266,
      rating: 4.95,
      totalRatings: 420,
      totalTrips: 590,
      walletBalance: 5120.0
    }
  });

  db.vehicles.findFirst({ where: { driverId: d4Prof.id } }) || db.vehicles.create({
    data: {
      driverId: d4Prof.id,
      category: 'SUV',
      make: 'Maruti Suzuki',
      model: 'Ertiga ZXi Hybrid',
      year: 2023,
      registrationNumber: 'DL 01 BA 5021',
      color: 'Pearl White',
      capacity: 6
    }
  });

  // 5. Seed Completed & Active Rides
  const existingRides = db.rides.findMany();
  if (existingRides.length === 0) {
    // Ride 1: Completed Sedan
    db.rides.create({
      data: {
        bookingCode: 'RN-9182',
        customerId: cust1Prof.id,
        driverId: d2Prof.id,
        vehicleCategory: 'SEDAN',
        status: 'COMPLETED',
        otp: '4921',
        pickupAddress: 'Indira Gandhi International Airport, Terminal 3, New Delhi',
        pickupLat: 28.5562,
        pickupLng: 77.1000,
        dropAddress: 'Cyber City, Building 10, DLF Phase 2, Gurugram',
        dropLat: 28.4900,
        dropLng: 77.0890,
        distanceKm: 14.2,
        durationMinutes: 32,
        baseFare: 75.0,
        distanceFare: 255.6,
        waitingCharges: 12.0,
        surgeMultiplier: 1.0,
        discountAmount: 50.0,
        totalFare: 292.6,
        platformCommission: 43.89,
        driverEarnings: 248.71,
        paymentMethod: 'ONLINE',
        paymentStatus: 'SUCCESS',
        startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
      }
    });

    // Ride 2: Completed Auto
    db.rides.create({
      data: {
        bookingCode: 'RN-4412',
        customerId: cust1Prof.id,
        driverId: d1Prof.id,
        vehicleCategory: 'AUTO',
        status: 'COMPLETED',
        otp: '8812',
        pickupAddress: 'Connaught Place Inner Circle, Block B, New Delhi',
        pickupLat: 28.6328,
        pickupLng: 77.2197,
        dropAddress: 'Lajpat Nagar Central Market, New Delhi',
        dropLat: 28.5677,
        dropLng: 77.2433,
        distanceKm: 7.8,
        durationMinutes: 24,
        baseFare: 35.0,
        distanceFare: 85.8,
        waitingCharges: 5.4,
        surgeMultiplier: 1.0,
        discountAmount: 0.0,
        totalFare: 126.2,
        platformCommission: 18.93,
        driverEarnings: 107.27,
        paymentMethod: 'CASH',
        paymentStatus: 'SUCCESS',
        startedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        completedAt: new Date(Date.now() - 3600000 * 4.5).toISOString()
      }
    });

    // Ride 3: Ongoing In Progress SUV
    db.rides.create({
      data: {
        bookingCode: 'RN-7729',
        customerId: cust1Prof.id,
        driverId: d4Prof.id,
        vehicleCategory: 'SUV',
        status: 'IN_PROGRESS',
        otp: '3310',
        pickupAddress: 'Noida City Centre Metro Station, Sector 39, Noida',
        pickupLat: 28.5747,
        pickupLng: 77.3560,
        dropAddress: 'Aerocity Hospitality District, New Delhi',
        dropLat: 28.5495,
        dropLng: 77.1215,
        distanceKm: 28.4,
        durationMinutes: 52,
        baseFare: 110.0,
        distanceFare: 653.2,
        waitingCharges: 18.0,
        surgeMultiplier: 1.0,
        discountAmount: 75.0,
        totalFare: 706.2,
        platformCommission: 105.93,
        driverEarnings: 600.27,
        paymentMethod: 'ONLINE',
        paymentStatus: 'PENDING',
        startedAt: new Date(Date.now() - 900000).toISOString()
      }
    });

    // Sample complaints
    db.complaints.create({
      data: {
        ticketId: 'TKT-1082',
        userId: cust1.id,
        category: 'Driver Behavior',
        subject: 'AC was not turned on during afternoon trip',
        description: 'Driver insisted on keeping windows rolled down despite 42C Delhi weather. Asked for refund of AC comfort fee.',
        status: 'RESOLVED',
        resolution: 'Apologized to customer and credited ₹50 wallet compensation.',
        resolvedBy: 'Vikrant Roy (Super Admin)'
      }
    });

    // Sample Audit logs
    db.auditLogs.create({
      data: {
        action: 'SYSTEM_BOOTSTRAP',
        targetEntity: 'System',
        targetId: 'RIDENOW-INDIA',
        performedBy: adminUser.id,
        details: 'Initial RideNow production mobility platform database seeded with Delhi NCR & Bengaluru fleet',
        ipAddress: '127.0.0.1'
      }
    });
  }

  console.log('[Seed] Database successfully populated!');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}

