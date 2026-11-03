/**
 * RideNow Geolocation Service
 * Wraps browser navigator.geolocation with accuracy filtering, permission inspection,
 * and graceful fallback to Indore, Madhya Pradesh.
 */

import { MAP_CONFIG } from './mapConfig';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
  source: 'gps' | 'default';
}

class LocationService {
  private watchId: number | null = null;
  private lastPosition: LocationCoordinates | null = null;

  /**
   * Check if browser supports Geolocation API
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'geolocation' in navigator;
  }

  /**
   * Inspect current geolocation permission status
   */
  async getPermissionStatus(): Promise<PermissionState | 'unsupported'> {
    if (!this.isSupported() || !navigator.permissions) return 'unsupported';
    try {
      const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return status.state;
    } catch (_) {
      return 'prompt';
    }
  }

  /**
   * Acquire current device position with fallback
   */
  async getCurrentPosition(): Promise<LocationCoordinates> {
    if (!this.isSupported()) {
      return this.getDefaultLocation();
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[LocationService] Geolocation request timed out, using default center.');
        resolve(this.getDefaultLocation());
      }, 7000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          const coords: LocationCoordinates = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
            source: 'gps'
          };
          this.lastPosition = coords;
          resolve(coords);
        },
        (error) => {
          clearTimeout(timeout);
          console.warn('[LocationService] Geolocation error:', error.message);
          resolve(this.getDefaultLocation());
        },
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 15000
        }
      );
    });
  }

  /**
   * Start continuous location watching (primarily for drivers)
   */
  watchPosition(
    onLocation: (coords: LocationCoordinates) => void,
    onError?: (err: GeolocationPositionError) => void
  ): () => void {
    if (!this.isSupported()) {
      onLocation(this.getDefaultLocation());
      return () => {};
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: LocationCoordinates = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
          source: 'gps'
        };

        // Filter negligible GPS jitter (< 3 meters)
        if (this.lastPosition) {
          const deltaMeters = this.calculateDistanceMeters(
            this.lastPosition.lat,
            this.lastPosition.lng,
            coords.lat,
            coords.lng
          );
          if (deltaMeters < 3) return;
        }

        this.lastPosition = coords;
        onLocation(coords);
      },
      (err) => {
        console.warn('[LocationService] Watch position warning:', err.message);
        if (onError) onError(err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => this.clearWatch();
  }

  /**
   * Stop watching position
   */
  clearWatch() {
    if (this.watchId !== null && typeof window !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Default location: Indore, MP
   */
  getDefaultLocation(): LocationCoordinates {
    return {
      lat: MAP_CONFIG.DEFAULT_CENTER.lat,
      lng: MAP_CONFIG.DEFAULT_CENTER.lng,
      accuracy: 50,
      heading: 0,
      speed: 0,
      timestamp: Date.now(),
      source: 'default'
    };
  }

  /**
   * Haversine distance in meters between two lat/lng pairs
   */
  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const locationService = new LocationService();

