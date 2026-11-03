import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5050,
  jwtSecret: process.env.JWT_SECRET || 'ridenow_super_secret_jwt_key_2026_india',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  env: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ridenow?schema=public',
  
  // Payment Gateway
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_ridenow_demo_key',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_demo_token',
    isLive: process.env.RAZORPAY_IS_LIVE === 'true'
  },

  // Google Maps API
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || 'DEMO_MAPS_KEY_INDIA',
    isMock: !process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY === 'DEMO_MAPS_KEY_INDIA'
  },

  // Platform Defaults (Indian Market)
  platform: {
    currency: 'INR',
    currencySymbol: '₹',
    defaultCommissionRate: 15.0, // 15% platform commission
    emergencyHelpline: '112',
    surgeMultiplier: 1.0,
    searchRadiusKm: 10.0,
    rideOtpLength: 4
  }
};
