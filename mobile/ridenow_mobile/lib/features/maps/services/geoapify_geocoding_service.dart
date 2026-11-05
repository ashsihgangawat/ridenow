import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';
import '../../../app/config/environment.dart';
import 'photon_geocoding_service.dart';

class GeoapifyGeocodingService {
  final Dio _dio = Dio(
    BaseOptions(
      connectTimeout: const Duration(milliseconds: 3500),
      receiveTimeout: const Duration(milliseconds: 3500),
    ),
  );

  /// 1. Real-Time Autocomplete API
  /// Returns fast formatted address suggestions with India filtering & proximity bias
  Future<List<GeocodingResult>> autocomplete(
    String query, {
    LatLng? referencePoint,
    int limit = 5,
  }) async {
    final clean = query.trim();
    if (clean.isEmpty) return [];

    // Offline landmark matching for instant response
    final lower = clean.toLowerCase();
    final localMatches = PhotonGeocodingService.fallbackLandmarks.where((l) {
      return l.name.toLowerCase().contains(lower) ||
          l.street.toLowerCase().contains(lower);
    }).toList();

    if (clean.length < 2) return localMatches;

    final ref = referencePoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );

    try {
      final res = await _dio.get(
        EnvironmentConfig.geoapifyAutocompleteUrl,
        queryParameters: {
          'text': clean,
          'limit': limit,
          'format': 'json',
          'apiKey': EnvironmentConfig.geoapifyApiKey,
          'filter': 'countrycode:in',
          'bias': 'proximity:${ref.longitude},${ref.latitude}',
        },
      );

      final results = res.data['results'] as List?;
      if (results != null && results.isNotEmpty) {
        final onlineResults = results.map((r) {
          final lat = (r['lat'] as num).toDouble();
          final lon = (r['lon'] as num).toDouble();
          final name = r['name']?.toString() ??
              r['address_line1']?.toString() ??
              clean;
          final street = r['street']?.toString() ??
              r['address_line2']?.toString() ??
              r['suburb']?.toString() ??
              '';
          final city = r['city']?.toString() ??
              r['state']?.toString() ??
              'Indore';

          return GeocodingResult(
            name: name,
            street: street,
            city: city,
            point: LatLng(lat, lon),
          );
        }).toList();

        // Merge without duplicates
        final all = [...localMatches];
        for (final o in onlineResults) {
          if (!all.any((a) =>
              a.name.toLowerCase() == o.name.toLowerCase() ||
              (a.point.latitude == o.point.latitude &&
                  a.point.longitude == o.point.longitude))) {
            all.add(o);
          }
        }
        return all;
      }
    } catch (_) {
      // Fallback on network timeout
    }

    return localMatches;
  }

  /// 2. Forward Geocoding (Search) API
  /// Finds exact coordinates for a given address string
  Future<List<GeocodingResult>> search(
    String query, {
    LatLng? referencePoint,
  }) async {
    final clean = query.trim();
    if (clean.isEmpty) return [];

    final ref = referencePoint ??
        const LatLng(
          EnvironmentConfig.defaultLatitude,
          EnvironmentConfig.defaultLongitude,
        );

    try {
      final res = await _dio.get(
        EnvironmentConfig.geoapifySearchUrl,
        queryParameters: {
          'text': clean,
          'limit': 5,
          'format': 'json',
          'apiKey': EnvironmentConfig.geoapifyApiKey,
          'filter': 'countrycode:in',
          'bias': 'proximity:${ref.longitude},${ref.latitude}',
        },
      );

      final results = res.data['results'] as List?;
      if (results != null && results.isNotEmpty) {
        return results.map((r) {
          final lat = (r['lat'] as num).toDouble();
          final lon = (r['lon'] as num).toDouble();
          final name = r['name']?.toString() ??
              r['address_line1']?.toString() ??
              clean;
          final street = r['street']?.toString() ??
              r['address_line2']?.toString() ??
              '';
          final city = r['city']?.toString() ?? r['state']?.toString() ?? 'Indore';

          return GeocodingResult(
            name: name,
            street: street,
            city: city,
            point: LatLng(lat, lon),
          );
        }).toList();
      }
    } catch (_) {
      // Fallback to autocomplete / local
    }

    return autocomplete(clean, referencePoint: ref);
  }

  /// 3. Reverse Geocoding API
  /// Converts GPS coordinates into a real formatted human-readable address
  Future<String?> reverseGeocode(LatLng point) async {
    try {
      final res = await _dio.get(
        EnvironmentConfig.geoapifyReverseUrl,
        queryParameters: {
          'lat': point.latitude,
          'lon': point.longitude,
          'format': 'json',
          'apiKey': EnvironmentConfig.geoapifyApiKey,
        },
      );

      final results = res.data['results'] as List?;
      if (results != null && results.isNotEmpty) {
        final first = results[0] as Map<String, dynamic>;
        final line1 = first['address_line1']?.toString() ?? '';
        final line2 = first['address_line2']?.toString() ?? '';
        final formatted = first['formatted']?.toString();

        if (line1.isNotEmpty && line2.isNotEmpty) {
          return '$line1, $line2';
        }
        if (formatted != null && formatted.isNotEmpty) {
          return formatted;
        }
        if (line1.isNotEmpty) {
          return line1;
        }
      }
    } catch (_) {
      // Graceful error handling
    }
    return null;
  }

  /// 4. Resolve Manual Location
  /// Resolves any manually typed text into a GeocodingResult with coordinates
  Future<GeocodingResult> resolveManualLocation(
    String query, {
    bool isDrop = true,
    LatLng? referencePoint,
  }) async {
    final clean = query.trim();
    final defaultIndore = const LatLng(
      EnvironmentConfig.defaultLatitude,
      EnvironmentConfig.defaultLongitude,
    );
    final base = referencePoint ?? defaultIndore;

    if (clean.isEmpty) {
      return GeocodingResult(
        name: isDrop ? 'Drop Location' : 'Pickup Location',
        street: 'Indore',
        city: 'Indore',
        point: base,
      );
    }

    // Try Geoapify Search first
    try {
      final results = await search(clean, referencePoint: base);
      if (results.isNotEmpty) {
        return results.first;
      }
    } catch (_) {}

    // Fallback to Photon service logic for deterministic coordinates
    final photon = PhotonGeocodingService();
    return photon.resolveManualLocation(clean, isDrop: isDrop, referencePoint: base);
  }
}

