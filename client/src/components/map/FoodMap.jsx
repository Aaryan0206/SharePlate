import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Clock, MapPin, ArrowRight, Package } from 'lucide-react';
import Badge from '../common/Badge';

// Helper component to handle dynamic map panning/zooming
function MapUpdater({ center, zoom, selectedCoords }) {
  const map = useMap();

  useEffect(() => {
    if (selectedCoords && Array.isArray(selectedCoords) && selectedCoords.length === 2) {
      map.flyTo(selectedCoords, 15, { duration: 1.2 });
    } else if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, zoom || 13);
    }
  }, [center, zoom, selectedCoords, map]);

  return null;
}

// Custom Leaflet DivIcon generators to prevent missing default Leaflet PNG assets
const createFoodMarkerIcon = (isSelected, category) => {
  return L.divIcon({
    className: 'custom-food-marker',
    html: `
      <div style="
        background: ${isSelected ? '#081C15' : '#1B4332'};
        color: white;
        border: 2px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border-radius: 9999px;
        padding: 5px 10px;
        display: flex;
        align-items: center;
        gap: 5px;
        font-family: Inter, sans-serif;
        font-weight: 700;
        font-size: 11px;
        transform: translate(-50%, -50%) scale(${isSelected ? '1.15' : '1'});
        transition: transform 0.2s ease;
        white-space: nowrap;
      ">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #52B788;"></span>
        <span>Food</span>
      </div>
    `,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });
};

const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        transform: translate(-50%, -50%);
      ">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.35);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #1B4332;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export default function FoodMap({
  center = [12.9716, 77.5946], // [latitude, longitude] for Leaflet
  zoom = 13,
  listings = [],
  selectedListing = null,
  onSelectListing,
  userLocation = null,
  radiusKm = 10,
}) {
  // Extract coordinates for selected listing (Leaflet requires [lat, lng])
  let selectedCoords = null;
  if (
    selectedListing?.location?.coordinates &&
    Array.isArray(selectedListing.location.coordinates) &&
    selectedListing.location.coordinates.length === 2
  ) {
    // GeoJSON is [lng, lat]; Leaflet expects [lat, lng]
    selectedCoords = [
      selectedListing.location.coordinates[1],
      selectedListing.location.coordinates[0],
    ];
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-stone-200/90 shadow-subtle z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px]"
        style={{ minHeight: '460px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Dynamic center / flyTo updater */}
        <MapUpdater center={center} zoom={zoom} selectedCoords={selectedCoords} />

        {/* User Search Radius Circle */}
        {userLocation && (
          <>
            <Circle
              center={userLocation}
              radius={radiusKm * 1000} // meters
              pathOptions={{
                color: '#2D6A4F',
                fillColor: '#52B788',
                fillOpacity: 0.1,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />
            <Marker position={userLocation} icon={createUserMarkerIcon()}>
              <Popup>
                <div className="p-1 text-center font-sans">
                  <div className="text-xs font-bold text-forest-900">Your Search Center</div>
                  <div className="text-[11px] text-stone-500">Radius: {radiusKm} km</div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Food Listings Markers */}
        {listings.map((item) => {
          if (
            !item.location ||
            !Array.isArray(item.location.coordinates) ||
            item.location.coordinates.length !== 2
          ) {
            return null;
          }

          // GeoJSON is [lng, lat]; Leaflet position is [lat, lng]
          const [lng, lat] = item.location.coordinates;
          const pos = [lat, lng];
          const isSelected = selectedListing?._id === item._id;

          return (
            <Marker
              key={item._id}
              position={pos}
              icon={createFoodMarkerIcon(isSelected, item.category)}
              eventHandlers={{
                click: () => {
                  if (onSelectListing) onSelectListing(item);
                },
              }}
            >
              <Popup className="custom-food-popup">
                <div className="p-2 space-y-2 font-sans max-w-[220px]">
                  {item.imageUrl && (
                    <div className="h-24 w-full rounded-lg overflow-hidden bg-stone-100">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-forest-800 uppercase">{item.category}</span>
                    {item.distanceKm !== undefined && (
                      <span className="bg-forest-50 text-forest-900 font-semibold px-1.5 py-0.5 rounded">
                        {item.distanceKm} km away
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-charcoal-900 line-clamp-2 leading-snug">
                    {item.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-charcoal-700">
                    <span className="font-bold text-forest-900">
                      {item.quantity} {item.unit}
                    </span>
                    <span className="text-[11px] text-stone-500">
                      {item.status}
                    </span>
                  </div>

                  <div className="pt-1.5 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-500 truncate max-w-[120px]">
                      {item.pickupAddress}
                    </span>
                    <Link
                      to={`/food/${item._id}`}
                      className="text-xs font-bold text-forest-800 hover:text-forest-900 flex items-center gap-0.5"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
