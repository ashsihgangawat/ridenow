import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/rider/models/ride_model.dart';

void main() {
  group('RideModel Unit Tests', () {
    test('Ride booking model parses fare, PIN and coordinates accurately', () {
      final json = {
        'id': 'ride-8899',
        'bookingCode': 'RN-4821',
        'customerId': 'cust-1',
        'driverId': 'drv-1',
        'vehicleCategory': 'AUTO',
        'pickupAddress': 'Rajwada Palace, Indore',
        'pickupLat': 22.7196,
        'pickupLng': 75.8577,
        'dropAddress': 'Vijay Nagar Square, Indore',
        'dropLat': 22.7533,
        'dropLng': 75.8937,
        'distanceKm': 4.5,
        'durationMinutes': 12.0,
        'totalFare': 95.0,
        'driverEarnings': 80.75,
        'status': 'ACCEPTED',
        'otp': '4821',
        'paymentMethod': 'CASH',
        'paymentStatus': 'PENDING',
        'createdAt': '2026-11-02T10:00:00.000Z',
      };

      final ride = RideModel.fromJson(json);
      expect(ride.id, 'ride-8899');
      expect(ride.bookingCode, 'RN-4821');
      expect(ride.otp, '4821');
      expect(ride.totalFare, 95.0);
      expect(ride.driverEarnings, 80.75);
      expect(ride.status, 'ACCEPTED');
      expect(ride.vehicleCategory, 'AUTO');
      expect(ride.pickupLat, 22.7196);
      expect(ride.dropLng, 75.8937);
    });
  });
}

