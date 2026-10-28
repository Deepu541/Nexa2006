import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bike, User, MapPin, ZoomIn, ZoomOut, Navigation, Compass, Loader2 } from 'lucide-react';

interface FreeDeliveryNavMapProps {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  riderProgress: number; // 0 to 100
  onRouteLoaded?: (data: {
    distance: string;
    duration: string;
    steps: Array<{ instructions: string; distance: string; duration: string }>;
    polylineCoords: Array<[number, number]>;
  }) => void;
}

export function FreeDeliveryNavMap({
  startLat,
  startLng,
  endLat,
  endLng,
  riderProgress,
  onRouteLoaded
}: FreeDeliveryNavMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const riderMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);

  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routePolylineCoords, setRoutePolylineCoords] = useState<Array<[number, number]>>([]);

  // Live interpolated rider coordinates mapped along actual streets (if route exists)
  const [liveRiderCoords, setLiveRiderCoords] = useState<[number, number]>([startLat, startLng]);

  // Helper function to extract a coordinate point along the route path based on slide progress
  const getPointAlongPath = (coords: Array<[number, number]>, fraction: number): [number, number] => {
    if (coords.length === 0) return [startLat, startLng];
    if (coords.length === 1) return coords[0];
    if (fraction <= 0) return coords[0];
    if (fraction >= 1) return coords[coords.length - 1];

    const totalSegments = coords.length - 1;
    const targetSegmentIndex = Math.min(totalSegments - 1, Math.floor(fraction * totalSegments));
    const segmentFraction = (fraction * totalSegments) - targetSegmentIndex;

    const [lat1, lng1] = coords[targetSegmentIndex];
    const [lat2, lng2] = coords[targetSegmentIndex + 1];

    return [
      lat1 + (lat2 - lat1) * segmentFraction,
      lng1 + (lng2 - lng1) * segmentFraction
    ];
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: 15,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Fetch Route from OSRM
  useEffect(() => {
    let active = true;
    const fetchOSRMRoute = async () => {
      setLoadingRoute(true);
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`
        );
        if (!response.ok) throw new Error('OSRM router returned error status');
        const data = await response.json();

        if (!active) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          
          // Coordinate coordinates come in [lng, lat] from GeoJSON
          const geojsonCoords: Array<[number, number]> = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );

          setRoutePolylineCoords(geojsonCoords);

          // Format steps for delivery rider HUD guidelines
          const steps = route.legs[0].steps.map((s: any) => {
            let modifier = s.maneuver.modifier || '';
            let instructions = s.maneuver.instruction || '';
            
            // Clean/simplify custom instructions if needed or construct readable lines
            if (!instructions) {
              const streetName = s.name || 'local street';
              if (s.maneuver.type === 'turn') {
                instructions = `Turn ${modifier} onto ${streetName}.`;
              } else if (s.maneuver.type === 'new name') {
                instructions = `Continue ahead on ${streetName}.`;
              } else if (s.maneuver.type === 'arrive') {
                instructions = 'Approach destination on the grid.';
              } else {
                instructions = `Proceed on ${streetName}.`;
              }
            }

            return {
              instructions,
              distance: s.distance > 1000 ? `${(s.distance / 1000).toFixed(1)} KM` : `${Math.round(s.distance)} M`,
              duration: `${Math.ceil(s.duration / 60)} mins`
            };
          });

          const summaryDistance = route.distance > 1000 ? `${(route.distance / 1000).toFixed(1)} KM` : `${Math.round(route.distance)} M`;
          const summaryDuration = `${Math.ceil(route.duration / 60)} mins`;

          if (onRouteLoaded) {
            onRouteLoaded({
              distance: summaryDistance,
              duration: summaryDuration,
              steps,
              polylineCoords: geojsonCoords
            });
          }

          // Render polyline route on the Leaflet map
          if (mapRef.current) {
            if (routePolylineRef.current) {
              routePolylineRef.current.remove();
            }

            const pLine = L.polyline(geojsonCoords, {
              color: '#003B73',
              weight: 5,
              opacity: 0.85,
              dashArray: '10, 10'
            }).addTo(mapRef.current);

            routePolylineRef.current = pLine;

            // Fit map viewport bounds around both coordinates
            mapRef.current.fitBounds(pLine.getBounds(), {
              padding: [50, 50]
            });
          }
        }
      } catch (err) {
        console.error('OSRM route fetch failed, using straight-line backup coordinate mapping:', err);
        // Fallback to basic straight line route
        const fallbackCoords: Array<[number, number]> = [
          [startLat, startLng],
          [endLat, endLng]
        ];
        setRoutePolylineCoords(fallbackCoords);

        if (mapRef.current) {
          if (routePolylineRef.current) routePolylineRef.current.remove();
          const pLine = L.polyline(fallbackCoords, {
            color: '#ee5a24',
            weight: 5,
            opacity: 0.8,
            dashArray: '5, 10'
          }).addTo(mapRef.current);
          routePolylineRef.current = pLine;
          mapRef.current.fitBounds(pLine.getBounds(), { padding: [50, 50] });
        }
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchOSRMRoute();

    return () => {
      active = false;
    };
  }, [startLat, startLng, endLat, endLng]);

  // Handle live updates to rider marker position on moving progress slider
  useEffect(() => {
    const fraction = riderProgress / 100;
    const computedCoords = getPointAlongPath(routePolylineCoords, fraction);
    setLiveRiderCoords(computedCoords);

    if (mapRef.current) {
      // Manage/Update Rider Marker
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng(computedCoords);
      } else {
        const customRiderIcon = L.divIcon({
          className: 'custom-rider-icon',
          html: `<div style="background-color: #003B73; color: white; border: 2px solid white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-start: center; width: 34px; height: 34px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3-4 3"/><path d="M12 14l4-4h3.5l2 2"/></svg>
          </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        riderMarkerRef.current = L.marker(computedCoords, { icon: customRiderIcon }).addTo(mapRef.current);
      }

      // Manage/Update Destination Pin
      if (!destinationMarkerRef.current) {
        const customDestIcon = L.divIcon({
          className: 'custom-destination-icon',
          html: `<div style="background-color: #dd2c00; color: white; border: 2px solid white; border-radius: 50%; padding: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.15); display: flex; align-items: center; justify-start: center; width: 34px; height: 34px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        destinationMarkerRef.current = L.marker([endLat, endLng], { icon: customDestIcon }).addTo(mapRef.current);
      }

      // Smooth pan map to follow the rider as they simulate progress down the road
      if (fraction > 0 && fraction < 1) {
        mapRef.current.panTo(computedCoords);
      }
    }
  }, [riderProgress, routePolylineCoords]);

  // Clear markers on teardown
  useEffect(() => {
    return () => {
      if (riderMarkerRef.current) riderMarkerRef.current.remove();
      if (destinationMarkerRef.current) destinationMarkerRef.current.remove();
      if (routePolylineRef.current) routePolylineRef.current.remove();
    };
  }, []);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapRef.current && routePolylineCoords.length > 0) {
      mapRef.current.setView(liveRiderCoords, 17);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-50">
      {/* Leaflet Map DOM Entry */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />

      {/* Map Side Utility Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-150 flex items-center justify-center text-blue-600 hover:text-blue-700 active:scale-95 transition-all cursor-pointer"
          title="Recenter Rider"
        >
          <Navigation size={18} />
        </button>

        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-150 flex items-center justify-center text-gray-750 hover:text-gray-900 active:scale-95 transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={18} />
        </button>

        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-150 flex items-center justify-center text-gray-750 hover:text-gray-900 active:scale-95 transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {loadingRoute && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-xs flex items-center justify-center z-[1001]">
          <div className="bg-slate-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl border border-white/10">
            <Loader2 className="animate-spin text-orange-550" size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase">Plotting Free OSM Route...</span>
          </div>
        </div>
      )}
    </div>
  );
}
