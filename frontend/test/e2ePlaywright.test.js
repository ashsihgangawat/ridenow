import { chromium } from 'playwright';

console.log('================================================================');
console.log('🎭 RIDENOW PLAYWRIGHT FRONTEND E2E TEST SUITE');
console.log('================================================================');

async function runE2ETests() {
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

  let browser;
  try {
    // Launch installed Google Chrome or Edge in headless mode
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
    } catch (_) {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    }
    console.log(`🚀 Headless Browser launched: ${browser.version()}`);

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();

    // -------------------------------------------------------------------------
    // TEST 1: Gateway Landing Page (All 3 Portals Rendered)
    // -------------------------------------------------------------------------
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    const titleText = await page.textContent('body');
    assert(
      titleText?.includes('Rider Portal') &&
        titleText?.includes('Driver Partner Portal') &&
        titleText?.includes('Super Admin Console'),
      'Test 1: Portal Gateway renders 3 distinct portal access cards'
    );

    // -------------------------------------------------------------------------
    // TEST 2: Rider Login & OpenFreeMap Dashboard
    // -------------------------------------------------------------------------
    await page.goto('http://localhost:3000/rider/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="text"]', '+919811122233');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Wait for redirect to /rider/dashboard
    await page.waitForURL('**/rider/dashboard', { timeout: 8000 });
    assert(
      page.url().includes('/rider/dashboard'),
      'Test 2: Rider logs in successfully and lands on /rider/dashboard'
    );

    // Verify OpenFreeMap MapLibre container is present in DOM
    await page.waitForSelector('.maplibregl-canvas', { timeout: 10000 });
    const hasMapCanvas = await page.$('.maplibregl-canvas');
    assert(
      hasMapCanvas !== null,
      'Test 2b: OpenFreeMap MapLibre GL canvas initialized and rendered on Rider Dashboard'
    );

    // Verify map controls are present after style loads
    await page.waitForSelector('div[aria-label="Map Controls"]', { timeout: 10000 });
    const hasMapControls = await page.$('div[aria-label="Map Controls"]');
    assert(
      hasMapControls !== null,
      'Test 2c: Map navigation controls (zoom, recenter, locate me) mounted on Rider map'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Driver Portal Login & DriverMap
    // -------------------------------------------------------------------------
    const driverContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const driverPage = await driverContext.newPage();

    await driverPage.goto('http://localhost:3000/driver/login', { waitUntil: 'domcontentloaded' });
    await driverPage.fill('input[type="text"]', '+919876543210');
    await driverPage.fill('input[type="password"]', 'Admin@123');
    await driverPage.click('button[type="submit"]');

    await driverPage.waitForURL('**/driver/dashboard', { timeout: 8000 });
    assert(
      driverPage.url().includes('/driver/dashboard'),
      'Test 3: Driver logs in successfully and lands on /driver/dashboard'
    );

    await driverPage.waitForSelector('.maplibregl-canvas', { timeout: 10000 });
    const hasDriverMap = await driverPage.$('.maplibregl-canvas');
    assert(
      hasDriverMap !== null,
      'Test 3b: DriverMap MapLibre GL canvas rendered on Driver Partner Dashboard'
    );

    // -------------------------------------------------------------------------
    // TEST 4: Admin Console Login & AdminMap Fleet Telemetry
    // -------------------------------------------------------------------------
    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('http://localhost:3000/admin/login', { waitUntil: 'domcontentloaded' });
    await adminPage.fill('input[type="email"]', 'admin@ridenow.in');
    await adminPage.fill('input[type="password"]', 'Admin@123');
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/admin/dashboard', { timeout: 8000 });
    assert(
      adminPage.url().includes('/admin/dashboard'),
      'Test 4: Admin logs in successfully and enters Super Admin Console'
    );

    const adminHtml = await adminPage.evaluate(() => document.body.innerHTML);
    const hasCanvasInHtml = adminHtml.includes('maplibregl-canvas');
    const hasAdminMapText = adminHtml.includes('Live Fleet');
    console.log('ADMIN HTML CHECKS - Has canvas in DOM:', hasCanvasInHtml, '| Has Live Fleet header:', hasAdminMapText);

    try {
      const canvasEl = await adminPage.waitForSelector('.maplibregl-canvas', { timeout: 8000 });
      assert(
        canvasEl !== null,
        'Test 4b: AdminMap Mission Control fleet map initialized on Admin Dashboard'
      );
    } catch (e) {
      console.log('MAP CANVAS NOT FOUND ERROR:', e.message);
      assert(false, 'Test 4b: AdminMap Mission Control fleet map initialized on Admin Dashboard', e.message);
    }

    // -------------------------------------------------------------------------
    // TEST 5: Unauthorized Cross-Portal Route Guards in Clean Session
    // -------------------------------------------------------------------------
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();

    // Attempt to access protected /rider/dashboard as guest
    await guestPage.goto('http://localhost:3000/rider/dashboard', { waitUntil: 'domcontentloaded' });
    await guestPage.waitForURL('**/rider/login**', { timeout: 5000 });
    assert(
      guestPage.url().includes('/rider/login'),
      'Test 5: Unauthenticated guest accessing /rider/dashboard is redirected to /rider/login'
    );

    // Attempt to access protected /driver/dashboard as guest
    await guestPage.goto('http://localhost:3000/driver/dashboard', { waitUntil: 'domcontentloaded' });
    await guestPage.waitForURL('**/driver/login**', { timeout: 5000 });
    assert(
      guestPage.url().includes('/driver/login'),
      'Test 5b: Unauthenticated guest accessing /driver/dashboard is redirected to /driver/login'
    );

    // Attempt to access protected /admin/dashboard as guest
    await guestPage.goto('http://localhost:3000/admin/dashboard', { waitUntil: 'domcontentloaded' });
    await guestPage.waitForURL('**/admin/login**', { timeout: 5000 });
    assert(
      guestPage.url().includes('/admin/login'),
      'Test 5c: Unauthenticated guest accessing /admin/dashboard is redirected to /admin/login'
    );

    await guestContext.close();
    await context.close();
    await driverContext.close();
    await adminContext.close();

  } catch (err) {
    console.error('Playwright Test Error:', err);
    failed++;
  } finally {
    if (browser) await browser.close();
  }

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL PLAYWRIGHT E2E TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------');

  process.exit(failed > 0 ? 1 : 0);
}

runE2ETests();
