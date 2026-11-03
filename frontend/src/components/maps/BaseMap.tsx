import React, { useEffect, useRef, useState, createContext, useContext } from 'react';
import { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { mapService } from '../../services/maps/mapService';
import { MAP_CONFIG } from '../../services/maps/mapConfig';
import { Cpu, AlertCircle, RefreshCw } from 'lucide-react';

interface MapContextType {
  map: MapLibreMap | null;
  isLoaded: boolean;
}

export const MapContext = createContext<MapContextType>({
  map: null,
  isLoaded: false
});

export const useMapInstance = () => useContext(MapContext);

interface BaseMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  interactive?: boolean;
  className?: string;
  onMapLoad?: (map: MapLibreMap) => void;
  onClick?: (coords: { lng: number; lat: number }) => void;
  children?: React.ReactNode;
}

export const BaseMap: React.FC<BaseMapProps> = ({
  center = [MAP_CONFIG.DEFAULT_CENTER.lng, MAP_CONFIG.DEFAULT_CENTER.lat],
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  interactive = true,
  className = 'w-full h-full min-h-[400px]',
  onMapLoad,
  onClick,
  children
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. WebGL Support Verification
    if (!mapService.isWebGLSupported()) {
      setErrorMsg(
        'WebGL is not accelerated in your browser. OpenFreeMap vector rendering requires WebGL acceleration.'
      );
      return;
    }

    let mapInstance: MapLibreMap | null = null;
    let isMounted = true;

    try {
      mapInstance = mapService.createMap({
        container: containerRef.current,
        center,
        zoom,
        interactive,
        styleUrl: retryCount > 0 ? MAP_CONFIG.FALLBACK_STYLE_URL : MAP_CONFIG.STYLE_URL
      });

      mapRef.current = mapInstance;

      mapInstance.on('load', () => {
        if (!isMounted) return;
        setIsLoaded(true);
        setErrorMsg(null);
        if (onMapLoad && mapInstance) {
          onMapLoad(mapInstance);
        }
      });

      mapInstance.on('error', (e) => {
        // Filter benign abort or font glyph warnings
        if (e?.error?.message?.includes('abort') || e?.error?.message?.includes('cancelled')) {
          return;
        }
        console.warn('[BaseMap] MapLibre tile notice:', e?.error?.message || e);
      });

      if (onClick) {
        mapInstance.on('click', (e) => {
          onClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
        });
      }
    } catch (err: any) {
      console.error('[BaseMap] Initialization failed:', err);
      if (isMounted) {
        setErrorMsg(err.message || 'Failed to initialize vector map engine.');
      }
    }

    // Cleanup lifecycle
    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (_) {}
      }
      mapRef.current = null;
      setIsLoaded(false);
    };
  }, [retryCount]);

  // Handle center updates smoothly if map is already initialized
  useEffect(() => {
    if (mapRef.current && isLoaded && center && !isNaN(center[0]) && !isNaN(center[1])) {
      const currentCenter = mapRef.current.getCenter();
      const dist = Math.hypot(currentCenter.lng - center[0], currentCenter.lat - center[1]);
      if (dist > 0.0001) {
        mapRef.current.easeTo({
          center,
          duration: 600
        });
      }
    }
  }, [center?.[0], center?.[1], isLoaded]);

  const handleRetry = () => {
    setErrorMsg(null);
    setRetryCount((prev) => prev + 1);
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-[#09090c] border border-yellow-500/20 ${className}`}>
      {/* MapLibre DOM Node */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {!isLoaded && !errorMsg && (
        <div className="absolute inset-0 bg-[#09090c]/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3.5 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 mb-3 animate-bounce">
            <Cpu className="w-7 h-7" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-white">
            Connecting OpenFreeMap Tiles...
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 font-mono">
            Liberty Vector Style • Indore, India
          </p>
        </div>
      )}

      {/* Error Fallback Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 bg-[#0b0b0e]/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
          <h4 className="text-sm font-black text-white">Map Engine Notice</h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">{errorMsg}</p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl shadow-neon-yellow transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Map Layer</span>
          </button>
        </div>
      )}

      {/* Context Provider for child markers & controls */}
      <MapContext.Provider value={{ map: mapRef.current, isLoaded }}>
        {children}
      </MapContext.Provider>
    </div>
  );
};
