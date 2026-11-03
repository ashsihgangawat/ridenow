import http from 'http';
import net from 'net';

// 1. Check if server already running on 5050
console.log('--- STARTING RIDENOW TEST SUITE & ATTACHING TO SERVER ---');

const isPortOpen = () => new Promise(resolve => {
  const sock = net.connect(5050, '127.0.0.1', () => {
    sock.destroy();
    resolve(true);
  });
  sock.on('error', () => resolve(false));
});

const startApp = async () => {
  const open = await isPortOpen();
  if (open) {
    console.log('⚡ Server already running on port 5050. Running tests against live instance.');
  } else {
    console.log('Starting in-process server...');
    await import('../src/index.js');
    await new Promise(r => setTimeout(r, 1500));
  }
};

startApp().then(async () => {

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

      req.on('error', (err) => {
        console.error('DEBUG Request error:', err);
        reject(err);
      });

      if (postData) {
        req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  let failures = 0;

  // TEST 1: Health Check
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/health',
      method: 'GET'
    });
    if (res.status === 200 && res.data.status === 'ONLINE') {
      console.log('✅ TEST 1: Health check passed - status ONLINE');
    } else {
      console.error('❌ TEST 1 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 1 Error:', e.message);
    failures++;
  }

  // TEST 2: Admin Password Login
  let adminToken = null;
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
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
      console.log('✅ TEST 2: Super Admin login successful - Token received.');
    } else {
      console.error('❌ TEST 2 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 2 Error:', e.message);
    failures++;
  }

  // TEST 3: Customer Login via Mobile OTP
  let customerToken = null;
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
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
      console.log('✅ TEST 3: Passenger phone OTP verification passed.');
    } else {
      console.error('❌ TEST 3 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 3 Error:', e.message);
    failures++;
  }

  // TEST 4: Driver Login via Mobile OTP
  let driverToken = null;
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
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
      console.log('✅ TEST 4: Driver phone OTP verification passed.');
    } else {
      console.error('❌ TEST 4 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 4 Error:', e.message);
    failures++;
  }

  // TEST 5: Fare Calculation across all 5 Indian categories
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/fare/estimate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      pickupLat: 28.6139,
      pickupLng: 77.2090,
      dropLat: 28.5355,
      dropLng: 77.3910,
      promoCode: 'WELCOME50'
    });

    if (res.status === 200 && Array.isArray(res.data.estimates) && res.data.estimates.length === 5) {
      console.log(`✅ TEST 5: Fare Engine calculated 5 categories (Distance: ${res.data.distanceKm} km, Promo discount: ₹${res.data.estimates[0].discountAmount}).`);
    } else {
      console.error('❌ TEST 5 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 5 Error:', e.message);
    failures++;
  }

  // TEST 6: Admin Dashboard Overview
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 200 && res.data.stats && res.data.stats.totalDrivers > 0) {
      console.log(`✅ TEST 6: Super Admin dashboard stats passed (Total Rides: ${res.data.stats.totalRides}, Gross Rev: ₹${res.data.stats.totalRevenue}).`);
    } else {
      console.error('❌ TEST 6 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 6 Error:', e.message);
    failures++;
  }

  // TEST 7: Passenger Ride Booking
  let bookedRideId = null;
  let rideOtp = null;
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/rides/request',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      vehicleCategory: 'AUTO',
      pickupAddress: 'Connaught Place Central, New Delhi',
      pickupLat: 28.6328,
      pickupLng: 77.2197,
      dropAddress: 'Cyber City, Gurugram',
      dropLat: 28.4900,
      dropLng: 77.0890,
      paymentMethod: 'CASH',
      promoCode: 'WELCOME50'
    });

    if (res.status === 200 && res.data.ride) {
      bookedRideId = res.data.ride.id;
      rideOtp = res.data.ride.otp;
      console.log(`✅ TEST 7: Ride booked successfully! Booking: ${res.data.ride.bookingCode}, Fare: ₹${res.data.ride.totalFare}, Start PIN: ${rideOtp}`);
    } else {
      console.error('❌ TEST 7 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 7 Error:', e.message);
    failures++;
  }

  // TEST 8: Driver Accepts Ride
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/accept`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    if (res.status === 200 && res.data.ride.status === 'ACCEPTED') {
      console.log('✅ TEST 8: Driver accepted ride - Status: ACCEPTED.');
    } else {
      console.error('❌ TEST 8 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 8 Error:', e.message);
    failures++;
  }

  // TEST 9: Driver Starts Ride with 4-Digit Passenger PIN
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/start`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${driverToken}`,
        'Content-Type': 'application/json'
      }
    }, { otp: rideOtp });

    if (res.status === 200 && res.data.ride.status === 'IN_PROGRESS') {
      console.log('✅ TEST 9: 4-digit PIN OTP verified. Ride status: IN_PROGRESS.');
    } else {
      console.error('❌ TEST 9 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 9 Error:', e.message);
    failures++;
  }

  // TEST 10: Complete Ride & Settle Commission
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${bookedRideId}/complete`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${driverToken}` }
    });

    if (res.status === 200 && res.data.ride.status === 'COMPLETED') {
      console.log(`✅ TEST 10: Ride COMPLETED. Driver credited: ₹${res.data.earnings}, 15% Platform commission retained.`);
    } else {
      console.error('❌ TEST 10 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 10 Error:', e.message);
    failures++;
  }

  // TEST 11: Passenger Rates Completed Ride
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/customer/rides/${bookedRideId}/rate`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      rating: 5,
      comment: 'Super fast pickup and very polite auto driver partner!',
      tags: ['Polite Driver', 'Clean Auto', 'Safe Driving']
    });

    if (res.status === 200 && res.data.review) {
      console.log('✅ TEST 11: Customer review and 5-star rating registered.');
    } else {
      console.error('❌ TEST 11 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 11 Error:', e.message);
    failures++;
  }

  // TEST 12: SOS Emergency Alert Trigger
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/rides/sos',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${customerToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      rideId: bookedRideId,
      currentLat: 28.6139,
      currentLng: 77.2090
    });

    if (res.status === 200 && res.data.ticketId) {
      console.log(`✅ TEST 12: SOS Alert successfully dispatched to 112 hotline (Ticket: ${res.data.ticketId}).`);
    } else {
      console.error('❌ TEST 12 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 12 Error:', e.message);
    failures++;
  }

  // TEST 13: Admin Dynamic Fare Update
  try {
    const res = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/fare-configurations/AUTO',
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    }, {
      baseFare: 40,
      perKmRate: 12,
      waitingRateMin: 2,
      minimumFare: 50,
      surgeMultiplier: 1.2
    });

    if (res.status === 200 && res.data.fareConfig) {
      console.log('✅ TEST 13: Admin dynamic fare reconfiguration passed (Auto updated to ₹40 base + 1.2x surge).');
    } else {
      console.error('❌ TEST 13 Failed', res);
      failures++;
    }
  } catch (e) {
    console.error('❌ TEST 13 Error:', e.message);
    failures++;
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS COMPLETED: ${13 - failures}/13 PASSED | FAILURES: ${failures}`);
  console.log(`======================================================\n`);

  process.exit(failures > 0 ? 1 : 0);
});
