import 'dart:async';
import 'dart:math' as math;
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../../rider/models/ride_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/socket_service.dart';
import '../../auth/providers/auth_provider.dart';

class DriverDashboardState {
  final bool isLoading;
  final bool isOnline;
  final LatLng currentDriverLocation;
  final double driverHeading;
  final bool isSimulating;
  final Map<String, dynamic>? driverProfile;
  final Map<String, dynamic>? incomingRequest;
  final int requestTimer;
  final RideModel? currentRide;
  final Map<String, dynamic>? completedSettlement;
  final String? error;

  DriverDashboardState({
    this.isLoading = false,
    this.isOnline = false,
    this.currentDriverLocation = const LatLng(22.7196, 75.8577), // Rajwada Palace, Indore
    this.driverHeading = 0.0,
    this.isSimulating = false,
    this.driverProfile,
    this.incomingRequest,
    this.requestTimer = 30,
    this.currentRide,
    this.completedSettlement,
    this.error,
  });

  DriverDashboardState copyWith({
    bool? isLoading,
    bool? isOnline,
    LatLng? currentDriverLocation,
    double? driverHeading,
    bool? isSimulating,
    Map<String, dynamic>? driverProfile,
    Map<String, dynamic>? incomingRequest,
    int? requestTimer,
    RideModel? currentRide,
    Map<String, dynamic>? completedSettlement,
    String? error,
  }) {
    return DriverDashboardState(
      isLoading: isLoading ?? this.isLoading,
      isOnline: isOnline ?? this.isOnline,
      currentDriverLocation: currentDriverLocation ?? this.currentDriverLocation,
      driverHeading: driverHeading ?? this.driverHeading,
      isSimulating: isSimulating ?? this.isSimulating,
      driverProfile: driverProfile ?? this.driverProfile,
      incomingRequest: incomingRequest,
      requestTimer: requestTimer ?? this.requestTimer,
      currentRide: currentRide,
      completedSettlement: completedSettlement,
      error: error,
    );
  }

  bool get isApproved => driverProfile?['verificationStatus'] == 'APPROVED';
}

class DriverDashboardNotifier extends StateNotifier<DriverDashboardState> {
  final ApiClient _api;
  final SocketService _socket;
  Timer? _countdownTimer;
  Timer? _requestPollTimer;

  DriverDashboardNotifier(this._api, this._socket)
    : super(DriverDashboardState()) {
    _initSocket();
    fetchProfile();
  }

  void _initSocket() {
    _socket.on('new_ride_request', (data) {
      if (state.isOnline &&
          state.currentRide == null &&
          data is Map<String, dynamic>) {
        final rideData = data['ride'];
        if (rideData != null) {
          _startIncomingTimer(rideData);
        }
      }
    });

    _socket.on('ride_status_updated', (data) {
      if (data is Map<String, dynamic> && data['ride'] != null) {
        final updatedRide = RideModel.fromJson(data['ride']);
        if (state.currentRide?.id == updatedRide.id) {
          state = state.copyWith(currentRide: updatedRide);
        }
      }
    });
  }

  void _startIncomingTimer(Map<String, dynamic> req) {
    _countdownTimer?.cancel();
    state = state.copyWith(incomingRequest: req, requestTimer: 30);
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.requestTimer <= 1) {
        timer.cancel();
        state = state.copyWith(incomingRequest: null, requestTimer: 30);
      } else {
        state = state.copyWith(requestTimer: state.requestTimer - 1);
      }
    });
  }

  Future<void> fetchProfile() async {
    try {
      final res = await _api.get(ApiEndpoints.driverProfile);
      if (res.data['success'] == true && res.data['driver'] != null) {
        final d = res.data['driver'];
        RideModel? active;
        if (d['activeRide'] != null) {
          active = RideModel.fromJson(d['activeRide']);
          _socket.joinRide(active.id);
        }
        state = state.copyWith(
          driverProfile: d,
          isOnline: d['isOnline'] == true,
          currentRide: active,
        );
      }
    } catch (_) {}
  }

  Future<bool> updateDriverProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.put(ApiEndpoints.driverProfile, data: data);
      if (res.data['success'] == true && res.data['driver'] != null) {
        state = state.copyWith(
          isLoading: false,
          driverProfile: res.data['driver'],
        );
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }

  Future<bool> toggleOnline() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(
        ApiEndpoints.toggleOnline,
        data: {'isOnline': !state.isOnline, 'lat': 22.7196, 'lng': 75.8577},
      );

      if (res.data['success'] == true) {
        final online = res.data['isOnline'] == true;
        state = state.copyWith(isLoading: false, isOnline: online);
        if (online) {
          _startPollingRequests();
        } else {
          _requestPollTimer?.cancel();
        }
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Cannot toggle online',
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }

  void _startPollingRequests() {
    _requestPollTimer?.cancel();
    _requestPollTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      if (!state.isOnline ||
          state.currentRide != null ||
          state.incomingRequest != null)
        return;
      try {
        final res = await _api.get(ApiEndpoints.nearbyRequests);
        if (res.data['success'] == true &&
            (res.data['requests'] as List).isNotEmpty) {
          final first = res.data['requests'][0];
          _startIncomingTimer(first);
        }
      } catch (_) {}
    });
  }

  Future<bool> acceptRide() async {
    final req = state.incomingRequest;
    if (req == null) return false;

    _countdownTimer?.cancel();
    state = state.copyWith(isLoading: true, error: null);

    try {
      final res = await _api.post(ApiEndpoints.acceptRide(req['id']));
      if (res.data['success'] == true && res.data['ride'] != null) {
        final ride = RideModel.fromJson(res.data['ride']);
        _socket.joinRide(ride.id);
        state = state.copyWith(
          isLoading: false,
          currentRide: ride,
          incomingRequest: null,
        );
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(
        isLoading: false,
        error: msg,
        incomingRequest: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
        incomingRequest: null,
      );
    }
    return false;
  }

  void declineRide() {
    _countdownTimer?.cancel();
    state = state.copyWith(incomingRequest: null, requestTimer: 30);
  }

  Future<bool> markArrived() async {
    final ride = state.currentRide;
    if (ride == null) return false;

    try {
      final res = await _api.post(ApiEndpoints.arrivedAtPickup(ride.id));
      if (res.data['success'] == true && res.data['ride'] != null) {
        state = state.copyWith(
          currentRide: RideModel.fromJson(res.data['ride']),
        );
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<bool> startRideWithOtp(String otp) async {
    final ride = state.currentRide;
    if (ride == null) return false;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(
        ApiEndpoints.startRide(ride.id),
        data: {'otp': otp},
      );
      if (res.data['success'] == true && res.data['ride'] != null) {
        state = state.copyWith(
          isLoading: false,
          currentRide: RideModel.fromJson(res.data['ride']),
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          error: res.data['message'] ?? 'Invalid PIN',
        );
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }

  Future<bool> completeRide() async {
    final ride = state.currentRide;
    if (ride == null) return false;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(ApiEndpoints.completeRide(ride.id));
      if (res.data['success'] == true) {
        state = state.copyWith(
          isLoading: false,
          currentRide: null,
          completedSettlement: {
            'bookingCode': ride.bookingCode,
            'totalFare': ride.totalFare,
            'earnings':
                res.data['earnings'] ??
                ride.driverEarnings ??
                (ride.totalFare * 0.85),
          },
        );
        await fetchProfile();
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, error: msg);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }

  void dismissSettlement() {
    state = state.copyWith(completedSettlement: null);
  }

  Timer? _simulationTimer;

  /// Update live driver location manually or via GPS
  void updateLocation(LatLng newLocation, {double heading = 0.0}) {
    state = state.copyWith(
      currentDriverLocation: newLocation,
      driverHeading: heading,
    );

    // 1. Emit live location over WebSocket (so passenger map sees it immediately)
    final driverId = state.driverProfile?['id']?.toString() ?? '';
    final rideId = state.currentRide?.id;

    _socket.updateDriverLocation(
      driverId: driverId,
      lat: newLocation.latitude,
      lng: newLocation.longitude,
      heading: heading,
      rideId: rideId,
    );

    // 2. Persist to Backend REST API
    _api.post(
      ApiEndpoints.updateLocation,
      data: {
        'lat': newLocation.latitude,
        'lng': newLocation.longitude,
      },
    ).then((_) {}).catchError((_) {});
  }

  /// Start simulated vehicle driving along a polyline road route
  void startRouteSimulation(List<LatLng> routePoints) {
    if (routePoints.isEmpty) return;
    _simulationTimer?.cancel();
    state = state.copyWith(isSimulating: true);
    int index = 0;

    _simulationTimer = Timer.periodic(const Duration(milliseconds: 1500), (timer) {
      if (index >= routePoints.length) {
        timer.cancel();
        state = state.copyWith(isSimulating: false);
        return;
      }
      final pt = routePoints[index];
      double heading = 0.0;
      if (index + 1 < routePoints.length) {
        final next = routePoints[index + 1];
        heading = _calculateBearing(pt, next);
      }
      updateLocation(pt, heading: heading);
      index++;
    });
  }

  void stopRouteSimulation() {
    _simulationTimer?.cancel();
    state = state.copyWith(isSimulating: false);
  }

  double _calculateBearing(LatLng start, LatLng end) {
    final startLat = start.latitude * (math.pi / 180.0);
    final startLng = start.longitude * (math.pi / 180.0);
    final endLat = end.latitude * (math.pi / 180.0);
    final endLng = end.longitude * (math.pi / 180.0);

    final dLng = endLng - startLng;
    final y = math.sin(dLng) * math.cos(endLat);
    final x = math.cos(startLat) * math.sin(endLat) -
        math.sin(startLat) * math.cos(endLat) * math.cos(dLng);

    final brng = math.atan2(y, x);
    return (brng * (180.0 / math.pi) + 360.0) % 360.0;
  }

  @override
  void dispose() {
    _simulationTimer?.cancel();
    _countdownTimer?.cancel();
    _requestPollTimer?.cancel();
    super.dispose();
  }
}

final driverDashboardProvider =
    StateNotifierProvider<DriverDashboardNotifier, DriverDashboardState>((ref) {
      final api = ref.watch(apiClientProvider);
      final socket = ref.watch(socketServiceProvider);
      return DriverDashboardNotifier(api, socket);
    });
