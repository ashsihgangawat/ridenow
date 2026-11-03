import React, { useEffect } from 'react';
import { useMapInstance } from './BaseMap';
import { mapService } from '../../services/maps/mapService';

interface RouteLayerProps {
  coordinates?: [number, number][]; // Array of [lng, lat]
  layerId?: string;
  autoFit?: boolean;
}

export const RouteLayer: React.FC<RouteLayerProps> = ({
  coordinates,
  layerId = 'ridenow-route',
  autoFit = true
}) => {
  const { map, isLoaded } = useMapInstance();

  useEffect(() => {
    if (!map || !isLoaded) return;

    if (coordinates && coordinates.length > 1) {
      mapService.addOrUpdateRoute(map, coordinates, layerId);

      if (autoFit) {
        mapService.fitBoundsToPoints(map, coordinates, {
          padding: 80,
          maxZoom: 15
        });
      }
    } else {
      mapService.removeRoute(map, layerId);
    }

    return () => {
      if (map) {
        mapService.removeRoute(map, layerId);
      }
    };
  }, [map, isLoaded, coordinates]);

  return null;
};

