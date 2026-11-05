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

  // GIS & Map Services - Geoapify Light Navigation Tiles (Uber/Ola Style) + OSM Fallback
  static const String mapStyleUrl =
      'https://tiles.openfreemap.org/styles/liberty';
  static const String tileUrlPattern =
      'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=2bb4dc887a5f40fcb47e87be2c128bdf';
  static const String osmTileUrlPattern =
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  static const String photonGeocodingUrl = 'https://photon.komoot.io/api';
  static const String osrmRoutingUrl =
      'https://router.project-osrm.org/route/v1/driving';

  // Geoapify Geocoding, Reverse Geocoding & Autocomplete Services
  static const String geoapifyApiKey = '2bb4dc887a5f40fcb47e87be2c128bdf';
  static const String geoapifySearchUrl = 'https://api.geoapify.com/v1/geocode/search';
  static const String geoapifyReverseUrl = 'https://api.geoapify.com/v1/geocode/reverse';
  static const String geoapifyAutocompleteUrl = 'https://api.geoapify.com/v1/geocode/autocomplete';

  // Razorpay Payment Gateway Key (Test Mode)
  static const String razorpayKeyId = 'rzp_test_placeholder_key';

  // Indian Regulatory & Safety Hotline
  static const String emergencySosNumber = '112';
}
