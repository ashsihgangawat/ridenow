class ApiEndpoints {
  // Authentication
  static const String riderSignup = '/api/auth/rider/signup';
  static const String riderLogin = '/api/auth/rider/login';
  static const String riderLogout = '/api/auth/rider/logout';

  static const String driverSignup = '/api/auth/driver/signup';
  static const String driverLogin = '/api/auth/driver/login';
  static const String driverLogout = '/api/auth/driver/logout';

  // Rider Endpoints
  static const String customerProfile = '/api/customer/profile';
  static const String fareEstimate = '/api/fare/estimate';
  static const String bookRide = '/api/customer/rides/request';
  static const String rideHistory = '/api/customer/rides/history';
  static String rideDetails(String id) => '/api/customer/rides/$id';
  static String cancelRide(String id) => '/api/customer/rides/$id/cancel';
  static String rateRide(String id) => '/api/customer/rides/$id/rate';
  static const String triggerSos = '/api/customer/rides/sos';

  // Driver Endpoints
  static const String driverProfile = '/api/driver/profile';
  static const String toggleOnline = '/api/driver/toggle-online';
  static const String updateLocation = '/api/driver/location';
  static const String nearbyRequests = '/api/driver/requests';
  static String acceptRide(String id) => '/api/driver/rides/$id/accept';
  static String arrivedAtPickup(String id) => '/api/driver/rides/$id/arrived';
  static String startRide(String id) => '/api/driver/rides/$id/start';
  static String completeRide(String id) => '/api/driver/rides/$id/complete';
  static const String uploadKycDoc = '/api/driver/documents/upload';
  static const String driverEarnings = '/api/driver/earnings';
  static const String driverRegister = '/api/driver/register';
  static const String driverVerifyOtp = '/api/driver/verify-otp';
  static const String driverVerificationStatus = '/api/driver/verification-status';

  // Admin Verification
  static const String adminPendingDrivers = '/api/admin/drivers/pending';
  static const String adminVerificationStats = '/api/admin/verification-stats';
  static String adminDriverDetails(String id) => '/api/admin/driver/$id';
  static String adminApproveDocument(String id) => '/api/admin/document/$id/approve';
  static String adminRejectDocument(String id) => '/api/admin/document/$id/reject';
  static String adminApproveDriver(String id) => '/api/admin/driver/$id/approve';
  static String adminRejectDriver(String id) => '/api/admin/driver/$id/reject';
  static String adminSuspendDriver(String id) => '/api/admin/driver/$id/suspend';

  // Real-Time Chat & Contact
  static String chatMessages(String rideId) => '/api/chat/$rideId/messages';
  static String markChatRead(String rideId) => '/api/chat/$rideId/read';
  static String unreadChatCount(String rideId) =>
      '/api/chat/$rideId/unread-count';
  static String contactDetails(String rideId) => '/api/chat/$rideId/contact';

  // Payments & Settlements (Razorpay & Cash)
  static const String createPaymentOrder = '/api/payments/create-order';
  static const String verifyPayment = '/api/payments/verify';
  static const String confirmCashPayment = '/api/payments/cash';

  // Support & Feedback
  static const String supportTickets = '/api/support/tickets';
  static String supportTicketDetails(String id) => '/api/support/tickets/$id';
  static const String reportComplaint = '/api/support/complaint';

  // Account & Security
  static const String changePassword = '/api/auth/change-password';
  static const String deleteAccountRequest = '/api/customer/delete-account-request';
}
