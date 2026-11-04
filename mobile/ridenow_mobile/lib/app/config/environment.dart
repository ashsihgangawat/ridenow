class EnvironmentConfig {
  static const String appName = 'RideNow';
  static const String appVersion = '1.0.0';

  // Base API configuration (Render Deployed Production Backend)
  static const String defaultBaseUrl = 'https://ridenow-bx6n.onrender.com';

  static String get baseUrl {
    return const String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: defaultBaseUrl,
    );
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
