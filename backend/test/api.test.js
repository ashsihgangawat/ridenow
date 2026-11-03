import http from 'http';

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING RIDENOW COMPREHENSIVE BACKEND API TESTS ---');
  let failures = 0;

  // 1. Health Check
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/health',
      method: 'GET'
    });
    if (res.status === 200 && res.data.status === 'ONLINE') {
      console.log('✅ TEST 1: Health check passed');
    } else {
      console.error('❌ TEST 1 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 1 Connection error:', e.message);
    failures++;
  }

  // 2. Admin Login
  let adminToken = null;
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'admin@ridenow.in',
      password: 'Admin@123'
    });

    if (res.status === 200 && res.data.token) {
      adminToken = res.data.token;
      console.log('✅ TEST 2: Admin login passed. Token acquired.');
    } else {
      console.error('❌ TEST 2 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 2 Error:', e.message);
    failures++;
  }

  // 3. Customer OTP Login
  let customerToken = null;
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/auth/verify-otp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      phone: '+919811122233',
      otp: '1234',
      role: 'CUSTOMER'
    });

    if (res.status === 200 && res.data.token) {
      customerToken = res.data.token;
      console.log('✅ TEST 3: Customer OTP login passed.');
    } else {
      console.error('❌ TEST 3 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 3 Error:', e.message);
    failures++;
  }

  // 4. Driver OTP Login
  let driverToken = null;
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/auth/verify-otp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      phone: '+919876543210',
      otp: '1234',
      role: 'DRIVER'
    });

    if (res.status === 200 && res.data.token) {
      driverToken = res.data.token;
      console.log('✅ TEST 4: Driver OTP login passed.');
    } else {
      console.error('❌ TEST 4 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 4 Error:', e.message);
    failures++;
  }

  // 5. Fare Estimation for all 5 categories
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/fare/estimate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      pickupLat: 28.6139,
      pickupLng: 77.2090,
      dropLat: 28.5355,
      dropLng: 77.3910
    });

    if (res.status === 200 && Array.isArray(res.data.estimates) && res.data.estimates.length === 5) {
      console.log(`✅ TEST 5: Fare estimation calculated 5 categories (Distance: ${res.data.distanceKm} km).`);
    } else {
      console.error('❌ TEST 5 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 5 Error:', e.message);
    failures++;
  }

  // 6. Admin Dashboard Overview
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 200 && res.data.stats && res.data.stats.totalDrivers > 0) {
      console.log('✅ TEST 6: Super Admin dashboard stats retrieved successfully.', res.data.stats);
    } else {
      console.error('❌ TEST 6 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 6 Error:', e.message);
    failures++;
  }

  // 7. Request Ride by Customer
  let bookedRideId = null;
  let rideOtp = null;
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: '/api/customer/rides/request',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      vehicleCategory: 'AUTO',
      pickupAddress: 'India Gate, New Delhi',
      pickupLat: 28.6129,
      pickupLng: 77.2295,
      dropAddress: 'Lotus Temple, Kalkaji, New Delhi',
      dropLat: 28.5535,
      dropLng: 77.2588,
      paymentMethod: 'CASH'
    });

    if (res.status === 200 && res.data.ride) {
      bookedRideId = res.data.ride.id;
      rideOtp = res.data.ride.otp;
      console.log(`✅ TEST 7: Ride booked successfully! BookingCode: ${res.data.ride.bookingCode}, PIN: ${rideOtp}, Fare: ₹${res.data.ride.totalFare}`);
    } else {
      console.error('❌ TEST 7 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 7 Error:', e.message);
    failures++;
  }

  // 8. Driver Accepts Ride
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/accept`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    if (res.status === 200 && res.data.ride.status === 'ACCEPTED') {
      console.log('✅ TEST 8: Driver accepted ride successfully.');
    } else {
      console.error('❌ TEST 8 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 8 Error:', e.message);
    failures++;
  }

  // 9. Driver Starts Ride with PIN OTP
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/start`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json'
      }
    }, { otp: rideOtp });

    if (res.status === 200 && res.data.ride.status === 'IN_PROGRESS') {
      console.log('✅ TEST 9: 4-digit PIN OTP verified. Ride marked IN_PROGRESS.');
    } else {
      console.error('❌ TEST 9 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 9 Error:', e.message);
    failures++;
  }

  // 10. Driver Completes Ride & Platform Commission Deduction
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/complete`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    if (res.status === 200 && res.data.ride.status === 'COMPLETED') {
      console.log(`✅ TEST 10: Ride completed. Driver earned: ₹${res.data.earnings}, Platform commission processed.`);
    } else {
      console.error('❌ TEST 10 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 10 Error:', e.message);
    failures++;
  }

  // 11. Customer Rates Ride
  try {
    const res = await makeRequest({
      hostname: 'localhost',
      port: 5050,
      path: `/api/customer/rides/${bookedRideId}/rate`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      rating: 5,
      comment: 'Very polite driver and smooth ride in Delhi traffic!',
      tags: ['Polite Driver', 'Clean Vehicle', 'Safe Driving']
    });

    if (res.status === 200 && res.data.review) {
      console.log('✅ TEST 11: Customer rated ride with 5 stars.');
    } else {
      console.error('❌ TEST 11 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 11 Error:', e.message);
    failures++;
  }

  console.log(`--- TEST RESULTS: ${11 - failures}/11 Passed. Failures: ${failures} ---`);
  process.exit(failures > 0 ? 1 : 0);
}

runTests();
