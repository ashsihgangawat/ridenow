import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/driver/providers/driver_verification_provider.dart';

void main() {
  group('Driver Verification Models & State Unit Tests', () {
    test('VerificationDocItem parses correctly from JSON', () {
      final doc = VerificationDocItem.fromJson({
        'documentType': 'DRIVING_LICENSE',
        'status': 'APPROVED',
        'documentNumber': 'DL-042019-887711',
        'fileUrl': 'https://storage.ridenow.in/dl.jpg',
        'fileName': 'dl.jpg',
        'fileSize': 1024000,
        'expiryDate': '2030-12-31',
        'isExpired': false,
        'rejectionReason': null,
      });

      expect(doc.documentType, 'DRIVING_LICENSE');
      expect(doc.displayName, 'Driving Licence (DL)');
      expect(doc.status, 'APPROVED');
      expect(doc.requiresExpiryDate, true);
      expect(doc.isExpired, false);
      expect(doc.documentNumber, 'DL-042019-887711');
    });

    test('VerificationDocItem handles expiry date logic', () {
      final expiredDoc = VerificationDocItem.fromJson({
        'documentType': 'PUC_CERTIFICATE',
        'status': 'EXPIRED',
        'expiryDate': '2023-01-01',
        'isExpired': true,
      });

      expect(expiredDoc.displayName, 'Pollution Under Control (PUC)');
      expect(expiredDoc.isExpired, true);
      expect(expiredDoc.requiresExpiryDate, true);
    });

    test('VerificationDocItem identifies documents that do not need expiry', () {
      final rcDoc = VerificationDocItem.fromJson({
        'documentType': 'VEHICLE_RC',
        'status': 'PENDING',
      });
      expect(rcDoc.requiresExpiryDate, false);

      final selfieDoc = VerificationDocItem.fromJson({
        'documentType': 'DRIVER_SELFIE',
        'status': 'PENDING',
      });
      expect(selfieDoc.requiresExpiryDate, false);
    });

    test('DriverVerificationState status flags work as expected', () {
      final pendingState = DriverVerificationState(
        verificationStatus: 'DOCUMENTS_PENDING',
        uploadedCount: 3,
        totalRequired: 7,
      );
      expect(pendingState.isPendingDocuments, true);
      expect(pendingState.isApproved, false);
      expect(pendingState.isUnderReview, false);

      final underReviewState = DriverVerificationState(
        verificationStatus: 'UNDER_REVIEW',
        uploadedCount: 7,
        totalRequired: 7,
      );
      expect(underReviewState.isUnderReview, true);
      expect(pendingState.isApproved, false);

      final correctionState = DriverVerificationState(
        verificationStatus: 'CORRECTION_REQUIRED',
        rejectedCount: 1,
      );
      expect(correctionState.needsCorrection, true);

      final approvedState = DriverVerificationState(
        verificationStatus: 'APPROVED',
        adminApproved: true,
        approvedCount: 7,
      );
      expect(approvedState.isApproved, true);
    });

    test('Mandatory document types list contains all 7 required documents', () {
      expect(mandatoryDocTypes.length, 7);
      expect(mandatoryDocTypes.contains('DRIVING_LICENSE'), true);
      expect(mandatoryDocTypes.contains('VEHICLE_RC'), true);
      expect(mandatoryDocTypes.contains('VEHICLE_INSURANCE'), true);
      expect(mandatoryDocTypes.contains('PUC_CERTIFICATE'), true);
      expect(mandatoryDocTypes.contains('IDENTITY_PROOF'), true);
      expect(mandatoryDocTypes.contains('DRIVER_SELFIE'), true);
      expect(mandatoryDocTypes.contains('VEHICLE_PHOTO'), true);
    });
  });
}

