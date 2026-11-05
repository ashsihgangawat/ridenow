import 'package:latlong2/latlong.dart';

class NearbyDriverModel {
  final String driverId;
  final double latitude;
  final double longitude;
  final double heading;
  final String vehicleType;
  final String vehicleModel;
  final String vehicleNumber;
  final String availabilityStatus;
  final double distanceKm;
  final String lastLocationUpdate;

  const NearbyDriverModel({
    required this.driverId,
    required this.latitude,
    required this.longitude,
    this.heading = 0.0,
    required this.vehicleType,
    required this.vehicleModel,
    required this.vehicleNumber,
    this.availabilityStatus = 'AVAILABLE',
    required this.distanceKm,
    this.lastLocationUpdate = 'RECENT',
  });

  LatLng get location => LatLng(latitude, longitude);

  bool get isBike =>
      vehicleType.toUpperCase() == 'BIKE' ||
      vehicleType.toUpperCase() == 'SCOOTER';

  bool get isAuto =>
      vehicleType.toUpperCase() == 'AUTO' ||
      vehicleType.toUpperCase() == 'RICKSHAW' ||
      vehicleType.toUpperCase() == 'TUKTUK';

  bool get isCar =>
      vehicleType.toUpperCase() == 'MINI' ||
      vehicleType.toUpperCase() == 'SEDAN' ||
      vehicleType.toUpperCase() == 'SUV' ||
      vehicleType.toUpperCase() == 'CAB' ||
      vehicleType.toUpperCase() == 'CAR';

  factory NearbyDriverModel.fromJson(Map<String, dynamic> json) {
    return NearbyDriverModel(
      driverId: json['driverId']?.toString() ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 22.7196,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 75.8577,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      vehicleType: json['vehicleType']?.toString().toUpperCase() ?? 'AUTO',
      vehicleModel: json['vehicleModel']?.toString() ?? 'Standard',
      vehicleNumber: json['vehicleNumber']?.toString() ?? 'MP-09-**-0000',
      availabilityStatus: json['availabilityStatus']?.toString() ?? 'AVAILABLE',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      lastLocationUpdate: json['lastLocationUpdate']?.toString() ?? 'RECENT',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'driverId': driverId,
      'latitude': latitude,
      'longitude': longitude,
      'heading': heading,
      'vehicleType': vehicleType,
      'vehicleModel': vehicleModel,
      'vehicleNumber': vehicleNumber,
      'availabilityStatus': availabilityStatus,
      'distanceKm': distanceKm,
      'lastLocationUpdate': lastLocationUpdate,
    };
  }
}

