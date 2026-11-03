import http from 'http';
import net from 'net';
import assert from 'assert';

console.log('================================================================');
console.log('💬 RIDENOW RIDER & DRIVER CHAT & CONTACT TEST SUITE');
console.log('================================================================');

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

const randomPhone = () => `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

async function runChatTests() {
  let passed = 0;
  function pass(testName) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  }

  // 1. Super Admin Login
  const adminRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { email: 'admin@ridenow.in', password: 'Admin@123' }
  );
  assert.strictEqual(adminRes.status, 200);
  const adminToken = adminRes.data.token;
  pass('Step 1: Super Admin login OK');

  // 2. Register Dedicated Test Rider
  const riderPhone = randomPhone();
  const riderSignup = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/rider/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Aarav Sharma QA',
      phone: riderPhone,
      email: `rider_${Date.now()}@test.in`,
      password: 'Password@123'
    }
  );
  assert.strictEqual(riderSignup.status, 201);
  const riderToken = riderSignup.data.token;
  const riderId = riderSignup.data.user.id;
  pass(`Step 2: Rider registered & authenticated (${riderPhone})`);

  // 3. Register Dedicated Test Driver & Approve
  const driverPhone = randomPhone();
  const driverSignup = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/driver/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Vikram Singh QA Driver',
      phone: driverPhone,
      email: `driver_${Date.now()}@test.in`,
      password: 'Password@123',
      vehicleCategory: 'AUTO',
      vehicleMake: 'Bajaj',
      vehicleModel: 'Compact RE',
      vehicleNumber: 'MP-09-RN-4401',
      licenseNumber: 'MP-09-2022-004401'
    }
  );
  assert.strictEqual(driverSignup.status, 201);
  const driverToken = driverSignup.data.token;

  // Driver Profile
  const driverProf = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: '/api/driver/profile',
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  const driverId = driverProf.data.driver.id;

  // Super Admin Approves Driver
  const approveRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/admin/drivers/${driverId}/approve`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    },
    { status: 'APPROVED' }
  );
  assert.strictEqual(approveRes.status, 200);

  // Driver Goes Online
  const onlineRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/driver/toggle-online',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` }
    },
    { isOnline: true, lat: 22.7196, lng: 75.8577 }
  );
  assert.strictEqual(onlineRes.status, 200);
  pass(`Step 3: Driver approved & toggled online (${driverPhone})`);

  // 4. Register Secondary Unassigned Driver
  const unassignedPhone = randomPhone();
  const unassignedSignup = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/auth/driver/signup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      fullName: 'Intruder Driver QA',
      phone: unassignedPhone,
      email: `intruder_${Date.now()}@test.in`,
      password: 'Password@123',
      vehicleCategory: 'AUTO'
    }
  );
  const unassignedDriverToken = unassignedSignup.data.token;
  pass('Step 4: Secondary unassigned driver registered for negative testing');

  // 5. Rider Requests Ride
  const rideReq = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: '/api/customer/rides/request',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    {
      pickupAddress: 'Rajwada Palace, Indore',
      pickupLat: 22.7196,
      pickupLng: 75.8577,
      dropAddress: 'Vijay Nagar Square, Indore',
      dropLat: 22.7533,
      dropLng: 75.8937,
      vehicleCategory: 'AUTO',
      paymentMethod: 'CASH'
    }
  );
  assert.strictEqual(rideReq.data.success, true);
  const rideId = rideReq.data.ride.id;
  pass(`Step 5: Ride requested (Ride ID: ${rideId})`);

  // 6. Negative Test: Try to send message before driver assignment
  const earlyMsg = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    { message: 'Are you coming?' }
  );
  assert.strictEqual(earlyMsg.status, 400);
  assert.match(earlyMsg.data.message, /not been assigned/i);
  pass('Step 6: Negative Test - Messaging blocked before driver assignment (400 Bad Request)');

  // 7. Driver Accepts Ride
  const acceptRes = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/accept`,
      method: 'POST',
      headers: { Authorization: `Bearer ${driverToken}` }
    }
  );
  assert.strictEqual(acceptRes.data.success, true);
  pass('Step 7: Driver accepted the ride');

  // 8. Negative Test: Unassigned driver tries to access chat
  const intruderChat = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${unassignedDriverToken}` }
  });
  assert.strictEqual(intruderChat.status, 403);
  pass('Step 8: Negative Test - Unassigned driver forbidden from accessing ride chat (403 Forbidden)');

  // 9. Negative Test: Unassigned driver tries to lookup contact
  const intruderContact = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/contact`,
    method: 'GET',
    headers: { Authorization: `Bearer ${unassignedDriverToken}` }
  });
  assert.strictEqual(intruderContact.status, 403);
  pass('Step 9: Negative Test - Contact lookup blocked for unauthorized user (403 Forbidden)');

  // 10. Rider Fetches Assigned Driver Contact Securely
  const driverContact = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/contact`,
    method: 'GET',
    headers: { Authorization: `Bearer ${riderToken}` }
  });
  assert.strictEqual(driverContact.status, 200);
  assert.strictEqual(driverContact.data.success, true);
  assert.strictEqual(driverContact.data.contact.role, 'DRIVER');
  assert.strictEqual(driverContact.data.contact.phone, driverPhone);
  assert.ok(driverContact.data.contact.vehicle);
  pass(`Step 10: Rider fetched driver contact securely (Name: ${driverContact.data.contact.name}, Phone: ${driverContact.data.contact.phone})`);

  // 11. Driver Fetches Assigned Passenger Contact Securely
  const riderContact = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/contact`,
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert.strictEqual(riderContact.status, 200);
  assert.strictEqual(riderContact.data.success, true);
  assert.strictEqual(riderContact.data.contact.role, 'RIDER');
  assert.strictEqual(riderContact.data.contact.phone, riderPhone);
  pass(`Step 11: Driver fetched passenger contact securely (Phone: ${riderContact.data.contact.phone})`);

  // 12. Rider Sends Pickup Quick Message
  const pickupMsg = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    {
      message: 'I am waiting at the pickup location near the main gate.',
      messageType: 'QUICK_PICKUP'
    }
  );
  assert.strictEqual(pickupMsg.status, 201);
  assert.strictEqual(pickupMsg.data.message.senderRole, 'RIDER');
  assert.strictEqual(pickupMsg.data.message.messageType, 'QUICK_PICKUP');
  assert.strictEqual(pickupMsg.data.message.isRead, false);
  pass('Step 12: Rider sent quick pickup situation message');

  // 13. Driver Fetches Unread Message Count
  const driverUnread = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/unread-count`,
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert.strictEqual(driverUnread.status, 200);
  assert.strictEqual(driverUnread.data.unreadCount, 1);
  pass('Step 13: Driver unread message count accurately reports 1 unread message');

  // 14. Driver Opens Chat -> Fetches History & Automatically Marks as Read
  const chatHist = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert.strictEqual(chatHist.status, 200);
  assert.strictEqual(chatHist.data.messages.length, 1);
  assert.strictEqual(chatHist.data.messages[0].isRead, true);
  assert.strictEqual(chatHist.data.messages[0].status, 'READ');
  pass('Step 14: Driver opened chat, received message history & marked message as READ');

  // 15. Driver Sends Quick Pickup Reply
  const driverReply = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` }
    },
    {
      message: 'I am on my way. Reaching your gate in 2 minutes.',
      messageType: 'QUICK_PICKUP'
    }
  );
  assert.strictEqual(driverReply.status, 201);
  assert.strictEqual(driverReply.data.message.senderRole, 'DRIVER');
  pass('Step 15: Driver sent quick pickup reply to passenger');

  // 16. Negative Test: Blank message
  const blankMsg = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    { message: '   ' }
  );
  assert.strictEqual(blankMsg.status, 400);
  pass('Step 16: Negative Test - Blank message rejected with 400 Bad Request');

  // 17. Negative Test: Message length limit (>500 chars)
  const longMsg = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    { message: 'X'.repeat(501) }
  );
  assert.strictEqual(longMsg.status, 400);
  pass('Step 17: Negative Test - Oversized message (>500 chars) rejected with 400 Bad Request');

  // 18. Complete Ride
  await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/driver/rides/${rideId}/arrived`,
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` }
  });

  const rideInfo = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/customer/rides/${rideId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${riderToken}` }
  });
  const otp = rideInfo.data.ride.otp;

  await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/driver/rides/${rideId}/start`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverToken}` }
    },
    { otp }
  );

  const completeRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/driver/rides/${rideId}/complete`,
    method: 'POST',
    headers: { Authorization: `Bearer ${driverToken}` }
  });
  assert.strictEqual(completeRes.status, 200);
  pass('Step 18: Driver completed the ride');

  // 19. Negative Test: Messaging disabled after ride is COMPLETED
  const postCompletedMsg = await makeRequest(
    {
      hostname: '127.0.0.1',
      port: 5050,
      path: `/api/chat/${rideId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderToken}` }
    },
    { message: 'Are you still there?' }
  );
  assert.strictEqual(postCompletedMsg.status, 400);
  assert.match(postCompletedMsg.data.message, /already completed/i);
  pass('Step 19: Negative Test - Messaging disabled after ride completion (400 Bad Request)');

  // 20. Read-only History Verified
  const finalChat = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/${rideId}/messages`,
    method: 'GET',
    headers: { Authorization: `Bearer ${riderToken}` }
  });
  assert.strictEqual(finalChat.status, 200);
  assert.strictEqual(finalChat.data.isReadOnly, true);
  assert.strictEqual(finalChat.data.messages.length, 2);
  pass('Step 20: Read-only chat history preserved with 2 messages');

  // 21. Super Admin Audit Inspection
  const auditRes = await makeRequest({
    hostname: '127.0.0.1',
    port: 5050,
    path: `/api/chat/admin/${rideId}/audit`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(auditRes.status, 200);
  assert.strictEqual(auditRes.data.success, true);
  assert.strictEqual(auditRes.data.messageCount, 2);
  pass('Step 21: Super Admin safety audit log inspected and recorded');

  console.log('================================================================');
  console.log(`🎉 ALL ${passed} / 21 CHAT & CONTACT INTEGRATION TESTS PASSED!`);
  console.log('================================================================');
}

runChatTests().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});
