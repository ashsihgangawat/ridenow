import 'package:flutter_test/flutter_test.dart';
import 'package:ridenow_mobile/features/maps/services/photon_geocoding_service.dart';

void main() {
  group('Photon Geocoding & Landmark Fallback Tests', () {
    test('Offline fallback returns famous Indore landmarks when network unavailable', () {
      final landmarks = PhotonGeocodingService.fallbackLandmarks;
      expect(landmarks.isNotEmpty, isTrue);

      final rajwada = landmarks.firstWhere((l) => l.name.contains('Rajwada'));
      expect(rajwada.name, 'Rajwada Palace');
      expect(rajwada.point.latitude, closeTo(22.7196, 0.01));
      expect(rajwada.point.longitude, closeTo(75.8577, 0.01));
    });

    test('Searching 56 Dukan / Chappan provides accurate coordinates', () {
      final landmarks = PhotonGeocodingService.fallbackLandmarks;
      final chappan = landmarks.firstWhere((l) => l.name.contains('Chappan'));
      expect(chappan.point.latitude, closeTo(22.7244, 0.01));
      expect(chappan.point.longitude, closeTo(75.8777, 0.01));
    });
  });
}
