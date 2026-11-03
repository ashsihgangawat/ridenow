import assert from 'assert';
import { db } from '../src/services/db.js';
import { DriverController } from '../src/controllers/driverController.js';
import { AdminController } from '../src/controllers/adminController.js';

async function runVerificationTests() {
  console.log('🧪 Starting RideNow Driver Verification System Integration Tests...');

  // Helper mock res
  function createMockRes() {
    return {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
  }

  // --- Scenario 1: New Driver Registers for Bike ---
  console.log('1️⃣ Test: Register New Bike Driver...');
  const testPhone = `+9199${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regReq = {
    body: {
      fullName: 'Vikramaditya Rathore',
      phone: testPhone,
      email: `vikram_${Date.now()}@test.in`,
      dateOfBirth: '1996-08-20',
      address: 'Geeta Bhawan, Indore, MP',
      vehicleCategory: 'BIKE',
      make: 'Hero',
      model: 'Splendor Plus',
      registrationNumber: `MP 09 BK ${Math.floor(1000 + Math.random() * 9000)}`,
      color: 'Black',
      manufacturingYear: 2024
    }
  };
  const regRes = createMockRes();
  await DriverController.registerDriver(regReq, regRes);
  assert.strictEqual(regRes.statusCode, 201, 'Driver registration should return 201');
  assert.strictEqual(regRes.jsonData.success, true, 'Registration must succeed');
  assert.strictEqual(regRes.jsonData.driver.verificationStatus, 'DOCUMENTS_PENDING', 'Initial status must be DOCUMENTS_PENDING');
  console.log('   ✅ Bike Driver Registered. ID:', regRes.jsonData.driver.id);

  const driverId = regRes.jsonData.driver.id;
  const userId = regRes.jsonData.user.id;

  // --- Scenario 2: Prevent Duplicate Driver Registration with Same Phone ---
  console.log('2️⃣ Test: Prevent Duplicate Driver Phone...');
  const dupRes = createMockRes();
  await DriverController.registerDriver(regReq, dupRes);
  assert.strictEqual(dupRes.statusCode, 400, 'Duplicate phone should be blocked with 400');
  console.log('   ✅ Duplicate registration blocked successfully.');

  // --- Scenario 3: Check Verification Status Before Upload ---
  console.log('3️⃣ Test: Verification Status (Incomplete)...');
  const statusReq = { user: { id: userId, role: 'DRIVER' } };
  const statusRes = createMockRes();
  await DriverController.getVerificationStatus(statusReq, statusRes);
  assert.strictEqual(statusRes.jsonData.verificationStatus, 'NOT_SUBMITTED', 'When 0 docs uploaded, status is NOT_SUBMITTED');
  assert.strictEqual(statusRes.jsonData.stats.totalRequired, 7);
  assert.strictEqual(statusRes.jsonData.stats.uploadedCount, 0);
  console.log('   ✅ Verification status reflects 0/7 documents uploaded (NOT_SUBMITTED).');

  // --- Scenario 4: Try Going Online When Not Approved (Strict Restriction Check) ---
  console.log('4️⃣ Test: Activation Restriction (Cannot Go Online)...');
  const onlineReq = { user: { id: userId, role: 'DRIVER' }, body: { isOnline: true } };
  const onlineRes = createMockRes();
  await DriverController.toggleAvailability(onlineReq, onlineRes);
  assert.strictEqual(onlineRes.statusCode, 403, 'Must return 403 Forbidden');
  assert.strictEqual(onlineRes.jsonData.code, 'VERIFICATION_REQUIRED', 'Must return VERIFICATION_REQUIRED code');
  console.log('   ✅ Blocked unapproved driver from going online:', onlineRes.jsonData.message);

  // --- Scenario 5: Upload 7 Mandatory Documents ---
  console.log('5️⃣ Test: Upload All 7 Compliance Documents...');
  const docTypes = [
    'DRIVING_LICENSE',
    'VEHICLE_RC',
    'VEHICLE_INSURANCE',
    'PUC_CERTIFICATE',
    'IDENTITY_PROOF',
    'DRIVER_SELFIE',
    'VEHICLE_PHOTO'
  ];

  for (const docType of docTypes) {
    const uploadReq = {
      user: { id: userId, role: 'DRIVER' },
      body: {
        documentType: docType,
        documentNumber: `TEST-DOC-${docType}-123`,
        fileUrl: `https://storage.ridenow.in/private/${driverId}/${docType}.jpg`,
        fileName: `${docType}.jpg`,
        fileSize: 1024 * 500,
        fileType: 'image/jpeg',
        expiryDate: '2028-12-31'
      }
    };
    const uploadRes = createMockRes();
    await DriverController.uploadKycDocument(uploadReq, uploadRes);
    assert.strictEqual(uploadRes.jsonData.success, true);
  }

  // Check Status Transition to UNDER_REVIEW
  const reviewStatusRes = createMockRes();
  await DriverController.getVerificationStatus(statusReq, reviewStatusRes);
  assert.strictEqual(reviewStatusRes.jsonData.verificationStatus, 'UNDER_REVIEW', 'Should transition to UNDER_REVIEW');
  assert.strictEqual(reviewStatusRes.jsonData.stats.uploadedCount, 7);
  console.log('   ✅ All 7 documents uploaded. Driver status transitioned to UNDER_REVIEW.');

  // --- Scenario 6: Admin Rejects Driving Licence (with reason) ---
  console.log('6️⃣ Test: Admin Rejects Document (with reason)...');
  const allDocs = db.driverDocuments.findMany({ where: { driverId } });
  const dlDoc = allDocs.find(d => d.documentType === 'DRIVING_LICENSE');
  assert(dlDoc, 'DL document must exist');

  const rejectDocReq = {
    params: { documentId: dlDoc.id },
    body: { rejectionReason: 'DL image is blurry, license number not readable' },
    user: { id: 'admin-1', role: 'ADMIN' }
  };
  const rejectDocRes = createMockRes();
  await AdminController.rejectDocument(rejectDocReq, rejectDocRes);
  assert.strictEqual(rejectDocRes.jsonData.success, true);

  // Status should transition to CORRECTION_REQUIRED
  const corrStatusRes = createMockRes();
  await DriverController.getVerificationStatus(statusReq, corrStatusRes);
  assert.strictEqual(corrStatusRes.jsonData.verificationStatus, 'CORRECTION_REQUIRED');
  console.log('   ✅ Document rejected with reason. Driver status is now CORRECTION_REQUIRED.');

  // --- Scenario 7: Driver Re-uploads Corrected Document ---
  console.log('7️⃣ Test: Driver Re-uploads Corrected Document...');
  const reuploadReq = {
    user: { id: userId, role: 'DRIVER' },
    body: {
      documentType: 'DRIVING_LICENSE',
      documentNumber: 'DL-042019-998877',
      fileUrl: `https://storage.ridenow.in/private/${driverId}/DRIVING_LICENSE_CLEAR.jpg`,
      fileName: 'DRIVING_LICENSE_CLEAR.jpg',
      fileSize: 1024 * 800,
      fileType: 'image/jpeg',
      expiryDate: '2030-12-31'
    }
  };
  const reuploadRes = createMockRes();
  await DriverController.uploadKycDocument(reuploadReq, reuploadRes);
  assert.strictEqual(reuploadRes.jsonData.success, true);
  console.log('   ✅ Corrected document re-uploaded.');

  // --- Scenario 8: Admin Approves All Documents & Approves Driver ---
  console.log('8️⃣ Test: Admin Approves Complete Driver Profile...');
  const approveReq = {
    params: { driverId },
    user: { id: 'admin-1', role: 'ADMIN' }
  };
  const approveRes = createMockRes();
  await AdminController.approveDriver(approveReq, approveRes);
  assert.strictEqual(approveRes.jsonData.success, true);
  assert.strictEqual(approveRes.jsonData.driver.verificationStatus, 'APPROVED');
  assert.strictEqual(approveRes.jsonData.driver.adminApproved, true);
  console.log('   ✅ Driver officially APPROVED by Compliance Admin.');

  // --- Scenario 9: Approved Driver Successfully Goes Online ---
  console.log('9️⃣ Test: Approved Driver Toggles Online & Accepts Rides...');
  const goOnlineReq = { user: { id: userId, role: 'DRIVER' }, body: { isOnline: true, lat: 22.7196, lng: 75.8577 } };
  const goOnlineRes = createMockRes();
  await DriverController.toggleAvailability(goOnlineReq, goOnlineRes);
  assert.strictEqual(goOnlineRes.statusCode, 200);
  assert.strictEqual(goOnlineRes.jsonData.isOnline, true, 'Driver should now be online');
  console.log('   ✅ Driver is now ONLINE:', goOnlineRes.jsonData.message);

  // --- Scenario 10: Admin Suspends Driver ---
  console.log('🔟 Test: Admin Suspends Driver & Revokes Online Status...');
  const suspendReq = {
    params: { driverId },
    body: { suspensionReason: 'Customer safety complaint under investigation' },
    user: { id: 'admin-1', role: 'ADMIN' }
  };
  const suspendRes = createMockRes();
  await AdminController.suspendDriver(suspendReq, suspendRes);
  assert.strictEqual(suspendRes.jsonData.driver.verificationStatus, 'SUSPENDED');
  assert.strictEqual(suspendRes.jsonData.driver.isOnline, false);

  // Verify suspended driver is blocked from going online again
  const tryOnlineRes = createMockRes();
  await DriverController.toggleAvailability(goOnlineReq, tryOnlineRes);
  assert.strictEqual(tryOnlineRes.statusCode, 403, 'Suspended driver must be blocked');
  console.log('   ✅ Suspended driver blocked from going online.');

  // --- Scenario 11: Expired Document Blocks Driver From Going Online ---
  console.log('1️⃣1️⃣ Test: Expired Document Blocks Driver...');
  // Reactivate driver
  db.driverProfiles.update({
    where: { id: driverId },
    data: { verificationStatus: 'APPROVED' }
  });
  // Expire Driving License
  const docsList = db.driverDocuments.findMany({ where: { driverId } });
  const dl = docsList.find(d => d.documentType === 'DRIVING_LICENSE');
  db.driverDocuments.update({
    where: { id: dl.id },
    data: { expiryDate: '2020-01-01' } // Expired in past
  });

  const expiredRes = createMockRes();
  await DriverController.toggleAvailability(goOnlineReq, expiredRes);
  assert.strictEqual(expiredRes.statusCode, 403, 'Must be blocked due to expired document');
  assert.strictEqual(expiredRes.jsonData.code, 'DOCUMENTS_EXPIRED');
  console.log('   ✅ Expired document strictly blocks going online:', expiredRes.jsonData.message);

  // Restore valid expiry
  db.driverDocuments.update({
    where: { id: dl.id },
    data: { expiryDate: '2030-12-31' }
  });

  // --- Scenario 12: Duplicate Vehicle Number Blocked ---
  console.log('1️⃣2️⃣ Test: Duplicate Vehicle Registration Number Blocked...');
  const duplicateVehicleReq = {
    body: {
      fullName: 'Another Driver',
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      vehicleCategory: 'BIKE',
      registrationNumber: regReq.body.registrationNumber // Same registration number
    }
  };
  const dupVehRes = createMockRes();
  await DriverController.registerDriver(duplicateVehicleReq, dupVehRes);
  assert.strictEqual(dupVehRes.statusCode, 400);
  assert(dupVehRes.jsonData.message.includes('already registered'), 'Duplicate registration number must be blocked');
  console.log('   ✅ Duplicate vehicle registration blocked:', dupVehRes.jsonData.message);

  console.log('\n🎉 ALL 12 DRIVER VERIFICATION & COMPLIANCE SCENARIOS PASSED SUCCESSFULLY!');
}

runVerificationTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
