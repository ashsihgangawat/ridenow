import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/socket_service.dart';
import '../../../core/storage/storage_service.dart';

// Dependency Providers
final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError(
    'StorageService must be overridden in ProviderScope',
  );
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiClient(storage);
});

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

// Auth State
class AuthState {
  final bool isLoading;
  final UserModel? user;
  final String? token;
  final String activePortal; // 'RIDER' | 'DRIVER' | 'GATEWAY'
  final String? errorMessage;

  AuthState({
    this.isLoading = false,
    this.user,
    this.token,
    this.activePortal = 'GATEWAY',
    this.errorMessage,
  });

  AuthState copyWith({
    bool? isLoading,
    UserModel? user,
    String? token,
    String? activePortal,
    String? errorMessage,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      token: token ?? this.token,
      activePortal: activePortal ?? this.activePortal,
      errorMessage: errorMessage,
    );
  }

  bool get isAuthenticated => token != null && user != null;
}

// Auth Notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  final StorageService _storage;
  final SocketService _socket;

  AuthNotifier(this._api, this._storage, this._socket) : super(AuthState()) {
    _loadInitialSession();
  }

  void _loadInitialSession() {
    final portal = _storage.getActivePortal();
    String? token;
    if (portal == 'DRIVER') {
      token = _storage.getDriverToken();
    } else if (portal == 'RIDER') {
      token = _storage.getRiderToken();
    }

    final userJson = _storage.getUser();
    if (token != null && userJson != null) {
      final user = UserModel.fromJson(userJson);
      state = state.copyWith(token: token, user: user, activePortal: portal);
      _socket.connect(
        userId: user.id,
        role: user.role,
        driverId: user.driverProfile?['id'],
      );
    }
  }

  void switchPortal(String portal) {
    _storage.setActivePortal(portal);
    state = state.copyWith(activePortal: portal, errorMessage: null);
  }

  // --- RIDER AUTH ---
  Future<bool> riderLogin(String identifier, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.riderLogin,
        data: {'identifier': identifier, 'password': password},
      );

      final data = res.data;
      if (data['success'] == true && data['token'] != null) {
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user']);
        await _storage.saveRiderToken(token);
        await _storage.saveUser(user.toJson());
        await _storage.setActivePortal('RIDER');

        state = state.copyWith(
          isLoading: false,
          token: token,
          user: user,
          activePortal: 'RIDER',
        );

        _socket.connect(userId: user.id, role: user.role);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Login failed',
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

  Future<bool> riderSignup({
    required String fullName,
    required String phone,
    String? email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.riderSignup,
        data: {
          'fullName': fullName,
          'phone': phone,
          if (email != null && email.isNotEmpty) 'email': email,
          'password': password,
        },
      );

      final data = res.data;
      if (data['success'] == true && data['token'] != null) {
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user']);
        await _storage.saveRiderToken(token);
        await _storage.saveUser(user.toJson());
        await _storage.setActivePortal('RIDER');

        state = state.copyWith(
          isLoading: false,
          token: token,
          user: user,
          activePortal: 'RIDER',
        );

        _socket.connect(userId: user.id, role: user.role);
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Registration failed',
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

  // --- DRIVER AUTH ---
  Future<bool> driverLogin(String identifier, String password) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.driverLogin,
        data: {'identifier': identifier, 'password': password},
      );

      final data = res.data;
      if (data['success'] == true && data['token'] != null) {
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user']);
        await _storage.saveDriverToken(token);
        await _storage.saveUser(user.toJson());
        await _storage.setActivePortal('DRIVER');

        state = state.copyWith(
          isLoading: false,
          token: token,
          user: user,
          activePortal: 'DRIVER',
        );

        _socket.connect(
          userId: user.id,
          role: user.role,
          driverId: user.driverProfile?['id'],
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Driver partner login failed',
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

  Future<bool> driverSignup({
    required String fullName,
    required String phone,
    String? email,
    required String password,
    required String vehicleCategory,
    String? vehicleMake,
    String? vehicleModel,
    String? vehicleNumber,
    String? licenseNumber,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final res = await _api.post(
        ApiEndpoints.driverSignup,
        data: {
          'fullName': fullName,
          'phone': phone,
          if (email != null && email.isNotEmpty) 'email': email,
          'password': password,
          'vehicleCategory': vehicleCategory,
          'vehicleMake': vehicleMake ?? 'Bajaj',
          'vehicleModel': vehicleModel ?? 'Compact RE',
          'vehicleNumber': vehicleNumber ?? 'MP-09-RN-9999',
          'licenseNumber': licenseNumber ?? 'DL-042024-9999',
        },
      );

      final data = res.data;
      if (data['success'] == true && data['token'] != null) {
        final token = data['token'] as String;
        final user = UserModel.fromJson(data['user']);
        await _storage.saveDriverToken(token);
        await _storage.saveUser(user.toJson());
        await _storage.setActivePortal('DRIVER');

        state = state.copyWith(
          isLoading: false,
          token: token,
          user: user,
          activePortal: 'DRIVER',
        );

        _socket.connect(
          userId: user.id,
          role: user.role,
          driverId: user.driverProfile?['id'],
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: data['message'] ?? 'Driver signup failed',
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

  // --- LOGOUT ---
  Future<void> logout() async {
    final portal = state.activePortal;
    try {
      if (portal == 'DRIVER') {
        await _api.post(ApiEndpoints.driverLogout);
        await _storage.clearDriverSession();
      } else {
        await _api.post(ApiEndpoints.riderLogout);
        await _storage.clearRiderSession();
      }
    } catch (_) {}

    _socket.disconnect();
    state = AuthState(activePortal: 'GATEWAY');
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  final socket = ref.watch(socketServiceProvider);
  return AuthNotifier(api, storage, socket);
});
