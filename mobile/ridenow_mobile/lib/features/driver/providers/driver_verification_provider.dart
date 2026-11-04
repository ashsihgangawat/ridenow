import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';

// Mandatory 7 Verification Documents
const List<String> mandatoryDocTypes = [
  'DRIVING_LICENSE',
  'VEHICLE_RC',
  'VEHICLE_INSURANCE',
  'PUC_CERTIFICATE',
  'IDENTITY_PROOF',
  'DRIVER_SELFIE',
  'VEHICLE_PHOTO'
];

class VerificationDocItem {
  final String documentType;
  final String status; // NOT_UPLOADED, PENDING, APPROVED, REJECTED, EXPIRED
  final String? documentNumber;
  final String? fileUrl;
  final String? fileName;
  final int? fileSize;
  final String? expiryDate;
  final bool isExpired;
  final String? rejectionReason;
  final String? uploadedAt;

  VerificationDocItem({
    required this.documentType,
    required this.status,
    this.documentNumber,
    this.fileUrl,
    this.fileName,
    this.fileSize,
    this.expiryDate,
    this.isExpired = false,
    this.rejectionReason,
    this.uploadedAt,
  });

  factory VerificationDocItem.fromJson(Map<String, dynamic> json) {
    return VerificationDocItem(
      documentType: json['documentType'] ?? '',
      status: json['status'] ?? 'NOT_UPLOADED',
      documentNumber: json['documentNumber'],
      fileUrl: json['fileUrl'],
      fileName: json['fileName'],
      fileSize: json['fileSize'],
      expiryDate: json['expiryDate'],
      isExpired: json['isExpired'] == true,
      rejectionReason: json['rejectionReason'],
      uploadedAt: json['uploadedAt'],
    );
  }

  String get displayName {
    switch (documentType) {
      case 'DRIVING_LICENSE':
        return 'Driving Licence (DL)';
      case 'VEHICLE_RC':
        return 'Registration Certificate (RC)';
      case 'VEHICLE_INSURANCE':
        return 'Vehicle Insurance Policy';
      case 'PUC_CERTIFICATE':
        return 'Pollution Under Control (PUC)';
      case 'IDENTITY_PROOF':
        return 'Identity Proof (Aadhaar / Voter ID)';
      case 'DRIVER_SELFIE':
        return 'Driver Profile Selfie';
      case 'VEHICLE_PHOTO':
        return 'Vehicle Photograph (Front & Plate)';
      default:
        return documentType.replaceAll('_', ' ');
    }
  }

  bool get requiresExpiryDate {
    return documentType == 'DRIVING_LICENSE' ||
        documentType == 'VEHICLE_INSURANCE' ||
        documentType == 'PUC_CERTIFICATE';
  }
}

class DriverVerificationState {
  final bool isLoading;
  final String verificationStatus; // NOT_SUBMITTED, DOCUMENTS_PENDING, UNDER_REVIEW, CORRECTION_REQUIRED, APPROVED, REJECTED, SUSPENDED
  final String? driverId;
  final bool isOnline;
  final bool mobileVerified;
  final bool profileCompleted;
  final bool adminApproved;
  final Map<String, dynamic>? vehicle;
  final List<VerificationDocItem> documents;
  final int totalRequired;
  final int uploadedCount;
  final int approvedCount;
  final int rejectedCount;
  final int expiredCount;
  final int completionPercentage;
  final List<dynamic> auditLogs;
  final String? errorMessage;
  final String? successMessage;

  DriverVerificationState({
    this.isLoading = false,
    this.verificationStatus = 'DOCUMENTS_PENDING',
    this.driverId,
    this.isOnline = false,
    this.mobileVerified = true,
    this.profileCompleted = true,
    this.adminApproved = false,
    this.vehicle,
    this.documents = const [],
    this.totalRequired = 7,
    this.uploadedCount = 0,
    this.approvedCount = 0,
    this.rejectedCount = 0,
    this.expiredCount = 0,
    this.completionPercentage = 0,
    this.auditLogs = const [],
    this.errorMessage,
    this.successMessage,
  });

  DriverVerificationState copyWith({
    bool? isLoading,
    String? verificationStatus,
    String? driverId,
    bool? isOnline,
    bool? mobileVerified,
    bool? profileCompleted,
    bool? adminApproved,
    Map<String, dynamic>? vehicle,
    List<VerificationDocItem>? documents,
    int? totalRequired,
    int? uploadedCount,
    int? approvedCount,
    int? rejectedCount,
    int? expiredCount,
    int? completionPercentage,
    List<dynamic>? auditLogs,
    String? errorMessage,
    String? successMessage,
  }) {
    return DriverVerificationState(
      isLoading: isLoading ?? this.isLoading,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      driverId: driverId ?? this.driverId,
      isOnline: isOnline ?? this.isOnline,
      mobileVerified: mobileVerified ?? this.mobileVerified,
      profileCompleted: profileCompleted ?? this.profileCompleted,
      adminApproved: adminApproved ?? this.adminApproved,
      vehicle: vehicle ?? this.vehicle,
      documents: documents ?? this.documents,
      totalRequired: totalRequired ?? this.totalRequired,
      uploadedCount: uploadedCount ?? this.uploadedCount,
      approvedCount: approvedCount ?? this.approvedCount,
      rejectedCount: rejectedCount ?? this.rejectedCount,
      expiredCount: expiredCount ?? this.expiredCount,
      completionPercentage:
          completionPercentage ?? this.completionPercentage,
      auditLogs: auditLogs ?? this.auditLogs,
      errorMessage: errorMessage,
      successMessage: successMessage,
    );
  }

  bool get isApproved => verificationStatus == 'APPROVED' && adminApproved;
  bool get needsCorrection => verificationStatus == 'CORRECTION_REQUIRED';
  bool get isUnderReview => verificationStatus == 'UNDER_REVIEW';
  bool get isPendingDocuments =>
      verificationStatus == 'DOCUMENTS_PENDING' ||
      verificationStatus == 'NOT_SUBMITTED';
}

final driverVerificationProvider =
    StateNotifierProvider<DriverVerificationNotifier, DriverVerificationState>(
        (ref) {
  final api = ref.watch(apiClientProvider);
  return DriverVerificationNotifier(api, ref);
});

class DriverVerificationNotifier
    extends StateNotifier<DriverVerificationState> {
  final ApiClient _api;
  final Ref _ref;

  DriverVerificationNotifier(this._api, this._ref)
      : super(DriverVerificationState()) {
    fetchVerificationStatus();
  }

  Future<void> fetchVerificationStatus() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.get(ApiEndpoints.driverVerificationStatus);
      if (res.data['success'] == true) {
        final docsList = (res.data['documents'] as List? ?? [])
            .map((e) => VerificationDocItem.fromJson(e as Map<String, dynamic>))
            .toList();

        final stats = res.data['stats'] as Map<String, dynamic>? ?? {};

        state = state.copyWith(
          isLoading: false,
          verificationStatus: res.data['verificationStatus'] ?? 'DOCUMENTS_PENDING',
          driverId: res.data['driverId'],
          isOnline: res.data['isOnline'] == true,
          mobileVerified: res.data['mobileVerified'] != false,
          profileCompleted: res.data['profileCompleted'] != false,
          adminApproved: res.data['adminApproved'] == true,
          vehicle: res.data['vehicle'],
          documents: docsList,
          totalRequired: stats['totalRequired'] ?? 7,
          uploadedCount: stats['uploadedCount'] ?? docsList.where((d) => d.status != 'NOT_UPLOADED').length,
          approvedCount: stats['approvedCount'] ?? docsList.where((d) => d.status == 'APPROVED').length,
          rejectedCount: stats['rejectedCount'] ?? docsList.where((d) => d.status == 'REJECTED').length,
          expiredCount: stats['expiredCount'] ?? docsList.where((d) => d.isExpired).length,
          completionPercentage: stats['completionPercentage'] ?? 0,
          auditLogs: res.data['auditLogs'] as List? ?? [],
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: res.data['message'] ?? 'Failed to load verification status',
        );
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
    }
  }

  // --- 1. Driver Registration (Bike & Car) ---
  Future<bool> registerDriver({
    required String fullName,
    required String phone,
    String? email,
    required String dateOfBirth,
    required String address,
    required String vehicleCategory, // BIKE or CAR
    String? make,
    String? model,
    required String registrationNumber,
    String? color,
    int manufacturingYear = 2024,
    String? profilePhotoUrl,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.driverRegister,
        data: {
          'fullName': fullName,
          'phone': phone,
          'email': email,
          'dateOfBirth': dateOfBirth,
          'address': address,
          'vehicleCategory': vehicleCategory,
          'make': make,
          'model': model,
          'registrationNumber': registrationNumber,
          'color': color,
          'manufacturingYear': manufacturingYear,
          'profilePhotoUrl': profilePhotoUrl,
        },
      );

      if (res.data['success'] == true) {
        final token = res.data['token'];
        final userData = res.data['user'];
        if (token != null && userData != null && userData is Map<String, dynamic>) {
          final user = UserModel.fromJson(userData);
          await _ref.read(authProvider.notifier).setDriverSession(token: token, user: user);
        } else if (token != null) {
          await _ref.read(authProvider.notifier).driverLogin(phone, 'Password@123');
        }
        await fetchVerificationStatus();
        state = state.copyWith(
          isLoading: false,
          successMessage: 'Driver registered successfully. Please upload documents.',
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: res.data['message'] ?? 'Registration failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  // --- 2. Mobile OTP Verification ---
  Future<bool> verifyOtp({
    required String phone,
    required String otp,
    String? firebaseUid,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.driverVerifyOtp,
        data: {
          'phone': phone,
          'otp': otp,
          'firebaseUid': firebaseUid,
        },
      );

      if (res.data['success'] == true) {
        state = state.copyWith(
          isLoading: false,
          mobileVerified: true,
          successMessage: 'Mobile number verified successfully.',
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: res.data['message'] ?? 'OTP verification failed',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  // --- 3. Document Upload with Automatic Validation ---
  Future<bool> uploadDocument({
    required String documentType,
    String? documentNumber,
    required String fileUrl,
    String fileName = 'document.jpg',
    int fileSize = 1048576, // 1MB
    String fileType = 'image/jpeg',
    String? expiryDate,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    // Automatic Client-Side Validation
    if (fileSize > 5 * 1024 * 1024) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'File size exceeds maximum limit of 5MB.',
      );
      return false;
    }

    if (expiryDate != null && expiryDate.isNotEmpty) {
      final now = DateTime.now();
      final todayStr =
          "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
      if (expiryDate.compareTo(todayStr) < 0) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: 'Document has already expired. Please upload a valid active document.',
        );
        return false;
      }
    }

    try {
      final res = await _api.post(
        ApiEndpoints.uploadKycDoc,
        data: {
          'documentType': documentType,
          'documentNumber': documentNumber,
          'fileUrl': fileUrl,
          'fileName': fileName,
          'fileSize': fileSize,
          'fileType': fileType,
          'expiryDate': expiryDate,
        },
      );

      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        state = state.copyWith(
          isLoading: false,
          successMessage: res.data['message'] ?? 'Document uploaded successfully.',
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: res.data['message'] ?? 'Document upload failed',
        );
        return false;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, errorMessage: msg);
      return false;
    } catch (e) {
      state = state.copyWith(isLoading: false, errorMessage: e.toString());
      return false;
    }
  }

  // --- 4. Admin Review Actions ---
  Future<bool> adminApproveDoc(String docId) async {
    try {
      final res = await _api.post(ApiEndpoints.adminApproveDocument(docId));
      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> adminRejectDoc(String docId, String reason) async {
    try {
      final res = await _api.post(
        ApiEndpoints.adminRejectDocument(docId),
        data: {'rejectionReason': reason},
      );
      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> adminApproveDriver(String driverId) async {
    try {
      final res = await _api.post(ApiEndpoints.adminApproveDriver(driverId));
      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> adminRejectDriver(String driverId, String reason) async {
    try {
      final res = await _api.post(
        ApiEndpoints.adminRejectDriver(driverId),
        data: {'rejectionReason': reason},
      );
      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> adminSuspendDriver(String driverId, String reason) async {
    try {
      final res = await _api.post(
        ApiEndpoints.adminSuspendDriver(driverId),
        data: {'suspensionReason': reason},
      );
      if (res.data['success'] == true) {
        await fetchVerificationStatus();
        return true;
      }
    } catch (_) {}
    return false;
  }
}

