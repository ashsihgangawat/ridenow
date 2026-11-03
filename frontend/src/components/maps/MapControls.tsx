import React from 'react';
import { Plus, Minus, Navigation, Crosshair } from 'lucide-react';
import { Map as MapLibreMap } from 'maplibre-gl';
import { locationService } from '../../services/maps/locationService';
import { MAP_CONFIG } from '../../services/maps/mapConfig';

interface MapControlsProps {
  map: MapLibreMap | null;
  onLocateUser?: (coords: { lng: number; lat: number }) => void;
  className?: string;
}

export const MapControls: React.FC<MapControlsProps> = ({ map, onLocateUser, className = '' }) => {
  const [locating, setLocating] = React.useState(false);

  const handleZoomIn = () => {
    if (map) map.zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    if (map) map.zoomOut({ duration: 300 });
  };

  const handleRecenter = () => {
    if (map) {
      map.easeTo({
        center: [MAP_CONFIG.DEFAULT_CENTER.lng, MAP_CONFIG.DEFAULT_CENTER.lat],
        zoom: MAP_CONFIG.DEFAULT_ZOOM,
        pitch: MAP_CONFIG.PITCH,
        bearing: 0,
        duration: 800
      });
    }
  };

  const handleLocateMe = async () => {
    setLocating(true);
    try {
      const pos = await locationService.getCurrentPosition();
      if (map) {
        map.easeTo({
          center: [pos.lng, pos.lat],
          zoom: 15,
          duration: 900
        });
      }
      if (onLocateUser) {
        onLocateUser({ lng: pos.lng, lat: pos.lat });
      }
    } finally {
      setLocating(false);
    }
  };

  return (
    <div
      className={`absolute bottom-6 right-4 z-20 flex flex-col gap-2 ${className}`}
      aria-label="Map Controls"
    >
      {/* My Location Button */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        title="Detect My Location"
        className="w-10 h-10 rounded-2xl bg-[#0e0e13]/90 hover:bg-neutral-800 backdrop-blur-md border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 flex items-center justify-center shadow-lg transition active:scale-95 disabled:opacity-50"
      >
        <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
      </button>

      {/* Recenter Indore Button */}
      <button
        type="button"
        onClick={handleRecenter}
        title="Recenter Map"
        className="w-10 h-10 rounded-2xl bg-[#0e0e13]/90 hover:bg-neutral-800 backdrop-blur-md border border-yellow-500/30 text-neutral-300 hover:text-white flex items-center justify-center shadow-lg transition active:scale-95"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {/* Zoom In & Out Group */}
      <div className="flex flex-col rounded-2xl bg-[#0e0e13]/90 backdrop-blur-md border border-yellow-500/30 shadow-lg overflow-hidden">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 hover:bg-neutral-800 text-neutral-200 hover:text-yellow-400 flex items-center justify-center border-b border-white/10 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 hover:bg-neutral-800 text-neutral-200 hover:text-yellow-400 flex items-center justify-center transition active:scale-95"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

