class UserModel {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String role;
  final String status;
  final Map<String, dynamic>? customerProfile;
  final Map<String, dynamic>? driverProfile;

  UserModel({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    required this.role,
    this.status = 'ACTIVE',
    this.customerProfile,
    this.driverProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? '',
      fullName: json['fullName'] ?? '',
      phone: json['phone'] ?? '',
      email: json['email'],
      role: json['role'] ?? 'RIDER',
      status: json['status'] ?? 'ACTIVE',
      customerProfile: json['customerProfile'],
      driverProfile: json['driverProfile'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'phone': phone,
      'email': email,
      'role': role,
      'status': status,
      'customerProfile': customerProfile,
      'driverProfile': driverProfile,
    };
  }

  bool get isDriver => role == 'DRIVER';
  bool get isRider => role == 'RIDER' || role == 'CUSTOMER';
  bool get isApprovedDriver =>
      isDriver && driverProfile?['verificationStatus'] == 'APPROVED';
}

