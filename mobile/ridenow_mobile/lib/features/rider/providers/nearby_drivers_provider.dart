import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';
import '../models/nearby_driver_model.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../../auth/providers/auth_provider.dart';

class NearbyDriversState {
  final bool isLoading;
  final List<NearbyDriverModel> drivers;
  final String selectedFilter; // 'ALL' | 'BIKE' | 'AUTO' | 'CAB'
  final String? error;
  final DateTime? lastUpdated;

  const NearbyDriversState({
    this.isLoading = false,
    this.drivers = const [],
    this.selectedFilter = 'ALL',
    this.error,
    this.lastUpdated,
  });

  NearbyDriversState copyWith({
    bool? isLoading,
    List<NearbyDriverModel>? drivers,
    String? selectedFilter,
    String? error,
    DateTime? lastUpdated,
  }) {
    return NearbyDriversState(
      isLoading: isLoading ?? this.isLoading,
      drivers: drivers ?? this.drivers,
      selectedFilter: selectedFilter ?? this.selectedFilter,
      error: error,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  List<NearbyDriverModel> get filteredDrivers {
    if (selectedFilter == 'BIKE') {
      return drivers.where((d) => d.isBike).toList();
    } else if (selectedFilter == 'AUTO') {
      return drivers.where((d) => d.isAuto).toList();
    } else if (selectedFilter == 'CAB') {
      return drivers.where((d) => d.isCar).toList();
    }
    return drivers;
  }
}

class NearbyDriversNotifier extends StateNotifier<NearbyDriversState> {
  final ApiClient _api;
  Timer? _refreshTimer;
  LatLng? _lastLocation;

  NearbyDriversNotifier(this._api) : super(const NearbyDriversState());

  void setFilter(String filter) {
    state = state.copyWith(selectedFilter: filter);
  }

  Future<void> fetchNearbyDrivers({
    required double latitude,
    required double longitude,
    double radiusKm = 5.0,
    bool silent = false,
  }) async {
    _lastLocation = LatLng(latitude, longitude);
    if (!silent && state.drivers.isEmpty) {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final res = await _api.get(
        ApiEndpoints.nearbyDrivers,
        queryParameters: {
          'latitude': latitude,
          'longitude': longitude,
          'radius_km': radiusKm,
        },
      );

      final data = res.data;
      if (data['success'] == true && data['drivers'] != null) {
        final list = (data['drivers'] as List)
            .map((e) => NearbyDriverModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();

        state = state.copyWith(
          isLoading: false,
          drivers: list,
          error: null,
          lastUpdated: DateTime.now(),
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: data['message'] ?? 'Could not fetch nearby drivers',
        );
      }
    } catch (e) {
      // If error occurs and drivers already loaded, keep them
      state = state.copyWith(
        isLoading: false,
        error: state.drivers.isEmpty ? e.toString() : null,
      );
    }
  }

  void startPeriodicUpdates(LatLng location, {double radiusKm = 5.0}) {
    _lastLocation = location;
    _refreshTimer?.cancel();
    fetchNearbyDrivers(
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: radiusKm,
      silent: false,
    );

    // Refresh every 6 seconds as per specifications
    _refreshTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (_lastLocation != null) {
        fetchNearbyDrivers(
          latitude: _lastLocation!.latitude,
          longitude: _lastLocation!.longitude,
          radiusKm: radiusKm,
          silent: true,
        );
      }
    });
  }

  void stopPeriodicUpdates() {
    _refreshTimer?.cancel();
    _refreshTimer = null;
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
}

final nearbyDriversProvider =
    StateNotifierProvider<NearbyDriversNotifier, NearbyDriversState>((ref) {
  final api = ref.watch(apiClientProvider);
  return NearbyDriversNotifier(api);
});

