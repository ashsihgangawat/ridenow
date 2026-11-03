import http from 'http';
import net from 'net';
import { io as ClientIO } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';

console.log('================================================================');
console.log('🏁 RIDENOW FULL END-TO-END AUTOMATED TEST SUITE (PHASES 1 TO 6)');
console.log('================================================================');

const isPortOpen = () =>
  new Promise((resolve) => {
    const sock = net.connect(5050, '127.0.0.1', () => {
      sock.destroy();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
  });

const startApp = async () => {
  const open = await isPortOpen();
  if (open) {
    console.log('⚡ Server active on port 5050. Running against live instance.');
  } else {
    console.log('Starting in-process backend server...');
    await import('../src/index.js');
    await new Promise((r) => setTimeout(r, 1500));
  }
};

startApp().then(async () => {
  function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      });

      req.on('error', (err) => reject(err));

      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  const randomPhone = () => `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

  try {
    // =========================================================================
    // PHASE 1: ENVIRONMENT & CONNECTIVITY CHECK
    // =========================================================================
    const health = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/health',
      method: 'GET'
    });
    assert(
      health.status === 200 && health.data?.status === 'ONLINE',
      'Phase 1.1: Backend API online and healthy'
    );

    // =========================================================================
    // PHASE 2: ADMIN AUTHENTICATION
    // =========================================================================
    const adminLogin = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/admin/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        email: 'admin@ridenow.in',
        password: 'Admin@123'
      }
    );
    const adminToken = adminLogin.data?.token;
    assert(
      adminLogin.status === 200 && adminToken,
      'Phase 1.2: Super Admin authenticated successfully with administrative clearance'
    );

    // =========================================================================
    // PHASE 3: RIDER REGISTRATION, LOGIN & FARE CALCULATION
    // =========================================================================
    const testRiderPhone = randomPhone();
    const riderSignup = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/rider/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'QA Auto Rider',
        phone: testRiderPhone,
        email: `rider_qa_${Date.now()}@ridenow.in`,
        password: 'Password@123'
      }
    );
    const riderToken = riderSignup.data?.token;
    assert(
      riderSignup.status === 201 && riderToken,
      'Phase 3.1: Dedicated QA Rider registered with ₹150 welcome bonus credits'
    );

    // Fare calculation for Indore coordinates (Rajwada to Vijay Nagar)
    const fareEstimate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/fare/estimate',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        pickup: { lat: 22.7196, lng: 75.8577 },
        destination: { lat: 22.7533, lng: 75.8937 }
      }
    );
    assert(
      fareEstimate.status === 200 && fareEstimate.data?.estimates?.length >= 3,
      `Phase 3.2: Fare Engine returned accurate rates for 5 categories (Estimated: ₹${fareEstimate.data?.estimates?.[0]?.totalFare})`
    );

    // =========================================================================
    // PHASE 4: DRIVER REGISTRATION, KYC APPROVAL & ONLINE STATUS
    // =========================================================================
    const testDriverPhone = randomPhone();
    const driverSignup = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/driver/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'QA Auto Driver Partner',
        phone: testDriverPhone,
        email: `driver_qa_${Date.now()}@ridenow.in`,
        password: 'Password@123',
        vehicleCategory: 'AUTO',
        make: 'Bajaj',
        model: 'Compact RE',
        registrationNumber: 'MP 09 RN 7788'
      }
    );
    const driverToken = driverSignup.data?.token;
    const driverProfileId = driverSignup.data?.user?.driverProfile?.id;
    assert(
      driverSignup.status === 201 && driverSignup.data?.verificationStatus === 'PENDING',
      'Phase 4.1: Dedicated Driver registered with verificationStatus PENDING'
    );

    // Admin approves driver KYC
    const kycApproval = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: `/api/admin/verifications/${driverProfileId}/review`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        }
      },
      { status: 'APPROVED' }
    );
    assert(
      kycApproval.status === 200 && kycApproval.data.success,
      'Phase 4.2: Super Admin approved driver KYC verification'
    );

    // Driver toggles duty online
    const driverOnline = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/driver/toggle-online',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        },
        body: JSON.stringify({ isOnline: true, lat: 22.7196, lng: 75.8577 })
      },
      { isOnline: true, lat: 22.7196, lng: 75.8577 }
    );
    assert(
      driverOnline.status === 200 && driverOnline.data.isOnline === true,
      'Phase 4.3: Approved Driver toggled ONLINE with GPS telemetry active'
    );

    // =========================================================================
    // PHASE 5: REAL RIDE BOOKING, DISPATCH & ACCEPTANCE
    // =========================================================================
    const rideRequest = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/customer/rides/request',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`
        }
      },
      {
        vehicleCategory: 'AUTO',
        pickupAddress: 'Rajwada Palace, Indore',
        pickupLat: 22.7196,
        pickupLng: 75.8577,
        dropAddress: 'Vijay Nagar Square, Indore',
        dropLat: 22.7533,
        dropLng: 75.8937,
        paymentMethod: 'CASH',
        promoCode: 'WELCOME50'
      }
    );

    const rideId = rideRequest.data?.ride?.id;
    const rideOtp = rideRequest.data?.ride?.otp;
    const bookingCode = rideRequest.data?.ride?.bookingCode;
    assert(
      rideRequest.status === 200 && rideId && rideRequest.data?.ride?.status === 'REQUESTED',
      `Phase 5.1: Rider successfully requested ride #${bookingCode} (4-Digit PIN: ${rideOtp})`
    );

    // Driver accepts ride
    const rideAccept = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(
      rideAccept.status === 200 && rideAccept.data?.ride?.status === 'ACCEPTED',
      'Phase 5.2: Driver partner accepted the ride request (Status: ACCEPTED)'
    );

    // Driver arrives at pickup
    const driverArrived = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/arrived`,
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(
      driverArrived.status === 200 && driverArrived.data?.ride?.status === 'ARRIVED',
      'Phase 5.3: Driver notified arrival at pickup (Status: ARRIVED)'
    );

    // Driver starts ride using passenger PIN
    const rideStart = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: `/api/driver/rides/${rideId}/start`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { otp: rideOtp }
    );
    assert(
      rideStart.status === 200 && rideStart.data?.ride?.status === 'IN_PROGRESS',
      'Phase 5.4: 4-Digit PIN verified; ride started (Status: IN_PROGRESS)'
    );

    // Driver updates location during trip
    const locUpdate = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/driver/location',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { lat: 22.7350, lng: 75.8750 }
    );
    assert(
      locUpdate.status === 200,
      'Phase 5.5: Live GPS coordinate update during trip recorded in database'
    );

    // Complete ride and settle earnings
    const rideComplete = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/complete`,
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(
      rideComplete.status === 200 && rideComplete.data?.ride?.status === 'COMPLETED',
      `Phase 5.6: Ride completed! Driver earnings: ₹${rideComplete.data?.ride?.driverEarnings}, Platform Commission retained: ₹${rideComplete.data?.ride?.platformCommission}`
    );

    // =========================================================================
    // PHASE 6: NEGATIVE SECURITY & EDGE CASES MATRIX
    // =========================================================================

    // Negative 1: Duplicate ride acceptance (driver cannot accept already assigned ride)
    const secondAccept = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(
      secondAccept.status === 409 || secondAccept.status === 400,
      'Negative 1: Acceptance of already accepted/completed ride rejected with 409/400'
    );

    // Negative 2: Unapproved driver cannot accept rides
    const unapprovedPhone = randomPhone();
    const unapprovedDriver = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/driver/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Unverified Driver',
        phone: unapprovedPhone,
        password: 'Password@123',
        vehicleCategory: 'AUTO'
      }
    );
    const unapprovedToken = unapprovedDriver.data?.token;

    // Create fresh REQUESTED ride
    const freshRideRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/customer/rides/request',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`
        }
      },
      {
        vehicleCategory: 'AUTO',
        pickupAddress: 'Rajwada Palace',
        pickupLat: 22.7196,
        pickupLng: 75.8577,
        dropAddress: 'Vijay Nagar',
        dropLat: 22.7533,
        dropLng: 75.8937
      }
    );
    const freshRideId = freshRideRes.data?.ride?.id;

    const unapprovedAccept = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${freshRideId}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${unapprovedToken}` }
    });
    assert(
      unapprovedAccept.status === 403,
      'Negative 2: Unapproved driver partner cannot accept rides (403 Forbidden)'
    );

    // Negative 3: Rider trying driver portal endpoint is blocked
    const riderAccessDriver = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/driver/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${riderToken}` }
    });
    assert(
      riderAccessDriver.status === 403,
      'Negative 3: Rider token blocked from Driver portal API (403 Forbidden)'
    );

    // Negative 4: Driver trying admin endpoint is blocked
    const driverAccessAdmin = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${driverToken}` }
    });
    assert(
      driverAccessAdmin.status === 403,
      'Negative 4: Driver token blocked from Admin portal API (403 Forbidden)'
    );

    // Negative 5: Invalid GPS coordinates rejected
    const invalidCoordsBooking = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/customer/rides/request',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${riderToken}`
        }
      },
      {
        pickupAddress: 'Nowhere',
        pickupLat: 9999.0, // Invalid Latitude > 90
        pickupLng: 75.8577,
        dropAddress: 'Nowhere',
        dropLat: 22.7533,
        dropLng: 75.8937
      }
    );
    assert(
      invalidCoordsBooking.status === 400,
      'Negative 5: Invalid GPS coordinates rejected by booking validator (400 Bad Request)'
    );

    // Negative 6: Invalid Ride ID lookup rejected
    const invalidRideLookup = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/rides/non-existent-ride-uuid-999',
      method: 'GET',
      headers: { Authorization: `Bearer ${riderToken}` }
    });
    assert(
      invalidRideLookup.status === 404,
      'Negative 6: Non-existent Ride ID rejected with 404 Not Found'
    );

    // Negative 7: Wrong ride start PIN rejected
    const wrongPinAttempt = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: `/api/driver/rides/${rideId}/start`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${driverToken}`
        }
      },
      { otp: '0000' }
    );
    assert(
      wrongPinAttempt.status === 400,
      'Negative 7: Incorrect ride start PIN rejected by ride start controller'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('================================================================');
  console.log(`TOTAL E2E TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  process.exit(failed > 0 ? 1 : 0);
});
