import http from 'http';
import net from 'net';

console.log('================================================================');
console.log('🧪 RIDENOW 3-PORTAL SEPARATION & ROLE-BASED ACCESS CONTROL TESTS');
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
    console.log('⚡ Server already active on port 5050. Running tests against running instance.');
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

  const randomPhone = () => `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Rider Signup → Rider Dashboard Access
    // -------------------------------------------------------------------------
    const riderPhone = randomPhone();
    const riderSignupRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/rider/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Test Rider Ananya',
        phone: riderPhone,
        email: `ananya_${Date.now()}@test.in`,
        password: 'Password@123'
      }
    );

    const riderToken = riderSignupRes.data?.token;
    assert(
      riderSignupRes.status === 201 && riderToken && riderSignupRes.data.user?.role === 'RIDER',
      'Test 1: Rider signup returns 201 Created with valid RIDER token & role',
      JSON.stringify(riderSignupRes.data)
    );

    const riderDashRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${riderToken}` }
    });
    assert(
      riderDashRes.status === 200 && riderDashRes.data.success,
      'Test 1b: Newly registered Rider accesses rider dashboard profile successfully'
    );

    // -------------------------------------------------------------------------
    // TEST 2: Rider Login → Rider Dashboard
    // -------------------------------------------------------------------------
    const riderLoginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/rider/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        identifier: riderPhone,
        password: 'Password@123'
      }
    );
    const activeRiderToken = riderLoginRes.data?.token;
    assert(
      riderLoginRes.status === 200 && activeRiderToken && riderLoginRes.data.user?.role === 'RIDER',
      'Test 2: Rider login returns 200 OK with RIDER role token',
      JSON.stringify(riderLoginRes.data)
    );

    // -------------------------------------------------------------------------
    // TEST 3: Rider tries Driver URL → BLOCKED (403 Forbidden)
    // -------------------------------------------------------------------------
    const riderDriverAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/driver/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeRiderToken}` }
    });
    assert(
      riderDriverAccessRes.status === 403,
      'Test 3: Rider attempting to access Driver API (/api/driver/profile) is blocked with 403 Forbidden',
      `Got status: ${riderDriverAccessRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Rider tries Admin URL → BLOCKED (403 Forbidden)
    // -------------------------------------------------------------------------
    const riderAdminAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeRiderToken}` }
    });
    assert(
      riderAdminAccessRes.status === 403,
      'Test 4: Rider attempting to access Admin API (/api/admin/dashboard/stats) is blocked with 403 Forbidden',
      `Got status: ${riderAdminAccessRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 5: Driver Signup → Verification Pending
    // -------------------------------------------------------------------------
    const driverPhone = randomPhone();
    const driverSignupRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/driver/signup',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        fullName: 'Test Driver Vikram Singh',
        phone: driverPhone,
        email: `vikram_${Date.now()}@test.in`,
        password: 'Password@123',
        vehicleCategory: 'AUTO',
        make: 'Bajaj',
        model: 'Compact RE',
        registrationNumber: 'DL 01 RN 9999'
      }
    );
    const driverToken = driverSignupRes.data?.token;
    assert(
      driverSignupRes.status === 201 &&
        driverSignupRes.data.user?.driverProfile?.verificationStatus === 'PENDING',
      'Test 5: Driver signup succeeds with verification status PENDING',
      JSON.stringify(driverSignupRes.data)
    );

    // -------------------------------------------------------------------------
    // TEST 6: Driver Login → Driver Dashboard
    // -------------------------------------------------------------------------
    const driverLoginRes = await makeRequest(
      {
        hostname: '127.0.0.1',
        port: 5050,
        path: '/api/auth/driver/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        identifier: driverPhone,
        password: 'Password@123'
      }
    );
    const activeDriverToken = driverLoginRes.data?.token;
    assert(
      driverLoginRes.status === 200 && activeDriverToken && driverLoginRes.data.user?.role === 'DRIVER',
      'Test 6: Driver login succeeds and returns DRIVER role token'
    );

    const driverDashRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/driver/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeDriverToken}` }
    });
    assert(
      driverDashRes.status === 200 && driverDashRes.data.success,
      'Test 6b: Driver accesses driver dashboard profile successfully'
    );

    // -------------------------------------------------------------------------
    // TEST 7: Driver tries Rider URL → BLOCKED (403 Forbidden)
    // -------------------------------------------------------------------------
    const driverRiderAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeDriverToken}` }
    });
    assert(
      driverRiderAccessRes.status === 403,
      'Test 7: Driver attempting to access Rider API (/api/customer/profile) is blocked with 403 Forbidden',
      `Got status: ${driverRiderAccessRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 8: Driver tries Admin URL → BLOCKED (403 Forbidden)
    // -------------------------------------------------------------------------
    const driverAdminAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeDriverToken}` }
    });
    assert(
      driverAdminAccessRes.status === 403,
      'Test 8: Driver attempting to access Admin API (/api/admin/dashboard/stats) is blocked with 403 Forbidden',
      `Got status: ${driverAdminAccessRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 9: Admin Login → Admin Dashboard
    // -------------------------------------------------------------------------
    const adminLoginRes = await makeRequest(
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
    const adminToken = adminLoginRes.data?.token;
    assert(
      adminLoginRes.status === 200 && adminToken && adminLoginRes.data.user?.role === 'SUPER_ADMIN',
      'Test 9: Admin login succeeds with SUPER_ADMIN role token',
      JSON.stringify(adminLoginRes.data)
    );

    const adminStatsRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/admin/dashboard/stats',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminStatsRes.status === 200 && adminStatsRes.data.success,
      'Test 9b: Admin accesses /api/admin/dashboard/stats successfully'
    );

    // -------------------------------------------------------------------------
    // TEST 10: Admin tries Rider/Driver Operations → Denied unless explicitly permitted
    // -------------------------------------------------------------------------
    const adminRiderAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminRiderAccessRes.status === 403,
      'Test 10: Admin token without RIDER portal claim is denied access to Rider operations (403 Forbidden)',
      `Got status: ${adminRiderAccessRes.status}`
    );

    const adminDriverAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/driver/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(
      adminDriverAccessRes.status === 403,
      'Test 10b: Admin token without DRIVER portal claim is denied access to Driver operations (403 Forbidden)',
      `Got status: ${adminDriverAccessRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 11: Logout from each portal works correctly
    // -------------------------------------------------------------------------
    const riderLogoutRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Authorization: `Bearer ${activeRiderToken}` }
    });
    assert(
      riderLogoutRes.status === 200 && riderLogoutRes.data.success,
      'Test 11: Rider logout succeeds and deactivates session'
    );

    const driverLogoutRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/logout',
      method: 'POST',
      headers: { Authorization: `Bearer ${activeDriverToken}` }
    });
    assert(
      driverLogoutRes.status === 200 && driverLogoutRes.data.success,
      'Test 11b: Driver logout succeeds and deactivates session'
    );

    // -------------------------------------------------------------------------
    // TEST 12: Session revocation / Expiration handling
    // -------------------------------------------------------------------------
    // Accessing protected route with the now-logged-out rider token must return 401
    const postLogoutAccessRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeRiderToken}` }
    });
    assert(
      postLogoutAccessRes.status === 401,
      'Test 12: Revoked/logged-out session token is rejected with 401 Unauthorized',
      `Got status: ${postLogoutAccessRes.status}`
    );

    // Accessing with completely invalid/malformed token
    const invalidTokenRes = await makeRequest({
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/profile',
      method: 'GET',
      headers: { Authorization: 'Bearer totally_invalid_jwt_token_12345' }
    });
    assert(
      invalidTokenRes.status === 401,
      'Test 12b: Invalid JWT token is rejected with 401 Unauthorized',
      `Got status: ${invalidTokenRes.status}`
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
});

