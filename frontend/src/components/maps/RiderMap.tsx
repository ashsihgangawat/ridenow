import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BaseMap } from './BaseMap';
import { PickupMarker } from './PickupMarker';
import { DestinationMarker } from './DestinationMarker';
import { DriverMarker } from './DriverMarker';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import { MapErrorBoundary } from './MapErrorBoundary';
import { routingService, RouteResult } from '../../services/maps/routingService';
import { geocodingService, GeocodingResult } from '../../services/maps/geocodingService';
import { locationService } from '../../services/maps/locationService';
import { MAP_CONFIG } from '../../services/maps/mapConfig';
import { Map as MapLibreMap } from 'maplibre-gl';
import {
  MapPin,
  Navigation,
  Search,
  Clock,
  Tag,
  AlertCircle,
  Loader2,
  CheckCircle2,
  X
} from 'lucide-react';

export interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

interface RiderMapProps {
  pickup?: LocationPoint;
  destination?: LocationPoint;
  onPickupChange?: (point: LocationPoint) => void;
  onDestinationChange?: (point: LocationPoint) => void;
  onRouteChange?: (route: { distanceKm: number; durationMinutes: number }) => void;
  driverLocation?: { lat: number; lng: number; heading?: number };
  activeRide?: any;
  className?: string;
  heightClass?: string;
}

export const RiderMap: React.FC<RiderMapProps> = ({
  pickup,
  destination,
  onPickupChange,
  onDestinationChange,
  onRouteChange,
  driverLocation,
  activeRide,
  className = '',
  heightClass = 'h-[460px]'
}) => {
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  // Fallback defaults to Indore
  const currentPickup = pickup || {
    name: 'Rajwada Palace, Indore',
    lat: MAP_CONFIG.DEFAULT_CENTER.lat,
    lng: MAP_CONFIG.DEFAULT_CENTER.lng
  };

  const currentDestination = destination || {
    name: 'Vijay Nagar Square, Indore',
    lat: 22.7533,
    lng: 75.8937
  };

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Search autocomplete states
  const [searchTarget, setSearchTarget] = useState<'pickup' | 'destination' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  // Simulated nearby available drivers around pickup
  const [nearbyDrivers, setNearbyDrivers] = useState<
    { id: string; lat: number; lng: number; category: string; rating: number }[]
  >([]);

  // Calculate nearby drivers around pickup
  useEffect(() => {
    if (!currentPickup || isNaN(currentPickup.lat) || isNaN(currentPickup.lng)) return;

    const baseLat = currentPickup.lat;
    const baseLng = currentPickup.lng;

    const drivers = [
      { id: 'd1', lat: baseLat + 0.0042, lng: baseLng - 0.0035, category: 'AUTO', rating: 4.9 },
      { id: 'd2', lat: baseLat - 0.0038, lng: baseLng + 0.0048, category: 'MINI', rating: 4.8 },
      { id: 'd3', lat: baseLat + 0.0065, lng: baseLng + 0.0022, category: 'SEDAN', rating: 5.0 },
      { id: 'd4', lat: baseLat - 0.0025, lng: baseLng - 0.0055, category: 'BIKE', rating: 4.7 }
    ];
    setNearbyDrivers(drivers);
  }, [currentPickup.lat, currentPickup.lng]);

  // Recalculate true road route whenever pickup or destination changes
  useEffect(() => {
    if (
      !currentPickup ||
      !currentDestination ||
      isNaN(currentPickup.lat) ||
      isNaN(currentDestination.lat)
    ) {
      return;
    }

    let isMounted = true;
    setRouteLoading(true);
    setRouteError(null);

    routingService
      .getRoute(
        { lng: currentPickup.lng, lat: currentPickup.lat },
        { lng: currentDestination.lng, lat: currentDestination.lat }
      )
      .then((res) => {
        if (!isMounted) return;
        setRoute(res);
        setRouteLoading(false);
        if (onRouteChange) {
          onRouteChange({
            distanceKm: res.distanceKm,
            durationMinutes: res.durationMinutes
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setRouteLoading(false);
        setRouteError(err.message || 'Could not map a road route.');
      });

    return () => {
      isMounted = false;
    };
  }, [currentPickup.lat, currentPickup.lng, currentDestination.lat, currentDestination.lng]);

  // Search input debouncer
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const proximity = currentPickup
          ? { lng: currentPickup.lng, lat: currentPickup.lat }
          : { lng: MAP_CONFIG.DEFAULT_CENTER.lng, lat: MAP_CONFIG.DEFAULT_CENTER.lat };
        const results = await geocodingService.search(val, proximity);
        setSearchResults(results);
      } catch (err) {
        console.warn('Geocoding error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, MAP_CONFIG.SEARCH_DEBOUNCE_MS);
  };

  const handleSelectResult = (result: GeocodingResult) => {
    const point: LocationPoint = {
      name: result.displayName,
      lat: result.lat,
      lng: result.lng
    };

    if (searchTarget === 'pickup' && onPickupChange) {
      onPickupChange(point);
    } else if (searchTarget === 'destination' && onDestinationChange) {
      onDestinationChange(point);
    }

    // Pan map to new location
    if (mapInstance) {
      mapInstance.easeTo({
        center: [point.lng, point.lat],
        zoom: 14,
        duration: 800
      });
    }

    setSearchTarget(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Map Click handler (selects pickup if none, else updates destination)
  const handleMapClick = async ({ lng, lat }: { lng: number; lat: number }) => {
    const address = await geocodingService.reverse(lng, lat);
    if (!destination && onDestinationChange) {
      onDestinationChange({ name: address, lat, lng });
    } else if (onPickupChange) {
      // Toggle updating destination
      if (onDestinationChange) {
        onDestinationChange({ name: address, lat, lng });
      }
    }
  };

  return (
    <MapErrorBoundary fallbackMessage="Vector street map standby. Please retry to load OpenFreeMap vector tiles.">
      <div className={`relative w-full ${heightClass} ${className} select-none`}>
        {/* Base Map Container */}
        <BaseMap
          center={[currentPickup.lng, currentPickup.lat]}
          zoom={13}
          onMapLoad={setMapInstance}
          onClick={handleMapClick}
          className="w-full h-full"
        >
          {/* Pickup Marker */}
          {currentPickup && (
            <PickupMarker
              lng={currentPickup.lng}
              lat={currentPickup.lat}
              title={currentPickup.name}
              draggable={true}
              onDragEnd={async ({ lng, lat }) => {
                const name = await geocodingService.reverse(lng, lat);
                if (onPickupChange) onPickupChange({ name, lat, lng });
              }}
            />
          )}

          {/* Destination Marker */}
          {currentDestination && (
            <DestinationMarker
              lng={currentDestination.lng}
              lat={currentDestination.lat}
              title={currentDestination.name}
              draggable={true}
              onDragEnd={async ({ lng, lat }) => {
                const name = await geocodingService.reverse(lng, lat);
                if (onDestinationChange) onDestinationChange({ name, lat, lng });
              }}
            />
          )}

          {/* Road Route Layer */}
          {route && <RouteLayer coordinates={route.coordinates} autoFit={true} />}

          {/* Live Assigned Driver Marker (during active ride) */}
          {driverLocation && (
            <DriverMarker
              lng={driverLocation.lng}
              lat={driverLocation.lat}
              heading={driverLocation.heading || 0}
              driverName={activeRide?.driver?.fullName || 'Assigned Driver'}
              vehicleCategory={activeRide?.vehicleCategory || 'AUTO'}
              vehicleReg={activeRide?.driver?.vehicle?.registrationNumber}
              isAssigned={true}
            />
          )}

          {/* Nearby Available Drivers (when waiting or booking) */}
          {!driverLocation &&
            nearbyDrivers.map((d) => (
              <DriverMarker
                key={d.id}
                id={d.id}
                lng={d.lng}
                lat={d.lat}
                vehicleCategory={d.category}
                rating={d.rating}
                isOnline={true}
                isAssigned={false}
              />
            ))}

          {/* Custom Map Controls */}
          <MapControls
            map={mapInstance}
            onLocateUser={async ({ lng, lat }) => {
              const name = await geocodingService.reverse(lng, lat);
              if (onPickupChange) onPickupChange({ name, lat, lng });
            }}
          />
        </BaseMap>

        {/* Top Floating Search Bar / Location Summary Pill */}
        <div className="absolute top-4 left-4 right-4 z-20 max-w-lg pointer-events-auto">
          {searchTarget === null ? (
            <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-2.5 shadow-neon-yellow flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 truncate">
                <button
                  type="button"
                  onClick={() => setSearchTarget('pickup')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 font-bold truncate transition"
                  title="Search Pickup Location"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate max-w-[140px]">{currentPickup.name}</span>
                </button>
                <span className="text-neutral-500 font-bold">→</span>
                <button
                  type="button"
                  onClick={() => setSearchTarget('destination')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 border border-red-500/30 text-red-300 hover:border-red-400 font-bold truncate transition"
                  title="Search Destination Location"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-red-400" />
                  <span className="truncate max-w-[140px]">{currentDestination.name}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSearchTarget('destination')}
                className="p-1.5 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 transition shrink-0"
                title="Search Address"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Open Search Modal / Dropdown */
            <div className="bg-[#0e0e13]/95 backdrop-blur-2xl border-2 border-yellow-400 rounded-3xl p-3 shadow-neon-yellow space-y-2 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center gap-2 px-2 border-b border-neutral-800 pb-2">
                <Search className="w-4 h-4 text-yellow-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={`Search ${searchTarget === 'pickup' ? 'pickup location' : 'drop destination'} in Indore, Delhi, etc...`}
                  className="w-full bg-transparent text-xs font-semibold text-white placeholder-neutral-500 focus:outline-none"
                />
                {searchLoading && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />}
                <button
                  onClick={() => {
                    setSearchTarget(null);
                    setSearchQuery('');
                  }}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestions List */}
              {searchResults.length > 0 && (
                <div className="max-h-56 overflow-y-auto space-y-1 pt-1">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(res)}
                      className="w-full text-left p-2 rounded-xl hover:bg-yellow-400/10 hover:border-yellow-400/40 border border-transparent text-xs flex items-start gap-2 text-neutral-200 transition"
                    >
                      <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{res.displayName}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">
                          {res.city ? `${res.city} • ` : ''}
                          {res.lat.toFixed(4)}, {res.lng.toFixed(4)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Route Telemetry Pill */}
        {route && (
          <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-[#0e0e13]/90 backdrop-blur-md border border-yellow-500/30 rounded-2xl px-3.5 py-2 shadow-neon-yellow flex items-center gap-4 text-xs font-bold text-white">
            <div className="flex items-center gap-1.5 text-yellow-400">
              <Navigation className="w-4 h-4" />
              <span>{route.distanceKm} km</span>
            </div>
            <div className="w-px h-4 bg-neutral-700" />
            <div className="flex items-center gap-1.5 text-neutral-300">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span>~{route.durationMinutes} mins</span>
            </div>
            {route.source === 'simulated_fallback' && (
              <span className="text-[10px] text-amber-400 font-normal">(Estimated)</span>
            )}
          </div>
        )}

        {/* Route Calculation Error Alert */}
        {routeError && (
          <div className="absolute bottom-4 left-4 z-20 bg-red-950/80 border border-red-500/40 rounded-2xl px-3 py-1.5 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{routeError}</span>
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
};

