/**
 * RideNow Routing Service
 * Computes real road geometry, actual driving distance, and estimated travel duration
 * utilizing the OSRM (Open Source Routing Machine) engine with caching and cancellation.
 */

import { MAP_CONFIG } from './mapConfig';

export interface RouteResult {
  coordinates: [number, number][]; // Array of [lng, lat]
  distanceKm: number;              // Actual road distance in kilometers
  durationMinutes: number;         // Travel duration in minutes
  geometry: GeoJSON.LineString;    // GeoJSON LineString geometry
  summary?: string;
  source: 'osrm' | 'cache' | 'simulated_fallback';
  error?: string;
}

class RoutingService {
  private cache = new Map<string, { timestamp: number; route: RouteResult }>();
  private activeAbortController: AbortController | null = null;

  /**
   * Calculate true road route between pickup and destination coordinates
   */
  async getRoute(
    origin: { lng: number; lat: number },
    destination: { lng: number; lat: number },
    signal?: AbortSignal
  ): Promise<RouteResult> {
    // 1. Validate inputs
    if (
      !origin ||
      !destination ||
      isNaN(origin.lng) ||
      isNaN(origin.lat) ||
      isNaN(destination.lng) ||
      isNaN(destination.lat)
    ) {
      throw new Error('Invalid coordinates provided for route calculation.');
    }

    // Identical start & end check
    if (
      Math.abs(origin.lng - destination.lng) < 0.0001 &&
      Math.abs(origin.lat - destination.lat) < 0.0001
    ) {
      return {
        coordinates: [
          [origin.lng, origin.lat],
          [destination.lng, destination.lat]
        ],
        distanceKm: 0.1,
        durationMinutes: 1,
        geometry: {
          type: 'LineString',
          coordinates: [
            [origin.lng, origin.lat],
            [destination.lng, destination.lat]
          ]
        },
        source: 'osrm'
      };
    }

    // 2. Check in-memory cache
    const cacheKey = `${origin.lng.toFixed(4)},${origin.lat.toFixed(4)}->${destination.lng.toFixed(4)},${destination.lat.toFixed(4)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < MAP_CONFIG.ROUTE_CACHE_MAX_AGE_MS) {
      return { ...cached.route, source: 'cache' };
    }

    // 3. Cancel any previous in-flight request if not externally passed
    if (!signal) {
      if (this.activeAbortController) {
        this.activeAbortController.abort();
      }
      this.activeAbortController = new AbortController();
      signal = this.activeAbortController.signal;
    }

    // 4. Query OSRM Driving Engine
    // URL format: /route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson
    const url = `${MAP_CONFIG.OSRM_ROUTER_URL}/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&steps=false`;

    try {
      const response = await fetch(url, { signal });
      if (!response.ok) {
        throw new Error(`Routing server error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(data.message || 'No viable driving route found between these points.');
      }

      const primaryRoute = data.routes[0];
      const distanceKm = parseFloat((primaryRoute.distance / 1000).toFixed(2));
      const durationMinutes = Math.max(1, Math.round(primaryRoute.duration / 60));
      const coordinates = primaryRoute.geometry.coordinates as [number, number][];

      const result: RouteResult = {
        coordinates,
        distanceKm,
        durationMinutes,
        geometry: {
          type: 'LineString',
          coordinates
        },
        summary: primaryRoute.legs?.[0]?.summary || 'Via Main Road',
        source: 'osrm'
      };

      // Store in cache
      this.cache.set(cacheKey, { timestamp: Date.now(), route: result });
      return result;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw err;
      }
      console.warn('[RoutingService] OSRM routing failed, applying road-adjusted estimation...', err);

      // Construct a multi-point road-adjusted path so the map still draws an informative route
      const fallback = this.generateFallbackRoute(origin, destination);
      this.cache.set(cacheKey, { timestamp: Date.now(), route: fallback });
      return fallback;
    }
  }

  /**
   * Generates a road-like path with realistic Manhattan/arterial road curves
   * and 1.35x realistic city detour factor when external OSRM is offline.
   */
  private generateFallbackRoute(
    origin: { lng: number; lat: number },
    destination: { lng: number; lat: number }
  ): RouteResult {
    // Haversine base distance
    const R = 6371; // Earth radius in km
    const dLat = ((destination.lat - origin.lat) * Math.PI) / 180;
    const dLon = ((destination.lng - origin.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((origin.lat * Math.PI) / 180) *
        Math.cos((destination.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightKm = R * c;

    // Real city driving factor is approx 1.35x straight line
    const roadDistanceKm = parseFloat(Math.max(1.0, straightKm * 1.35).toFixed(2));
    // Average urban Indian speed ~ 25 km/h
    const durationMinutes = Math.max(3, Math.round((roadDistanceKm / 25) * 60));

    // Interpolate 5 intermediate road waypoints with minor lateral jitter to mimic city streets
    const coords: [number, number][] = [[origin.lng, origin.lat]];
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const fraction = i / steps;
      // Linear interpolation
      let lat = origin.lat + (destination.lat - origin.lat) * fraction;
      let lng = origin.lng + (destination.lng - origin.lng) * fraction;

      // Add gentle orthogonal shift simulating grid navigation
      const orthogonalLat = -(destination.lng - origin.lng) * 0.12 * Math.sin(fraction * Math.PI);
      const orthogonalLng = (destination.lat - origin.lat) * 0.12 * Math.sin(fraction * Math.PI);

      coords.push([lng + orthogonalLng, lat + orthogonalLat]);
    }
    coords.push([destination.lng, destination.lat]);

    return {
      coordinates: coords,
      distanceKm: roadDistanceKm,
      durationMinutes,
      geometry: {
        type: 'LineString',
        coordinates: coords
      },
      summary: 'Estimated Road Network',
      source: 'simulated_fallback'
    };
  }

  /**
   * Clear route cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const routingService = new RoutingService();

