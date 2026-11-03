/**
 * RideNow Central Map Configuration
 * Powered by OpenFreeMap vector tiles & MapLibre GL JS
 */

export const MAP_CONFIG = {
  // OpenFreeMap vector tile style (free, no API key, no rate limits)
  STYLE_URL: 'https://tiles.openfreemap.org/styles/liberty',
  
  // Fallback styles if liberty style has connectivity issues
  FALLBACK_STYLE_URL: 'https://tiles.openfreemap.org/styles/bright',

  // Default dev location: Indore, Madhya Pradesh, India
  DEFAULT_CENTER: {
    lng: 75.8577,
    lat: 22.7196,
    cityName: 'Indore, Madhya Pradesh'
  },

  // Map view settings
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 3,
  MAX_ZOOM: 19,
  PITCH: 25,
  BEARING: 0,

  // Route styling
  ROUTE_STYLE: {
    LINE_COLOR: '#facc15', // Bright yellow
    LINE_WIDTH: 5,
    LINE_OPACITY: 0.85,
    GLOW_COLOR: 'rgba(250, 204, 21, 0.35)',
    GLOW_WIDTH: 10
  },

  // Routing API (OSRM driving profile for actual road navigation)
  OSRM_ROUTER_URL: 'https://router.project-osrm.org/route/v1/driving',

  // Geocoding API (Photon by Komoot - free, OpenStreetMap data, supports autocomplete)
  PHOTON_API_URL: 'https://photon.komoot.io/api',

  // Nominatim API (fallback geocoding adhering to OSM usage policy)
  NOMINATIM_API_URL: 'https://nominatim.openstreetmap.org',

  // Timing & throttles
  SEARCH_DEBOUNCE_MS: 300,
  GPS_UPDATE_THROTTLE_MS: 3000,
  ROUTE_CACHE_MAX_AGE_MS: 1000 * 60 * 30, // 30 minutes
  TILE_RETRY_LIMIT: 3
};

// Popular Indore & National Landmarks for quick select & offline resilience
export const DEFAULT_POPULAR_LANDMARKS = [
  { name: 'Rajwada Palace, Indore', lat: 22.7196, lng: 75.8577, city: 'Indore' },
  { name: 'Chhappan Dukan, New Palasia, Indore', lat: 22.7244, lng: 75.8839, city: 'Indore' },
  { name: 'Devi Ahilyabai Holkar Airport (IDR), Indore', lat: 22.7217, lng: 75.8011, city: 'Indore' },
  { name: 'Super Corridor, TCS Square, Indore', lat: 22.7660, lng: 75.8200, city: 'Indore' },
  { name: 'Sarafa Bazaar Night Food Street, Indore', lat: 22.7170, lng: 75.8550, city: 'Indore' },
  { name: 'Bhawarkua Square, AB Road, Indore', lat: 22.6930, lng: 75.8670, city: 'Indore' },
  { name: 'Vijay Nagar Square, AB Road, Indore', lat: 22.7533, lng: 75.8937, city: 'Indore' },
  { name: 'Indira Gandhi International Airport (T3), New Delhi', lat: 28.5562, lng: 77.1000, city: 'Delhi' },
  { name: 'Connaught Place Central Market, New Delhi', lat: 28.6328, lng: 77.2197, city: 'Delhi' },
  { name: 'Kempegowda International Airport, Bengaluru', lat: 13.1986, lng: 77.7066, city: 'Bengaluru' },
  { name: 'Chhatrapati Shivaji Maharaj Terminus, Mumbai', lat: 18.9402, lng: 72.8356, city: 'Mumbai' }
];

