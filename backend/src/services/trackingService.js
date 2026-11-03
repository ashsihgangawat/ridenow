import { db } from './db.js';

export class TrackingService {
  /**
   * Calculate Haversine distance in kilometers between two GPS coordinates
   */
  static calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Find nearby online, verified drivers for a category within radiusKm
   */
  static findNearbyDrivers(pickupLat, pickupLng, category = null, maxRadiusKm = 10) {
    const drivers = db.driverProfiles.findMany({
      where: {
        isOnline: true,
        verificationStatus: 'APPROVED'
      }
    });

    const results = [];
    for (const driver of drivers) {
      if (!driver.currentLat || !driver.currentLng) continue;

      // Check vehicle category
      const vehicle = db.vehicles.findFirst({
        where: { driverId: driver.id, isActive: true }
      });

      if (category && vehicle && vehicle.category !== category) {
        continue;
      }

      const dist = this.calculateDistanceKm(pickupLat, pickupLng, driver.currentLat, driver.currentLng);
      if (dist <= maxRadiusKm) {
        const user = db.users.findUnique({ where: { id: driver.userId } });
        results.push({
          driverId: driver.id,
          userId: driver.userId,
          name: user ? user.fullName : 'Driver',
          phone: user ? user.phone : '',
          rating: driver.rating,
          totalTrips: driver.totalTrips,
          currentLat: driver.currentLat,
          currentLng: driver.currentLng,
          distanceKm: dist,
          etaMinutes: Math.max(2, Math.round(dist * 3)),
          vehicle: vehicle ? {
            category: vehicle.category,
            make: vehicle.make,
            model: vehicle.model,
            registrationNumber: vehicle.registrationNumber,
            color: vehicle.color
          } : null
        });
      }
    }

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Update Driver Live Location
   */
  static updateDriverLocation(driverId, lat, lng) {
    return db.driverProfiles.update({
      where: { id: driverId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastLatitude: lat,
        lastLongitude: lng,
        lastLocationUpdate: new Date().toISOString()
      }
    });
  }

  /**
   * Interpolate step coordinates between start and end (for smooth map animation)
   */
  static getRouteCoordinates(startLat, startLng, endLat, endLng, steps = 10) {
    const coords = [];
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      // Add slight jitter for natural road curvature simulation
      const curve = Math.sin(ratio * Math.PI) * 0.002;
      coords.push({
        lat: startLat + (endLat - startLat) * ratio + curve,
        lng: startLng + (endLng - startLng) * ratio - curve,
        step: i
      });
    }
    return coords;
  }
}

