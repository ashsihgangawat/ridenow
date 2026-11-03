import React, { useState, useEffect, useRef } from 'react';
import { BaseMap } from './BaseMap';
import { PickupMarker } from './PickupMarker';
import { DestinationMarker } from './DestinationMarker';
import { DriverMarker } from './DriverMarker';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import { MapErrorBoundary } from './MapErrorBoundary';
import { routingService, RouteResult } from '../../services/maps/routingService';
import { locationService, LocationCoordinates } from '../../services/maps/locationService';
import { driverTrackingService } from '../../services/maps/driverTrackingService';
import { MAP_CONFIG } from '../../services/maps/mapConfig';
import { useSocket } from '../../context/SocketContext';
import { Map as MapLibreMap } from 'maplibre-gl';
import { Navigation, Clock, ShieldCheck, Power, AlertCircle, Compass } from 'lucide-react';

interface DriverMapProps {
  driverProfile?: any;
  isOnline: boolean;
  activeRide?: any;
  incomingRequest?: any;
  className?: string;
  heightClass?: string;
}

export const DriverMap: React.FC<DriverMapProps> = ({
  driverProfile,
  isOnline,
  activeRide,
  incomingRequest,
  className = '',
  heightClass = 'h-[460px]'
}) => {
  const { socket } = useSocket();
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // Driver GPS coordinates (default Indore center if device GPS unavailable)
  const [driverLocation, setDriverLocation] = useState<LocationCoordinates>(
    locationService.getDefaultLocation()
  );

  const [route, setRoute] = useState<RouteResult | null>(null);

  // Active target coordinates (either incoming request or active ride)
  const targetRide = activeRide || incomingRequest;
  const targetPickup = targetRide
    ? {
        name: targetRide.pickupAddress || 'Pickup Point',
        lat: parseFloat(targetRide.pickupLatitude || targetRide.pickupLat || targetRide.pickup?.lat),
        lng: parseFloat(targetRide.pickupLongitude || targetRide.pickupLng || targetRide.pickup?.lng)
      }
    : null;

  const targetDrop = targetRide
    ? {
        name: targetRide.dropoffAddress || 'Destination',
        lat: parseFloat(targetRide.dropoffLatitude || targetRide.dropLat || targetRide.destination?.lat),
        lng: parseFloat(targetRide.dropoffLongitude || targetRide.dropLng || targetRide.destination?.lng)
      }
    : null;

  // 1. Initialize & watch device GPS position
  useEffect(() => {
    let unwatch: (() => void) | null = null;

    locationService
      .getCurrentPosition()
      .then((pos) => setDriverLocation(pos))
      .catch((e) => console.warn('GPS initial error:', e));

    if (isOnline) {
      unwatch = locationService.watchPosition((pos) => {
        setDriverLocation(pos);

        // Emit throttled socket telemetry to backend
        if (driverProfile?.id) {
          driverTrackingService.emitDriverLocation(
            socket,
            driverProfile.id,
            { lat: pos.lat, lng: pos.lng, heading: pos.heading },
            activeRide?.id
          );
        }
      });
    }

    return () => {
      if (unwatch) unwatch();
    };
  }, [isOnline, driverProfile?.id, activeRide?.id, socket]);

  // 2. Calculate navigation route when assigned a ride
  useEffect(() => {
    if (!targetPickup || isNaN(targetPickup.lat) || isNaN(targetPickup.lng)) {
      setRoute(null);
      return;
    }

    const startCoord =
      activeRide?.status === 'IN_PROGRESS' && targetDrop
        ? { lng: targetPickup.lng, lat: targetPickup.lat } // Route between pickup and drop
        : { lng: driverLocation.lng, lat: driverLocation.lat }; // Route to pickup

    const endCoord =
      activeRide?.status === 'IN_PROGRESS' && targetDrop
        ? { lng: targetDrop.lng, lat: targetDrop.lat }
        : { lng: targetPickup.lng, lat: targetPickup.lat };

    routingService
      .getRoute(startCoord, endCoord)
      .then((res) => setRoute(res))
      .catch((err) => console.warn('Driver navigation route warning:', err));
  }, [
    driverLocation.lat,
    driverLocation.lng,
    targetPickup?.lat,
    targetPickup?.lng,
    targetDrop?.lat,
    targetDrop?.lng,
    activeRide?.status
  ]);

  return (
    <MapErrorBoundary fallbackMessage="Driver Telematics Map Standby. Please retry to load vector tiles.">
      <div className={`relative w-full ${heightClass} ${className} select-none`}>
        <BaseMap
          center={[driverLocation.lng, driverLocation.lat]}
          zoom={14}
          onMapLoad={setMapInstance}
          className="w-full h-full"
        >
          {/* Driver Own Vehicle Marker */}
          <DriverMarker
            lng={driverLocation.lng}
            lat={driverLocation.lat}
            heading={driverLocation.heading || 0}
            driverName={driverProfile?.user?.fullName || 'My Vehicle'}
            vehicleCategory={driverProfile?.vehicle?.category || 'AUTO'}
            vehicleReg={driverProfile?.vehicle?.registrationNumber}
            isOnline={isOnline}
            isAssigned={!!activeRide}
          />

          {/* Ride Pickup Marker */}
          {targetPickup && !isNaN(targetPickup.lat) && (
            <PickupMarker
              lng={targetPickup.lng}
              lat={targetPickup.lat}
              title={`Customer Pickup: ${targetPickup.name}`}
            />
          )}

          {/* Ride Destination Marker */}
          {targetDrop && !isNaN(targetDrop.lat) && (
            <DestinationMarker
              lng={targetDrop.lng}
              lat={targetDrop.lat}
              title={`Customer Drop: ${targetDrop.name}`}
            />
          )}

          {/* Road Navigation Route Layer */}
          {route && <RouteLayer coordinates={route.coordinates} autoFit={true} />}

          {/* Map Controls */}
          <MapControls map={mapInstance} />
        </BaseMap>

        {/* Floating Top Driver Telemetry Badge */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto bg-[#0e0e13]/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl px-3.5 py-2 shadow-neon-yellow flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isOnline ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'
              }`}
            />
            <span className="font-black text-white uppercase tracking-wider">
              {isOnline ? 'Online • GPS Transmitting' : 'Offline Mode'}
            </span>
          </div>

          <div className="w-px h-3.5 bg-neutral-700" />

          <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[11px]">
            <Compass className="w-3.5 h-3.5 text-yellow-400" />
            <span>
              {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Floating Route Directions Banner for active trip */}
        {targetRide && route && (
          <div className="absolute bottom-4 left-4 right-16 z-20 pointer-events-auto bg-[#0e0e13]/95 backdrop-blur-xl border border-yellow-400 rounded-3xl p-3 shadow-neon-yellow flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-yellow-400 text-black font-black">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <p className="font-black text-white truncate max-w-xs sm:max-w-md">
                  {activeRide?.status === 'IN_PROGRESS'
                    ? `Heading to Drop: ${targetDrop?.name || 'Destination'}`
                    : `Pick up Rider: ${targetPickup?.name || 'Customer Point'}`}
                </p>
                <p className="text-[11px] text-yellow-400 font-bold mt-0.5">
                  Road Distance: {route.distanceKm} km • ~{route.durationMinutes} mins
                </p>
              </div>
            </div>

            <span className="text-[10px] bg-yellow-400/20 text-yellow-300 font-extrabold px-2.5 py-1 rounded-full uppercase border border-yellow-400/40 shrink-0">
              {activeRide?.status || 'REQUESTED'}
            </span>
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
};

