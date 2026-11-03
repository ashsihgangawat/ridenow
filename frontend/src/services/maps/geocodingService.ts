/**
 * RideNow Geocoding Service
 * Provider abstraction supporting Photon (OSM-based, fast autocompletion)
 * and Nominatim with in-memory caching and offline landmark fallback.
 */

import { MAP_CONFIG, DEFAULT_POPULAR_LANDMARKS } from './mapConfig';

export interface GeocodingResult {
  displayName: string;
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  source: 'photon' | 'nominatim' | 'cache' | 'offline';
}

export interface IGeocodingProvider {
  name: string;
  search(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodingResult[]>;
  reverse(lng: number, lat: number): Promise<string>;
}

/**
 * Photon Geocoding Provider
 * Powered by OpenStreetMap data, allows autocomplete queries without strict 1-req/sec caps
 */
class PhotonProvider implements IGeocodingProvider {
  name = 'photon';

  async search(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodingResult[]> {
    let url = `${MAP_CONFIG.PHOTON_API_URL}?q=${encodeURIComponent(query)}&limit=6`;
    if (proximity) {
      url += `&lat=${proximity.lat}&lon=${proximity.lng}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Photon search failed: ${res.statusText}`);
    const data = await res.json();

    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: any) => {
      const p = f.properties || {};
      const [lng, lat] = f.geometry.coordinates;
      const parts = [p.name, p.street, p.district, p.city || p.county, p.state].filter(Boolean);
      const displayName = parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      return {
        displayName,
        lat,
        lng,
        city: p.city || p.district,
        state: p.state,
        country: p.country,
        source: 'photon'
      };
    });
  }

  async reverse(lng: number, lat: number): Promise<string> {
    const url = `${MAP_CONFIG.PHOTON_API_URL}/reverse?lon=${lng}&lat=${lat}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Photon reverse geocode failed: ${res.statusText}`);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const p = data.features[0].properties || {};
      const parts = [p.name, p.street, p.city || p.district, p.state].filter(Boolean);
      return parts.join(', ') || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

/**
 * Nominatim Provider (OSM Official)
 * Follows OSM usage policy: throttled, proper user-agent, used for precise lookups
 */
class NominatimProvider implements IGeocodingProvider {
  name = 'nominatim';

  async search(query: string): Promise<GeocodingResult[]> {
    const url = `${MAP_CONFIG.NOMINATIM_API_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RideNow-India-Mobility/1.0'
      }
    });
    if (!res.ok) throw new Error(`Nominatim query error: ${res.statusText}`);
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      source: 'nominatim'
    }));
  }

  async reverse(lng: number, lat: number): Promise<string> {
    const url = `${MAP_CONFIG.NOMINATIM_API_URL}/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'RideNow-India-Mobility/1.0'
      }
    });
    if (!res.ok) throw new Error(`Nominatim reverse error: ${res.statusText}`);
    const data = await res.json();
    return data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

/**
 * Geocoding Service orchestrator with caching and graceful offline fallback
 */
class GeocodingService {
  private primaryProvider: IGeocodingProvider = new PhotonProvider();
  private fallbackProvider: IGeocodingProvider = new NominatimProvider();
  private cache = new Map<string, { timestamp: number; results: GeocodingResult[] }>();
  private CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

  /**
   * Set custom geocoding provider if needed in the future
   */
  setProvider(provider: IGeocodingProvider) {
    this.primaryProvider = provider;
  }

  /**
   * Search address query with caching, provider fallback, and offline landmark match
   */
  async search(query: string, proximity?: { lng: number; lat: number }): Promise<GeocodingResult[]> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    // 1. Check in-memory cache
    const cacheKey = `${trimmed}_${proximity ? `${proximity.lng.toFixed(2)},${proximity.lat.toFixed(2)}` : ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results.map((r) => ({ ...r, source: 'cache' }));
    }

    // 2. Try Primary Provider (Photon)
    try {
      const results = await this.primaryProvider.search(query, proximity);
      if (results && results.length > 0) {
        this.cache.set(cacheKey, { timestamp: Date.now(), results });
        return results;
      }
    } catch (err) {
      console.warn('[GeocodingService] Primary provider failed, attempting fallback...', err);
    }

    // 3. Try Fallback Provider (Nominatim)
    try {
      const fallbackResults = await this.fallbackProvider.search(query);
      if (fallbackResults && fallbackResults.length > 0) {
        this.cache.set(cacheKey, { timestamp: Date.now(), results: fallbackResults });
        return fallbackResults;
      }
    } catch (err) {
      console.warn('[GeocodingService] Fallback provider failed, checking local landmarks...', err);
    }

    // 4. Offline Landmark Fallback
    const localMatches = DEFAULT_POPULAR_LANDMARKS.filter(
      (l) => l.name.toLowerCase().includes(trimmed) || l.city.toLowerCase().includes(trimmed)
    ).map((l) => ({
      displayName: l.name,
      lat: l.lat,
      lng: l.lng,
      city: l.city,
      source: 'offline' as const
    }));

    return localMatches;
  }

  /**
   * Reverse geocode coordinates to human-readable address string
   */
  async reverse(lng: number, lat: number): Promise<string> {
    if (isNaN(lng) || isNaN(lat)) return 'Unknown Location';

    const cacheKey = `rev_${lng.toFixed(5)}_${lat.toFixed(5)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.results.length > 0) {
      return cached.results[0].displayName;
    }

    try {
      const addr = await this.primaryProvider.reverse(lng, lat);
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        results: [{ displayName: addr, lat, lng, source: 'cache' }]
      });
      return addr;
    } catch (_) {
      try {
        return await this.fallbackProvider.reverse(lng, lat);
      } catch (e) {
        return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      }
    }
  }

  /**
   * Helper to validate coordinates
   */
  isValidCoordinate(lng: number, lat: number): boolean {
    return (
      typeof lng === 'number' &&
      typeof lat === 'number' &&
      !isNaN(lng) &&
      !isNaN(lat) &&
      lng >= -180 &&
      lng <= 180 &&
      lat >= -90 &&
      lat <= 90
    );
  }
}

export const geocodingService = new GeocodingService();

