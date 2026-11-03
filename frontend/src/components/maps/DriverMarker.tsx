import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'maplibre-gl';
import { useMapInstance } from './BaseMap';
import { driverTrackingService } from '../../services/maps/driverTrackingService';

interface DriverMarkerProps {
  id?: string;
  lng: number;
  lat: number;
  heading?: number;
  driverName?: string;
  vehicleCategory?: string;
  vehicleReg?: string;
  rating?: number;
  isOnline?: boolean;
  isAssigned?: boolean;
  onClick?: () => void;
}

export const DriverMarker: React.FC<DriverMarkerProps> = ({
  id,
  lng,
  lat,
  heading = 0,
  driverName = 'Partner Driver',
  vehicleCategory = 'AUTO',
  vehicleReg,
  rating = 5.0,
  isOnline = true,
  isAssigned = false,
  onClick
}) => {
  const { map } = useMapInstance();
  const markerRef = useRef<Marker | null>(null);
  const prevCoordRef = useRef<[number, number]>([lng, lat]);
  const cancelAnimRef = useRef<(() => void) | null>(null);

  // SVG Vehicle Icons
  const getVehicleSvg = (category: string) => {
    if (category === 'BIKE') {
      return `
        <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/>
          <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
        </svg>
      `;
    }
    if (category === 'AUTO') {
      return `
        <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13V8c0-.7-.4-1.3-1-1.6L14.7 5H9.3L6 6.4C5.4 6.7 5 7.3 5 8v5H3v2h2v3c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-1h8v1c0 .6.4 1 1 1h1c.6 0 1-.4 1-1v-3h2v-2h-2zm-10-6h6l2 2H7l2-2zm-1 8c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm8 0c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1z"/>
        </svg>
      `;
    }
    // Default Sedan / Mini Car
    return `
      <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/>
      </svg>
    `;
  };

  useEffect(() => {
    if (!map || isNaN(lng) || isNaN(lat)) return;

    const el = document.createElement('div');
    el.className = 'cursor-pointer transform -translate-x-1/2 -translate-y-1/2';

    const ringColor = isAssigned
      ? 'border-cyan-400 bg-cyan-400/20'
      : isOnline
      ? 'border-yellow-400 bg-yellow-400/20'
      : 'border-neutral-500 bg-neutral-800/40';

    const badgeColor = isAssigned
      ? 'bg-cyan-400'
      : isOnline
      ? 'bg-yellow-400 shadow-neon-yellow-sm'
      : 'bg-neutral-600';

    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <!-- Ripple wave for active online drivers -->
        ${isOnline ? `<span class="absolute w-10 h-10 rounded-full ${isAssigned ? 'bg-cyan-400/30' : 'bg-yellow-400/30'} animate-ping pointer-events-none"></span>` : ''}
        <!-- Orientation pointer container with rotation -->
        <div id="driver-icon-${id || 'active'}" class="w-8 h-8 rounded-2xl ${badgeColor} border-2 border-black flex items-center justify-center shadow-md transition-transform duration-300" style="transform: rotate(${heading}deg);">
          ${getVehicleSvg(vehicleCategory)}
        </div>
      </div>
    `;

    // Interactive popup with driver metrics
    const popupContent = `
      <div class="p-2.5 text-xs text-white bg-[#0e0e13] rounded-xl border border-yellow-500/30 font-sans shadow-xl">
        <div class="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5 mb-1.5">
          <strong class="text-white text-xs font-black">${driverName}</strong>
          <span class="text-yellow-400 font-bold">★ ${rating.toFixed(1)}</span>
        </div>
        <p class="text-[11px] text-neutral-300 font-semibold">${vehicleCategory} • ${vehicleReg || 'DL Commercial'}</p>
        <span class="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
          isAssigned
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
            : isOnline
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            : 'bg-neutral-800 text-neutral-400'
        }">
          ${isAssigned ? 'ON TRIP' : isOnline ? 'AVAILABLE' : 'OFFLINE'}
        </span>
      </div>
    `;

    const popup = new Popup({
      offset: 15,
      closeButton: false,
      className: 'ridenow-driver-popup'
    }).setHTML(popupContent);

    const marker = new Marker({
      element: el,
      anchor: 'center'
    })
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map);

    if (onClick) {
      el.addEventListener('click', onClick);
    }

    markerRef.current = marker;
    prevCoordRef.current = [lng, lat];

    return () => {
      if (cancelAnimRef.current) cancelAnimRef.current();
      marker.remove();
      markerRef.current = null;
    };
  }, [map]);

  // Smooth position interpolation & heading rotation when coordinates update
  useEffect(() => {
    if (!markerRef.current || isNaN(lng) || isNaN(lat)) return;

    const [prevLng, prevLat] = prevCoordRef.current;
    const distanceDelta = Math.hypot(lng - prevLng, lat - prevLat);

    if (distanceDelta > 0.00005) {
      // Rotate vehicle heading towards travel direction
      const calculatedBearing = heading || driverTrackingService.calculateBearing(prevLat, prevLng, lat, lng);
      const iconEl = document.getElementById(`driver-icon-${id || 'active'}`);
      if (iconEl) {
        iconEl.style.transform = `rotate(${calculatedBearing}deg)`;
      }

      // Smooth step animation
      if (cancelAnimRef.current) cancelAnimRef.current();

      cancelAnimRef.current = driverTrackingService.animateMarkerMovement(
        [prevLng, prevLat],
        [lng, lat],
        900,
        (pos) => {
          if (markerRef.current) {
            markerRef.current.setLngLat(pos);
          }
        }
      );

      prevCoordRef.current = [lng, lat];
    }
  }, [lng, lat, heading]);

  return null;
};
