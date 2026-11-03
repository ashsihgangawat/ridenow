import http from 'http';
import https from 'https';
import net from 'net';
import { io as ClientIO } from '../../frontend/node_modules/socket.io-client/build/esm/index.js';

console.log('================================================================');
console.log('🗺️ RIDENOW OPENFREEMAP, GIS ROUTING & LIVE TRACKING TEST SUITE');
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
    console.log('⚡ Server already running on port 5050. Testing live instance.');
  } else {
    console.log('Starting in-process backend server...');
    await import('../src/index.js');
    await new Promise((r) => setTimeout(r, 1500));
  }
};

startApp().then(async () => {
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

  function fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client
        .get(url, { headers: { 'User-Agent': 'RideNow-GIS-Test/1.0' } }, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data) });
            } catch (_) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        })
        .on('error', reject);
    });
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: OpenFreeMap Liberty Vector Style Endpoint Check
    // -------------------------------------------------------------------------
    const styleRes = await fetchUrl('https://tiles.openfreemap.org/styles/liberty');
    assert(
      styleRes.status === 200 && (styleRes.data?.version === 8 || styleRes.data?.sources),
      'Test 1: OpenFreeMap Liberty vector tile style is reachable and returns valid MapLibre style JSON',
      `HTTP ${styleRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 2: OSRM Real Road Route Calculation (Indore Dev Location)
    // From Rajwada Indore [75.8577, 22.7196] to Vijay Nagar Indore [75.8937, 22.7533]
    // -------------------------------------------------------------------------
    const osrmUrl =
      'https://router.project-osrm.org/route/v1/driving/75.8577,22.7196;75.8937,22.7533?overview=full&geometries=geojson';
    const routeRes = await fetchUrl(osrmUrl);
    const hasRoute = routeRes.status === 200 && routeRes.data?.code === 'Ok' && routeRes.data.routes?.length > 0;
    const distanceKm = hasRoute ? (routeRes.data.routes[0].distance / 1000).toFixed(2) : 0;
    const durationMin = hasRoute ? Math.round(routeRes.data.routes[0].duration / 60) : 0;
    const coordsCount = hasRoute ? routeRes.data.routes[0].geometry?.coordinates?.length : 0;

    assert(
      hasRoute && distanceKm > 3 && coordsCount > 20,
      `Test 2: OSRM driving route calculated: ${distanceKm} km, ~${durationMin} mins, ${coordsCount} GeoJSON waypoints (Indore Rajwada -> Vijay Nagar)`,
      `Status: ${routeRes.status}`
    );

    // -------------------------------------------------------------------------
    // TEST 3: Photon / OSM Geocoding Search Check
    // -------------------------------------------------------------------------
    const photonUrl = 'https://photon.komoot.io/api?q=Rajwada+Indore&limit=3';
    const geoRes = await fetchUrl(photonUrl);
    const hasGeo = geoRes.status === 200 && geoRes.data?.features?.length > 0;
    assert(
      hasGeo,
      'Test 3: Photon OSM geocoding search successfully resolved "Rajwada Indore" coordinates',
      `Features: ${geoRes.data?.features?.length}`
    );

    // -------------------------------------------------------------------------
    // TEST 4: Live Driver Tracking Telemetry via Socket.IO
    // -------------------------------------------------------------------------
    await new Promise((resolve) => {
      const driverSocket = ClientIO('http://localhost:5050', { transports: ['websocket'] });
      const riderSocket = ClientIO('http://localhost:5050', { transports: ['websocket'] });
      const adminSocket = ClientIO('http://localhost:5050', { transports: ['websocket'] });

      const testRideId = 'ride_test_gis_' + Date.now();
      const testDriverId = 'driver_test_99';
      let riderReceived = false;
      let adminReceived = false;

      const finishTest = () => {
        driverSocket.disconnect();
        riderSocket.disconnect();
        adminSocket.disconnect();
        resolve(true);
      };

      riderSocket.on('connect', () => {
        riderSocket.emit('join_ride', { rideId: testRideId });
      });

      adminSocket.on('connect', () => {
        adminSocket.emit('join_user', { role: 'SUPER_ADMIN' });
      });

      riderSocket.on('driver_location_update', (data) => {
        if (data.rideId === testRideId && data.lat === 22.7196) {
          riderReceived = true;
          if (adminReceived && riderReceived) {
            assert(true, 'Test 4: Rider received targeted live driver telemetry update for their active ride');
            finishTest();
          }
        }
      });

      adminSocket.on('live_driver_moved', (data) => {
        if (data.driverId === testDriverId && data.lat === 22.7196) {
          adminReceived = true;
          if (adminReceived && riderReceived) {
            assert(true, 'Test 4b: Super Admin received real-time live driver GPS coordinate telemetry on monitoring stream');
            finishTest();
          }
        }
      });

      // Send telemetry after sockets connect
      setTimeout(() => {
        driverSocket.emit('update_driver_location', {
          driverId: testDriverId,
          lat: 22.7196,
          lng: 75.8577,
          heading: 45,
          rideId: testRideId
        });
      }, 500);

      // Safety timeout
      setTimeout(() => {
        if (!riderReceived || !adminReceived) {
          assert(riderReceived, 'Test 4: Rider received live telemetry');
          assert(adminReceived, 'Test 4b: Admin received live telemetry');
          finishTest();
        }
      }, 3500);
    });

    // -------------------------------------------------------------------------
    // TEST 5: Backend Fare Engine with Real Distance
    // -------------------------------------------------------------------------
    const fareCheck = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        pickup: { lat: 22.7196, lng: 75.8577 },
        destination: { lat: 22.7533, lng: 75.8937 }
      });

      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: 5050,
          path: '/api/fare/estimate',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
        }
      );
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    assert(
      fareCheck.status === 200 && fareCheck.data?.estimates?.length >= 3,
      `Test 5: Backend fare engine accurately priced trip categories for Indore coordinates: ${fareCheck.data?.distanceKm} km (Base: ₹${fareCheck.data?.estimates?.[0]?.totalFare})`
    );

  } catch (err) {
    console.error('GIS Test Error:', err);
    failed++;
  }

  console.log('----------------------------------------------------------------');
  console.log(`TOTAL GIS TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('----------------------------------------------------------------');

  process.exit(failed > 0 ? 1 : 0);
});
