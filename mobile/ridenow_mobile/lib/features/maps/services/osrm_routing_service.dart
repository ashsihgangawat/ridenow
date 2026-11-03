import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/config/environment.dart';

class RouteDetails {
  final double distanceKm;
  final double durationMinutes;
  final List<LatLng> polylinePoints;

  RouteDetails({
    required this.distanceKm,
    required this.durationMinutes,
    required this.polylinePoints,
  });
}

class OsrmRoutingService {
  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(milliseconds: 2500),
      receiveTimeout: const Duration(milliseconds: 2500),
    ),
  );

  Future<RouteDetails> getDrivingRoute(LatLng pickup, LatLng drop) async {
    final url =
        '${EnvironmentConfig.osrmRoutingUrl}/${pickup.longitude},${pickup.latitude};${drop.longitude},${drop.latitude}';

    try {
      final res = await _dio.get(
        url,
        queryParameters: {'overview': 'full', 'geometries': 'geojson'},
      );

      final routes = res.data['routes'] as List?;
      if (routes != null && routes.isNotEmpty) {
        final first = routes[0];
        final distanceMeters = (first['distance'] as num).toDouble();
        final durationSeconds = (first['duration'] as num).toDouble();

        final coords = first['geometry']['coordinates'] as List;
        final points = coords.map((c) {
          return LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble());
        }).toList();

        return RouteDetails(
          distanceKm: (distanceMeters / 1000.0 * 10).round() / 10.0,
          durationMinutes: (durationSeconds / 60.0 * 10).round() / 10.0,
          polylinePoints: points,
        );
      }
    } catch (_) {
      // Fallback direct distance calculation
    }

    const distCalc = Distance();
    final directDistanceMeters = distCalc.as(LengthUnit.Meter, pickup, drop);
    final distanceKm =
        (directDistanceMeters / 1000.0 * 1.3 * 10).round() / 10.0;
    final durationMins = (distanceKm * 2.5).roundToDouble();

    return RouteDetails(
      distanceKm: distanceKm > 0.5 ? distanceKm : 1.2,
      durationMinutes: durationMins > 2 ? durationMins : 5.0,
      polylinePoints: [pickup, drop],
    );
  }
}
