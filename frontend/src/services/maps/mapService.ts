/**
 * RideNow Central MapLibre GL Service
 * Centralizes map initialization, WebGL capability detection, GeoJSON route layer management,
 * and view bounds coordination for OpenFreeMap tiles.
 */

import { Map as MapLibreMap, LngLatBounds, GeoJSONSource, AttributionControl } from 'maplibre-gl';
import { MAP_CONFIG } from './mapConfig';

class MapService {
  /**
   * Detect WebGL support in browser context
   */
  isWebGLSupported(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  }

  /**
   * Instantiate MapLibre GL map container
   */
  createMap(options: {
    container: HTMLElement | string;
    center?: [number, number]; // [lng, lat]
    zoom?: number;
    styleUrl?: string;
    interactive?: boolean;
  }): MapLibreMap {
    const center = options.center || [MAP_CONFIG.DEFAULT_CENTER.lng, MAP_CONFIG.DEFAULT_CENTER.lat];
    const zoom = options.zoom ?? MAP_CONFIG.DEFAULT_ZOOM;
    const style = options.styleUrl || MAP_CONFIG.STYLE_URL;

    const map = new MapLibreMap({
      container: options.container,
      style,
      center,
      zoom,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      pitch: MAP_CONFIG.PITCH,
      bearing: MAP_CONFIG.BEARING,
      interactive: options.interactive !== false,
      attributionControl: false // Custom minimal attribution
    });

    // Add minimal compact attribution in bottom-right
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: '© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> • <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
      }),
      'bottom-right'
    );

    return map;
  }

  /**
   * Fit map viewport smoothly around multiple coordinate points
   */
  fitBoundsToPoints(
    map: MapLibreMap,
    points: [number, number][],
    options: { padding?: number; maxZoom?: number } = {}
  ) {
    if (!map || points.length === 0) return;

    if (points.length === 1) {
      map.easeTo({
        center: points[0],
        zoom: options.maxZoom || 14,
        duration: 800
      });
      return;
    }

    const bounds = new LngLatBounds();
    points.forEach((pt) => {
      if (!isNaN(pt[0]) && !isNaN(pt[1])) {
        bounds.extend(pt);
      }
    });

    map.fitBounds(bounds, {
      padding: options.padding || 70,
      maxZoom: options.maxZoom || 16,
      duration: 1000
    });
  }

  /**
   * Add or update GeoJSON route line on MapLibre map instance
   */
  addOrUpdateRoute(
    map: MapLibreMap,
    coordinates: [number, number][],
    layerId = 'ridenow-route'
  ) {
    if (!map) return;

    const sourceId = `${layerId}-source`;
    const glowLayerId = `${layerId}-glow`;
    const mainLayerId = `${layerId}-main`;

    const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates
      }
    };

    const existingSource = map.getSource(sourceId) as GeoJSONSource;

    if (existingSource) {
      existingSource.setData(geojsonData);
    } else {
      // Add GeoJSON source
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      // 1. Route outer ambient glow layer
      map.addLayer({
        id: glowLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#eab308',
          'line-width': 10,
          'line-opacity': 0.35,
          'line-blur': 3
        }
      });

      // 2. Route core vibrant line layer
      map.addLayer({
        id: mainLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': MAP_CONFIG.ROUTE_STYLE.LINE_COLOR,
          'line-width': MAP_CONFIG.ROUTE_STYLE.LINE_WIDTH,
          'line-opacity': MAP_CONFIG.ROUTE_STYLE.LINE_OPACITY
        }
      });
    }
  }

  /**
   * Remove route layer and source cleanly from map
   */
  removeRoute(map: MapLibreMap, layerId = 'ridenow-route') {
    if (!map) return;
    const sourceId = `${layerId}-source`;
    const glowLayerId = `${layerId}-glow`;
    const mainLayerId = `${layerId}-main`;

    if (map.getLayer(mainLayerId)) map.removeLayer(mainLayerId);
    if (map.getLayer(glowLayerId)) map.removeLayer(glowLayerId);
    if (map.getSource(sourceId)) map.removeSource(sourceId);
  }
}

export const mapService = new MapService();
