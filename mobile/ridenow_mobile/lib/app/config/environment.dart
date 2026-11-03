import 'package:flutter/foundation.dart';

class EnvironmentConfig {
  static const String appName = 'RideNow';
  static const String appVersion = '1.0.0';

  // Base API configuration
  // On Android physical or emulator:
  // Android Emulator loopback is 10.0.2.2.
  // On Desktop/Web: 127.0.0.1:5050
  // LAN IP for real devices: 192.168.1.61:5050
  static String get baseUrl {
    if (kIsWeb) return 'http://127.0.0.1:5050';
    if (defaultTargetPlatform == TargetPlatform.android) {
      // 10.0.2.2 accesses host localhost from Android emulator
      return 'http://10.0.2.2:5050';
    }
    return 'http://127.0.0.1:5050';
  }

  static String get socketUrl => baseUrl;

  // Indore, Madhya Pradesh Coordinates (Default Development Center)
  static const double defaultLatitude = 22.7196;
  static const double defaultLongitude = 75.8577;

  // GIS & Map Services
  static const String mapStyleUrl =
      'https://tiles.openfreemap.org/styles/liberty';
  static const String tileUrlPattern =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String photonGeocodingUrl = 'https://photon.komoot.io/api';
  static const String osrmRoutingUrl =
      'https://router.project-osrm.org/route/v1/driving';

  // Razorpay Payment Gateway Key (Test Mode)
  // TODO: Replace with your actual Razorpay Key ID from https://dashboard.razorpay.com
  static const String razorpayKeyId = 'rzp_test_placeholder_key';

  // Indian Regulatory & Safety Hotline
  static const String emergencySosNumber = '112';
}
