import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Rider, Order } from '../../types';
import { ZoomIn, ZoomOut, Navigation, User, Bike, Package, Truck } from 'lucide-react';

interface FreeRadarMapProps {
  currentGPS: { latitude: number; longitude: number } | null;
  activeRiders: Rider[];
  availableOrders: Order[];
  currentDeliveries: Order[];
  mapFilter: 'all' | 'riders' | 'orders';
  onItemSelect: (item: { type: 'self' | 'rider' | 'order'; data: any }) => void;
  myRiderId: string;
  myProfileName?: string;
  myRiderDetails?: { vehiclePlate: string; rating: number; vehicleType: string };
}

export function FreeRadarMap({
  currentGPS,
  activeRiders,
  availableOrders,
  currentDeliveries,
  mapFilter,
  onItemSelect,
  myRiderId,
  myProfileName,
  myRiderDetails
}: FreeRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Keep track of rendered markers so we can clear/re-draw on filter or status changes
  const markersGroupRef = useRef<L.FeatureGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = currentGPS?.latitude || 27.7172;
    const defaultLng = currentGPS?.longitude || 85.3240;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    // Create a feature group for our dynamic markers
    const group = L.featureGroup().addTo(map);
    markersGroupRef.current = group;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync / Re-draw markers when filters or dependencies change
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    // Clear previous ones first
    markersGroupRef.current.clearLayers();

    const group = markersGroupRef.current;

    // 1. Plot My Self Position (Blue with a pulse animation)
    if (currentGPS) {
      const selfIcon = L.divIcon({
        className: 'custom-self-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background-color: #003B73; color: white; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3-4 3"/><path d="M12 14l4-4h3.5l2 2"/></svg>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const m = L.marker([currentGPS.latitude, currentGPS.longitude], { icon: selfIcon })
        .on('click', () => {
          onItemSelect({
            type: 'self',
            data: {
              fullName: myProfileName || 'Me',
              vehiclePlate: myRiderDetails?.vehiclePlate || 'N/A',
              rating: myRiderDetails?.rating || 5.0,
              vehicleType: myRiderDetails?.vehicleType || 'Bike',
              latitude: currentGPS.latitude,
              longitude: currentGPS.longitude
            }
          });
        })
        .addTo(group);
    }

    // 2. Other Approved Field Riders (Orange Bike Markers)
    if (mapFilter !== 'orders') {
      activeRiders
        .filter(r => r.riderId !== myRiderId && r.currentLocation?.latitude && r.currentLocation?.longitude)
        .forEach(r => {
          const lat = r.currentLocation!.latitude;
          const lng = r.currentLocation!.longitude;

          const riderIcon = L.divIcon({
            className: 'custom-rider-marker',
            html: `
              <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #ea580c; color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.15); cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bike"><circle cx="18.5" cy="17.5" r="2.5"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3-4 3"/><path d="M12 14l4-4h3.5l2 2"/></svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([lat, lng], { icon: riderIcon })
            .on('click', () => {
              onItemSelect({ type: 'rider', data: r });
            })
            .addTo(group);
        });
    }

    // 3. Unassigned / Available Open Missions (Emerald Package Markers)
    if (mapFilter !== 'riders') {
      availableOrders
        .filter(o => o.shippingAddress?.latitude && o.shippingAddress?.longitude)
        .forEach(o => {
          const lat = Number(o.shippingAddress.latitude);
          const lng = Number(o.shippingAddress.longitude);

          const orderIcon = L.divIcon({
            className: 'custom-available-order-marker',
            html: `
              <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #059669; color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.15); cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([lat, lng], { icon: orderIcon })
            .on('click', () => {
              onItemSelect({ type: 'order', data: o });
            })
            .addTo(group);
        });

      // 4. Current Personal Active assigned shipments (Indigo Truck Markers)
      currentDeliveries
        .filter(o => o.shippingAddress?.latitude && o.shippingAddress?.longitude)
        .forEach(o => {
          const lat = Number(o.shippingAddress.latitude);
          const lng = Number(o.shippingAddress.longitude);

          const deliveryIcon = L.divIcon({
            className: 'custom-active-order-marker',
            html: `
              <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #4f46e5; color: white; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.15); cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([lat, lng], { icon: deliveryIcon })
            .on('click', () => {
              onItemSelect({ type: 'order', data: o });
            })
            .addTo(group);
        });
    }

    // Auto-fit bounds of all elements if we have multiple items
    if (group.getLayers().length > 0) {
      const bounds = group.getBounds();
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [currentGPS, activeRiders, availableOrders, currentDeliveries, mapFilter]);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapRef.current && currentGPS) {
      mapRef.current.setView([currentGPS.latitude, currentGPS.longitude], 15);
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      
      {/* Map Sider Zoom Controller Actions */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          disabled={!currentGPS}
          className="w-10 h-10 bg-white rounded-xl shadow-md border border-gray-150 flex items-center justify-center text-[#003B73] hover:text-[#00274c] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          title="Recenter Map"
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
    </div>
  );
}
