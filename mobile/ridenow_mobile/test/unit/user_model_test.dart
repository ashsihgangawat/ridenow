import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/auth/models/user_model.dart';

void main() {
  group('UserModel Unit Tests', () {
    test('Rider profile correctly identified from JSON', () {
      final json = {
        'id': 'user-101',
        'fullName': 'Aarav Sharma',
        'phone': '+919893011223',
        'role': 'RIDER',
        'status': 'ACTIVE',
      };

      final user = UserModel.fromJson(json);
      expect(user.id, 'user-101');
      expect(user.fullName, 'Aarav Sharma');
      expect(user.isRider, isTrue);
      expect(user.isDriver, isFalse);
    });

    test('Approved driver partner correctly verified', () {
      final json = {
        'id': 'driver-202',
        'fullName': 'Vikram Singh',
        'phone': '+919876543210',
        'role': 'DRIVER',
        'driverProfile': {
          'id': 'dp-1',
          'verificationStatus': 'APPROVED',
          'isOnline': true,
          'rating': 4.9,
        },
      };

      final user = UserModel.fromJson(json);
      expect(user.isDriver, isTrue);
      expect(user.isRider, isFalse);
      expect(user.isApprovedDriver, isTrue);
    });

    test('Pending driver partner is not approved', () {
      final json = {
        'id': 'driver-203',
        'fullName': 'New Pilot',
        'phone': '+919876543211',
        'role': 'DRIVER',
        'driverProfile': {'verificationStatus': 'PENDING'},
      };

      final user = UserModel.fromJson(json);
      expect(user.isDriver, isTrue);
      expect(user.isApprovedDriver, isFalse);
    });
  });
}
