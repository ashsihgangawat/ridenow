class RideModel {
  final String id;
  final String bookingCode;
  final String customerId;
  final String? driverId;
  final String vehicleCategory;
  final String pickupAddress;
  final double pickupLat;
  final double pickupLng;
  final String dropAddress;
  final double dropLat;
  final double dropLng;
  final double distanceKm;
  final double durationMinutes;
  final double totalFare;
  final double? driverEarnings;
  final String status;
  final String otp;
  final String paymentMethod;
  final String paymentStatus;
  final Map<String, dynamic>? driver;
  final DateTime createdAt;

  RideModel({
    required this.id,
    required this.bookingCode,
    required this.customerId,
    this.driverId,
    required this.vehicleCategory,
    required this.pickupAddress,
    required this.pickupLat,
    required this.pickupLng,
    required this.dropAddress,
    required this.dropLat,
    required this.dropLng,
    required this.distanceKm,
    required this.durationMinutes,
    required this.totalFare,
    this.driverEarnings,
    required this.status,
    required this.otp,
    this.paymentMethod = 'CASH',
    this.paymentStatus = 'PENDING',
    this.driver,
    required this.createdAt,
  });

  factory RideModel.fromJson(Map<String, dynamic> json) {
    return RideModel(
      id: json['id'] ?? '',
      bookingCode: json['bookingCode'] ?? 'RN-0000',
      customerId: json['customerId'] ?? '',
      driverId: json['driverId'],
      vehicleCategory: json['vehicleCategory'] ?? 'AUTO',
      pickupAddress: json['pickupAddress'] ?? '',
      pickupLat: (json['pickupLat'] as num?)?.toDouble() ?? 22.7196,
      pickupLng: (json['pickupLng'] as num?)?.toDouble() ?? 75.8577,
      dropAddress: json['dropAddress'] ?? '',
      dropLat: (json['dropLat'] as num?)?.toDouble() ?? 22.7533,
      dropLng: (json['dropLng'] as num?)?.toDouble() ?? 75.8937,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 3.5,
      durationMinutes: (json['durationMinutes'] as num?)?.toDouble() ?? 10.0,
      totalFare: (json['totalFare'] as num?)?.toDouble() ?? 75.0,
      driverEarnings: (json['driverEarnings'] as num?)?.toDouble(),
      status: json['status'] ?? 'REQUESTED',
      otp: json['otp'] ?? '1234',
      paymentMethod: json['paymentMethod'] ?? 'CASH',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      driver: json['driver'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

