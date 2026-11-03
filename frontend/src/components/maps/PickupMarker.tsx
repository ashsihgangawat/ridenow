import React, { useEffect, useRef } from 'react';
import { Marker } from 'maplibre-gl';
import { useMapInstance } from './BaseMap';

interface PickupMarkerProps {
  lng: number;
  lat: number;
  title?: string;
  draggable?: boolean;
  onDragEnd?: (coords: { lng: number; lat: number }) => void;
}

export const PickupMarker: React.FC<PickupMarkerProps> = ({
  lng,
  lat,
  title = 'Pickup Location',
  draggable = false,
  onDragEnd
}) => {
  const { map } = useMapInstance();
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!map || isNaN(lng) || isNaN(lat)) return;

    // Create custom DOM element for pickup pin
    const el = document.createElement('div');
    el.className = 'group relative cursor-pointer';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
        <!-- Pulse radar wave -->
        <span class="absolute w-8 h-8 rounded-full bg-emerald-400/30 animate-ping"></span>
        <!-- Inner ring -->
        <span class="absolute w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400"></span>
        <!-- Pin core -->
        <div class="w-6 h-6 rounded-full bg-emerald-400 text-black flex items-center justify-center shadow-lg border-2 border-black font-black text-[10px]">
          P
        </div>
        <!-- Tooltip -->
        <div class="absolute bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-lg bg-black/90 border border-emerald-400/50 text-[10px] font-bold text-emerald-300 pointer-events-none opacity-90 shadow-md">
          ${title}
        </div>
      </div>
    `;

    const marker = new Marker({
      element: el,
      draggable,
      anchor: 'center'
    })
      .setLngLat([lng, lat])
      .addTo(map);

    if (draggable && onDragEnd) {
      marker.on('dragend', () => {
        const newLngLat = marker.getLngLat();
        onDragEnd({ lng: newLngLat.lng, lat: newLngLat.lat });
      });
    }

    markerRef.current = marker;

    return () => {
      marker.remove();
      markerRef.current = null;
    };
  }, [map]);

  // Update position if coords change
  useEffect(() => {
    if (markerRef.current && !isNaN(lng) && !isNaN(lat)) {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, [lng, lat]);

  return null;
};
