import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../models/ride_model.dart';
import '../../maps/services/osrm_routing_service.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/socket_service.dart';
import '../../auth/providers/auth_provider.dart';

class RiderBookingState {
  final bool isLoading;
  final LatLng pickupPoint;
  final String pickupAddress;
  final LatLng? dropPoint;
  final String dropAddress;
  final RouteDetails? route;
  final List<Map<String, dynamic>> fareEstimates;
  final String selectedCategory;
  final RideModel? currentRide;
  final LatLng? liveDriverLocation;
  final double driverHeading;
  final String? error;

  RiderBookingState({
    this.isLoading = false,
    this.pickupPoint = const LatLng(22.7196, 75.8577),
    this.pickupAddress = 'Current location',
    this.dropPoint,
    this.dropAddress = '',
    this.route,
    this.fareEstimates = const [],
    this.selectedCategory = 'AUTO',
    this.currentRide,
    this.liveDriverLocation,
    this.driverHeading = 0.0,
    this.error,
  });

  RiderBookingState copyWith({
    bool? isLoading,
    LatLng? pickupPoint,
    String? pickupAddress,
    LatLng? dropPoint,
    String? dropAddress,
    RouteDetails? route,
    List<Map<String, dynamic>>? fareEstimates,
    String? selectedCategory,
    RideModel? currentRide,
    bool clearCurrentRide = false,
    bool clearDropPoint = false,
    LatLng? liveDriverLocation,
    double? driverHeading,
    String? error,
  }) {
    return RiderBookingState(
      isLoading: isLoading ?? this.isLoading,
      pickupPoint: pickupPoint ?? this.pickupPoint,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      dropPoint: clearDropPoint ? null : (dropPoint ?? this.dropPoint),
      dropAddress: clearDropPoint ? '' : (dropAddress ?? this.dropAddress),
      route: clearDropPoint ? null : (route ?? this.route),
      fareEstimates: clearDropPoint ? [] : (fareEstimates ?? this.fareEstimates),
      selectedCategory: selectedCategory ?? this.selectedCategory,
      currentRide: clearCurrentRide ? null : (currentRide ?? this.currentRide),
      liveDriverLocation: clearCurrentRide ? null : (liveDriverLocation ?? this.liveDriverLocation),
      driverHeading: driverHeading ?? this.driverHeading,
      error: error,
    );
  }
}

class RiderBookingNotifier extends StateNotifier<RiderBookingState> {
  final ApiClient _api;
  final SocketService _socket;
  final OsrmRoutingService _routingService = OsrmRoutingService();

  RiderBookingNotifier(this._api, this._socket) : super(RiderBookingState()) {
    _initSocket();
  }

  void _initSocket() {
    _socket.on('ride_accepted', (data) {
      if (data is Map<String, dynamic> && data['ride'] != null) {
        final updatedRide = RideModel.fromJson(data['ride']);
        state = state.copyWith(
          currentRide: updatedRide,
          liveDriverLocation: LatLng(
            (data['driver']?['currentLat'] as num?)?.toDouble() ??
                state.pickupPoint.latitude,
            (data['driver']?['currentLng'] as num?)?.toDouble() ??
                state.pickupPoint.longitude,
          ),
        );
      }
    });

    _socket.on('ride_status_updated', (data) {
      if (data is Map<String, dynamic> && data['ride'] != null) {
        final updatedRide = RideModel.fromJson(data['ride']);
        state = state.copyWith(currentRide: updatedRide);
      }
    });

    _socket.on('driver_location_update', (data) {
      if (data is Map<String, dynamic> &&
          data['lat'] != null &&
          data['lng'] != null) {
        state = state.copyWith(
          liveDriverLocation: LatLng(
            (data['lat'] as num).toDouble(),
            (data['lng'] as num).toDouble(),
          ),
          driverHeading: (data['heading'] as num?)?.toDouble() ?? 0.0,
        );
      }
    });
  }

  void setPickup(LatLng point, String address) {
    state = state.copyWith(pickupPoint: point, pickupAddress: address);
    if (state.dropPoint != null) {
      _calculateRouteAndFares();
    }
  }

  void setDestination(LatLng point, String address) {
    state = state.copyWith(dropPoint: point, dropAddress: address);
    _calculateRouteAndFares();
  }

  void selectCategory(String cat) {
    state = state.copyWith(selectedCategory: cat);
  }

  void clearDestination() {
    state = state.copyWith(clearDropPoint: true);
  }

  Future<void> _calculateRouteAndFares() async {
    final drop = state.dropPoint;
    if (drop == null) return;

    state = state.copyWith(isLoading: true);
    try {
      final route = await _routingService.getDrivingRoute(
        state.pickupPoint,
        drop,
      );

      // Call Backend Fare Engine
      final res = await _api.post(
        ApiEndpoints.fareEstimate,
        data: {
          'pickup': {
            'lat': state.pickupPoint.latitude,
            'lng': state.pickupPoint.longitude,
          },
          'destination': {'lat': drop.latitude, 'lng': drop.longitude},
        },
      );

      List<Map<String, dynamic>> estimates = [];
      if (res.data['success'] == true && res.data['estimates'] is List) {
        estimates = List<Map<String, dynamic>>.from(res.data['estimates']);
      }

      state = state.copyWith(
        isLoading: false,
        route: route,
        fareEstimates: estimates,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> bookRide() async {
    final drop = state.dropPoint;
    if (drop == null) return false;

    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _api.post(
        ApiEndpoints.bookRide,
        data: {
          'pickupAddress': state.pickupAddress,
          'pickupLat': state.pickupPoint.latitude,
          'pickupLng': state.pickupPoint.longitude,
          'dropAddress': state.dropAddress,
          'dropLat': drop.latitude,
          'dropLng': drop.longitude,
          'vehicleCategory': state.selectedCategory,
          'paymentMethod': 'CASH',
        },
      );

      if (res.data['success'] == true && res.data['ride'] != null) {
        final ride = RideModel.fromJson(res.data['ride']);
        _socket.joinRide(ride.id);
        state = state.copyWith(isLoading: false, currentRide: ride);
        return true;
      }
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? e.message ?? e.toString();
      state = state.copyWith(isLoading: false, error: msg.toString());
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
    return false;
  }

  Future<void> refreshRide(String rideId) async {
    try {
      final res = await _api.get(ApiEndpoints.rideDetails(rideId));
      if (res.data['success'] == true && res.data['ride'] != null) {
        final ride = RideModel.fromJson(res.data['ride']);
        state = state.copyWith(currentRide: ride);
      }
    } catch (_) {}
  }

  Future<bool> cancelRide(
    String rideId, [
    String reason = 'Passenger requested',
  ]) async {
    try {
      final res = await _api.post(
        ApiEndpoints.cancelRide(rideId),
        data: {'reason': reason},
      );
      if (res.data['success'] == true) {
        state = state.copyWith(clearCurrentRide: true);
        return true;
      }
    } catch (_) {}
    return false;
  }

  Future<void> submitRating(String rideId, int rating, String feedback) async {
    try {
      await _api.post(
        ApiEndpoints.rateRide(rideId),
        data: {'rating': rating, 'feedback': feedback},
      );
      state = state.copyWith(clearCurrentRide: true);
    } catch (_) {}
  }

  void resetBooking() {
    state = state.copyWith(
      clearCurrentRide: true,
      clearDropPoint: true,
    );
  }
}

final riderBookingProvider =
    StateNotifierProvider<RiderBookingNotifier, RiderBookingState>((ref) {
      final api = ref.watch(apiClientProvider);
      final socket = ref.watch(socketServiceProvider);
      return RiderBookingNotifier(api, socket);
    });
