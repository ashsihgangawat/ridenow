import { chromium } from 'playwright';
import assert from 'assert';

const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:5050';

async function runBrowserChatTests() {
  console.log('================================================================');
  console.log('🎭 RIDENOW REAL BROWSER CHAT & CALLING E2E PLAYWRIGHT SUITE');
  console.log('================================================================');

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  } catch (_) {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }
  let passed = 0;

  function pass(name) {
    console.log(`✅ [PASS] ${name}`);
    passed++;
  }

  try {
    // 1. Super Admin Approves setup via API
    const adminLoginRes = await fetch(`${BACKEND_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ridenow.in', password: 'Admin@123' })
    });
    const { token: adminToken } = await adminLoginRes.json();
    assert.ok(adminToken, 'Admin token acquired');

    // 2. Register Rider
    const riderPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    const riderPassword = 'Password@123';
    const riderSignupRes = await fetch(`${BACKEND_URL}/api/auth/rider/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Rahul Verma Rider',
        phone: riderPhone,
        email: `rahul_${Date.now()}@test.in`,
        password: riderPassword
      })
    });
    const riderData = await riderSignupRes.json();
    assert.strictEqual(riderSignupRes.status, 201);
    pass(`Test 1: Rider account created (${riderPhone})`);

    // 3. Register Driver & Approve
    const driverPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
    const driverPassword = 'Password@123';
    const driverSignupRes = await fetch(`${BACKEND_URL}/api/auth/driver/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Sunil Kumar Pilot',
        phone: driverPhone,
        email: `sunil_${Date.now()}@test.in`,
        password: driverPassword,
        vehicleCategory: 'AUTO',
        vehicleMake: 'Bajaj',
        vehicleModel: 'RE Compact',
        vehicleNumber: 'MP-09-RN-8800',
        licenseNumber: 'MP-09-2023-008800'
      })
    });
    const driverData = await driverSignupRes.json();
    assert.strictEqual(driverSignupRes.status, 201);

    // Get Driver Profile & Approve
    const profRes = await fetch(`${BACKEND_URL}/api/driver/profile`, {
      headers: { Authorization: `Bearer ${driverData.token}` }
    });
    const { driver } = await profRes.json();

    await fetch(`${BACKEND_URL}/api/admin/drivers/${driver.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'APPROVED' })
    });

    await fetch(`${BACKEND_URL}/api/driver/toggle-online`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverData.token}` },
      body: JSON.stringify({ isOnline: true, lat: 22.7196, lng: 75.8577 })
    });
    pass(`Test 2: Driver registered, verified, and toggled online (${driverPhone})`);

    // 4. Create Two Separate Browser Contexts (Rider and Driver)
    const riderContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const driverContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });

    const riderPage = await riderContext.newPage();
    const driverPage = await driverContext.newPage();

    // 5. Driver logs into Driver Portal
    await driverPage.goto(`${BASE_URL}/driver/login`);
    await driverPage.fill('input[type="text"]', driverPhone);
    await driverPage.fill('input[type="password"]', driverPassword);
    await driverPage.click('button[type="submit"]');
    await driverPage.waitForURL('**/driver/dashboard', { timeout: 10000 });
    pass('Test 3: Driver logged into Driver Portal & viewing Live Dashboard');

    // 6. Rider books a ride via API to establish active ride
    const bookRes = await fetch(`${BACKEND_URL}/api/customer/rides/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${riderData.token}` },
      body: JSON.stringify({
        pickupAddress: 'Rajwada Palace, Indore',
        pickupLat: 22.7196,
        pickupLng: 75.8577,
        dropAddress: 'Vijay Nagar Square, Indore',
        dropLat: 22.7533,
        dropLng: 75.8937,
        vehicleCategory: 'AUTO',
        paymentMethod: 'CASH'
      })
    });
    const bookData = await bookRes.json();
    assert.strictEqual(bookData.success, true);
    const rideId = bookData.ride.id;
    pass(`Test 4: Ride requested successfully (Ride ID: ${rideId})`);

    // 7. Driver accepts the ride via API (or UI)
    const acceptRes = await fetch(`${BACKEND_URL}/api/driver/rides/${rideId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${driverData.token}` }
    });
    const acceptData = await acceptRes.json();
    assert.strictEqual(acceptData.success, true);
    pass('Test 5: Driver accepted the ride');

    // 8. Rider logs into Rider Portal and navigates to active ride
    await riderPage.goto(`${BASE_URL}/rider/login`);
    await riderPage.fill('input[type="text"]', riderPhone);
    await riderPage.fill('input[type="password"]', riderPassword);
    await riderPage.click('button[type="submit"]');
    await riderPage.waitForURL('**/rider/dashboard', { timeout: 10000 });

    // Navigate to active ride tracking screen
    await riderPage.goto(`${BASE_URL}/rider/ride/${rideId}`);
    await riderPage.waitForSelector('text=Live Telemetry', { timeout: 10000 });
    pass('Test 6: Rider active ride telemetry tracking screen loaded');

    // 9. Verify Driver Contact Information & Call Button on Rider screen
    const driverNameVisible = await riderPage.isVisible('text=Sunil Kumar Pilot');
    assert.ok(driverNameVisible, 'Assigned driver name is displayed to rider');

    const callButton = await riderPage.waitForSelector(`a[href="tel:${driverPhone}"]`, { timeout: 5000 });
    assert.ok(callButton, 'Call Driver button has correct tel: protocol link');
    pass('Test 7: Assigned driver contact details & tel: call button verified on Rider Portal');

    // 10. Rider opens Chat Drawer
    const chatButton = await riderPage.waitForSelector('button:has-text("Chat with Driver")', { timeout: 5000 });
    await chatButton.click();
    await riderPage.waitForSelector('text=RideNow SafeComm', { timeout: 5000 });
    pass('Test 8: Rider opened in-app WhatsApp-style chat drawer');

    // 11. Rider sends a quick pickup message
    const quickChip = await riderPage.waitForSelector('button:has-text("I am waiting at the pickup location.")', { timeout: 5000 });
    await quickChip.click();
    await riderPage.waitForSelector('text=I am waiting at the pickup location.', { timeout: 5000 });
    pass('Test 9: Rider sent predefined quick pickup message via chip');

    // 12. Driver refreshes/navigates to dashboard to check active ride
    await driverPage.goto(`${BASE_URL}/driver/dashboard`);
    await driverPage.waitForSelector('text=Current Trip Telemetry', { timeout: 10000 });

    // Verify Passenger Calling link on Driver Dashboard
    const driverCallPassenger = await driverPage.waitForSelector(`a[href="tel:${riderPhone}"]`, { timeout: 5000 });
    assert.ok(driverCallPassenger, 'Driver has secure tel: link to call passenger');
    pass('Test 10: Driver active ride panel displays passenger call link');

    // 13. Driver opens Chat with Rider
    const driverChatBtn = await driverPage.waitForSelector('button:has-text("Chat with Rider")', { timeout: 5000 });
    await driverChatBtn.click();
    await driverPage.waitForSelector('text=RideNow SafeComm', { timeout: 5000 });

    // Verify driver sees the rider's message in real time
    await driverPage.waitForSelector('text=I am waiting at the pickup location.', { timeout: 5000 });
    pass('Test 11: Driver received rider message in chat drawer');

    // 14. Driver sends reply
    await driverPage.fill('input[placeholder*="Message"]', 'I am on my way. Reaching your gate in 2 minutes.');
    await driverPage.click('button[title="Send message"]');
    await driverPage.waitForSelector('text=I am on my way. Reaching your gate in 2 minutes.', { timeout: 5000 });
    pass('Test 12: Driver sent custom reply message');

    // 15. Rider sees the driver reply
    await riderPage.waitForSelector('text=I am on my way. Reaching your gate in 2 minutes.', { timeout: 5000 });
    pass('Test 13: Real-time bidirectional message delivery verified across browser sessions');

    console.log('================================================================');
    console.log(`🎉 ALL ${passed} / 13 PLAYWRIGHT BROWSER CHAT & CALLING TESTS PASSED!`);
    console.log('================================================================');
  } finally {
    await browser.close();
  }
}

runBrowserChatTests().catch((err) => {
  console.error('❌ Browser Playwright Test Failed:', err);
  process.exit(1);
});
