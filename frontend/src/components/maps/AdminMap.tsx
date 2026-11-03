import React, { useState, useEffect } from 'react';
import { BaseMap } from './BaseMap';
import { DriverMarker } from './DriverMarker';
import { PickupMarker } from './PickupMarker';
import { DestinationMarker } from './DestinationMarker';
import { RouteLayer } from './RouteLayer';
import { MapControls } from './MapControls';
import { MapErrorBoundary } from './MapErrorBoundary';
import { useSocket } from '../../context/SocketContext';
import { MAP_CONFIG } from '../../services/maps/mapConfig';
import { Map as MapLibreMap } from 'maplibre-gl';
import {
  Shield,
  Activity,
  Search,
  Filter,
  Car,
  CheckCircle,
  Clock,
  Layers,
  X,
  RefreshCw,
  Phone
} from 'lucide-react';

interface AdminMapProps {
  rides?: any[];
  drivers?: any[];
  token?: string | null;
  className?: string;
  heightClass?: string;
}

export const AdminMap: React.FC<AdminMapProps> = ({
  rides: initialRides = [],
  drivers: initialDrivers = [],
  token,
  className = '',
  heightClass = 'h-[620px]'
}) => {
  const { socket } = useSocket();
  const [mapInstance, setMapInstance] = useState<MapLibreMap | null>(null);

  const [activeRides, setActiveRides] = useState<any[]>(initialRides);
  const [activeDrivers, setActiveDrivers] = useState<any[]>(initialDrivers);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchRideId, setSearchRideId] = useState<string>('');
  const [selectedRide, setSelectedRide] = useState<any | null>(null);

  // Poll or refresh fleet telemetry if token present
  const refreshFleet = async () => {
    if (!token) return;
    try {
      const [ridesRes, driversRes] = await Promise.all([
        fetch('/api/admin/rides', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/drivers', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const ridesData = await ridesRes.json();
      const driversData = await driversRes.json();
      if (ridesData.success && ridesData.rides) setActiveRides(ridesData.rides);
      if (driversData.success && driversData.drivers) setActiveDrivers(driversData.drivers);
    } catch (e) {
      console.warn('Admin map sync warning:', e);
    }
  };

  useEffect(() => {
    refreshFleet();
    const interval = setInterval(refreshFleet, 15000);
    return () => clearInterval(interval);
  }, [token]);

  // Listen for real-time live driver coordinates via socket
  useEffect(() => {
    if (!socket) return;

    socket.emit('join_user', { role: 'SUPER_ADMIN' });

    const handleDriverMoved = (telemetry: any) => {
      setActiveDrivers((prev) =>
        prev.map((d) =>
          d.id === telemetry.driverId
            ? { ...d, currentLat: telemetry.lat, currentLng: telemetry.lng, heading: telemetry.heading }
            : d
        )
      );
    };

    const handleRideEvent = (event: any) => {
      if (event.ride) {
        setActiveRides((prev) => {
          const index = prev.findIndex((r) => r.id === event.ride.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = event.ride;
            return updated;
          }
          return [event.ride, ...prev];
        });
      }
    };

    socket.on('live_driver_moved', handleDriverMoved);
    socket.on('admin_ride_event', handleRideEvent);

    return () => {
      socket.off('live_driver_moved', handleDriverMoved);
      socket.off('admin_ride_event', handleRideEvent);
    };
  }, [socket]);

  // Filter rides based on status and search query
  const filteredRides = activeRides.filter((r) => {
    const matchesFilter = filterStatus === 'ALL' || r.status === filterStatus;
    const matchesSearch =
      !searchRideId ||
      r.id?.toLowerCase().includes(searchRideId.toLowerCase()) ||
      r.bookingCode?.toLowerCase().includes(searchRideId.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <MapErrorBoundary fallbackMessage="Mission Control Telematics Standby. Please retry to load vector tiles.">
      <div className={`relative w-full ${heightClass} ${className} select-none`}>
        <BaseMap
          center={[MAP_CONFIG.DEFAULT_CENTER.lng, MAP_CONFIG.DEFAULT_CENTER.lat]}
          zoom={12}
          onMapLoad={setMapInstance}
          className="w-full h-full"
        >
          {/* Driver Fleet Markers */}
          {activeDrivers.map((driver) => {
            const lat = parseFloat(driver.currentLat || driver.currentLatitude);
            const lng = parseFloat(driver.currentLng || driver.currentLongitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const isAssigned = activeRides.some(
              (r) => r.driverId === driver.id && ['ACCEPTED', 'IN_PROGRESS'].includes(r.status)
            );

            return (
              <DriverMarker
                key={driver.id}
                id={driver.id}
                lng={lng}
                lat={lat}
                heading={driver.heading || 0}
                driverName={driver.user?.fullName || driver.name || 'Partner'}
                vehicleCategory={driver.vehicle?.category || 'AUTO'}
                vehicleReg={driver.vehicle?.registrationNumber}
                rating={driver.rating || 5.0}
                isOnline={driver.isOnline}
                isAssigned={isAssigned}
              />
            );
          })}

          {/* Active Rides Pickup and Drop Pins */}
          {filteredRides.map((ride) => {
            const pLat = parseFloat(ride.pickupLatitude || ride.pickupLat);
            const pLng = parseFloat(ride.pickupLongitude || ride.pickupLng);
            const dLat = parseFloat(ride.dropoffLatitude || ride.dropLat);
            const dLng = parseFloat(ride.dropoffLongitude || ride.dropLng);

            return (
              <React.Fragment key={ride.id}>
                {!isNaN(pLat) && !isNaN(pLng) && (
                  <PickupMarker
                    lng={pLng}
                    lat={pLat}
                    title={`Ride #${ride.bookingCode || ride.id.slice(-4)}: ${ride.pickupAddress || 'Pickup'}`}
                  />
                )}
                {!isNaN(dLat) && !isNaN(dLng) && (
                  <DestinationMarker
                    lng={dLng}
                    lat={dLat}
                    title={`Drop: ${ride.dropoffAddress || 'Destination'}`}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Selected Ride Active Route Highlight */}
          {selectedRide &&
            !isNaN(parseFloat(selectedRide.pickupLongitude)) &&
            !isNaN(parseFloat(selectedRide.dropoffLongitude)) && (
              <RouteLayer
                coordinates={[
                  [parseFloat(selectedRide.pickupLongitude), parseFloat(selectedRide.pickupLatitude)],
                  [parseFloat(selectedRide.dropoffLongitude), parseFloat(selectedRide.dropoffLatitude)]
                ]}
                autoFit={true}
              />
            )}

          <MapControls map={mapInstance} />
        </BaseMap>

        {/* Top Control Overlay: Search & Status Filters */}
        <div className="absolute top-4 left-4 right-16 z-20 pointer-events-auto flex flex-wrap items-center gap-3">
          {/* Search by Ride ID */}
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-2xl px-3.5 py-2 shadow-neon-yellow flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-yellow-400" />
            <input
              type="text"
              value={searchRideId}
              onChange={(e) => setSearchRideId(e.target.value)}
              placeholder="Filter by Ride ID / Code..."
              className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none w-44"
            />
            {searchRideId && (
              <button onClick={() => setSearchRideId('')} className="text-neutral-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-1 shadow-neon-yellow flex items-center gap-1">
            {['ALL', 'REQUESTED', 'ACCEPTED', 'IN_PROGRESS'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                  filterStatus === status
                    ? 'bg-yellow-400 text-black shadow-neon-yellow-sm font-black'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button
            onClick={refreshFleet}
            className="p-2.5 rounded-2xl bg-[#0e0e13]/90 backdrop-blur-xl border border-yellow-500/30 text-yellow-400 hover:bg-neutral-800 shadow-neon-yellow transition"
            title="Refresh Fleet Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Bottom Left: Fleet Metrics Indicator */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-auto bg-[#0e0e13]/95 backdrop-blur-xl border border-yellow-500/30 rounded-2xl px-4 py-2.5 shadow-neon-yellow flex items-center gap-4 text-xs font-bold text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeDrivers.filter((d) => d.isOnline).length} Active Drivers</span>
          </div>
          <div className="w-px h-3.5 bg-neutral-700" />
          <div className="flex items-center gap-2 text-yellow-400">
            <Activity className="w-3.5 h-3.5" />
            <span>{filteredRides.length} Active Rides</span>
          </div>
          <div className="w-px h-3.5 bg-neutral-700" />
          <span className="text-[10px] text-neutral-400 font-mono">OpenFreeMap GIS Live</span>
        </div>

        {/* Selected Ride Detail Slide-out Card */}
        {selectedRide && (
          <div className="absolute top-16 right-4 z-30 pointer-events-auto w-80 bg-[#0e0e13]/95 backdrop-blur-2xl border-2 border-yellow-400 rounded-3xl p-5 shadow-neon-yellow space-y-3 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-black text-white">Ride #{selectedRide.bookingCode}</span>
              <button onClick={() => setSelectedRide(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs space-y-1.5">
              <p className="text-neutral-300">
                Status: <strong className="text-yellow-400">{selectedRide.status}</strong>
              </p>
              <p className="text-neutral-300">
                Fare: <strong>₹{selectedRide.totalFare}</strong>
              </p>
              <p className="text-neutral-400 text-[11px] truncate">
                From: {selectedRide.pickupAddress}
              </p>
              <p className="text-neutral-400 text-[11px] truncate">
                To: {selectedRide.dropoffAddress}
              </p>
            </div>
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
};

