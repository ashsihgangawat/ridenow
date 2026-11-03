/**
 * RideNow Driver Tracking & Telemetry Service
 * Manages smooth marker interpolation, bearing computation, and throttled socket telemetry.
 */

import { Socket } from 'socket.io-client';
import { MAP_CONFIG } from './mapConfig';

export interface DriverTelemetry {
  driverId: string;
  lat: number;
  lng: number;
  heading: number;
  speed?: number;
  rideId?: string;
  isOnline?: boolean;
  vehicleCategory?: string;
  driverName?: string;
  rating?: number;
  timestamp: number;
}

class DriverTrackingService {
  private lastSentTime = 0;

  /**
   * Calculate angle / compass bearing from origin to destination coordinate
   */
  calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number): number {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x =
      Math.cos(startLatRad) * Math.sin(destLatRad) -
      Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);

    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  /**
   * Driver client emits throttled live GPS coordinates to Socket.IO and REST API
   */
  emitDriverLocation(
    socket: Socket | null,
    driverId: string,
    coords: { lat: number; lng: number; heading?: number | null },
    rideId?: string
  ) {
    const now = Date.now();
    if (now - this.lastSentTime < MAP_CONFIG.GPS_UPDATE_THROTTLE_MS) {
      return; // Throttled to prevent flooding
    }
    this.lastSentTime = now;

    if (socket && socket.connected) {
      socket.emit('update_driver_location', {
        driverId,
        lat: coords.lat,
        lng: coords.lng,
        heading: coords.heading || 0,
        rideId,
        timestamp: now
      });
    }
  }

  /**
   * Animate a marker position smoothly from start coordinate to end coordinate over durationMs
   */
  animateMarkerMovement(
    start: [number, number],
    end: [number, number],
    durationMs = 1200,
    onStep: (pos: [number, number], progress: number) => void
  ): () => void {
    let animId: number;
    const startTime = performance.now();

    const frame = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentLng = start[0] + (end[0] - start[0]) * ease;
      const currentLat = start[1] + (end[1] - start[1]) * ease;

      onStep([currentLng, currentLat], progress);

      if (progress < 1) {
        animId = requestAnimationFrame(frame);
      }
    };

    animId = requestAnimationFrame(frame);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }
}

export const driverTrackingService = new DriverTrackingService();

