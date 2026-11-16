import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { MapPin, Search, CheckCircle2, AlertCircle, Crosshair } from 'lucide-react';

// Custom Pin Icon
const pinIcon = L.divIcon({
  className: 'location-picker-pin',
  html: `
    <div style="
      background: #1B4332;
      color: white;
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) translate(-10px, -10px);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 10px; height: 10px; border-radius: 50%; background: #D8F3DC; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map Click Handler component
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Center Repositioner
function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2) {
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialCoordinates = [77.5946, 12.9716], // [longitude, latitude] GeoJSON
  initialAddress = '',
  onConfirmCoordinates,
}) {
  // Leaflet expects [latitude, longitude]
  const [latLng, setLatLng] = useState([
    initialCoordinates[1] || 12.9716,
    initialCoordinates[0] || 77.5946,
  ]);
  const [addressInput, setAddressInput] = useState(initialAddress);
  const [geocodingLoading, setGeocodingLoading] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState('');
  const [geocodeSuccess, setGeocodeSuccess] = useState(false);

  useEffect(() => {
    if (initialCoordinates && initialCoordinates.length === 2) {
      setLatLng([initialCoordinates[1], initialCoordinates[0]]);
    }
    if (initialAddress) {
      setAddressInput(initialAddress);
    }
  }, [initialCoordinates, initialAddress, isOpen]);

  // Geocode address via backend endpoint
  const handleGeocode = async (e) => {
    if (e) e.preventDefault();
    if (!addressInput.trim() || addressInput.trim().length < 3) {
      setGeocodeMessage('Please enter at least 3 characters for the address.');
      setGeocodeSuccess(false);
      return;
    }

    setGeocodingLoading(true);
    setGeocodeMessage('');
    try {
      const res = await fetch(`/api/food/geocode?address=${encodeURIComponent(addressInput.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.coordinates)) {
        // GeoJSON: [longitude, latitude] -> Leaflet: [lat, lng]
        const [lon, lat] = data.coordinates;
        setLatLng([lat, lon]);
        setGeocodeSuccess(true);
        setGeocodeMessage(`Address located: ${data.displayName || 'Exact point matched'}`);
      } else {
        setGeocodeSuccess(false);
        setGeocodeMessage(
          data.message || 'Could not automatically geocode address. Please click on the map to set pickup point manually.'
        );
      }
    } catch (err) {
      setGeocodeSuccess(false);
      setGeocodeMessage('Geocoding service unavailable. Click directly on the map to place the pin.');
    } finally {
      setGeocodingLoading(false);
    }
  };

  const handleConfirm = () => {
    // Return GeoJSON format: [longitude, latitude]
    const geoJsonCoords = [latLng[1], latLng[0]];
    if (onConfirmCoordinates) {
      onConfirmCoordinates(geoJsonCoords);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select Exact Pickup Location on Map" maxWidth="max-w-3xl">
      <div className="space-y-4">
        
        {/* Address lookup row */}
        <form onSubmit={handleGeocode} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter pickup address, facility, or landmark..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="submit"
            loading={geocodingLoading}
            icon={Search}
          >
            Locate Address
          </Button>
        </form>

        {/* Feedback message */}
        {geocodeMessage && (
          <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
            geocodeSuccess ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            {geocodeSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />}
            <span className="leading-tight">{geocodeMessage}</span>
          </div>
        )}

        {/* Instructions banner */}
        <div className="flex items-center justify-between text-xs text-charcoal-600 bg-cream-50 p-2.5 rounded-xl border border-cream-200">
          <span className="flex items-center gap-1.5 font-medium">
            <Crosshair className="w-3.5 h-3.5 text-forest-700" />
            Click anywhere on the map to adjust or fine-tune your pickup marker.
          </span>
          <span className="font-mono text-[11px] font-bold text-forest-900 bg-white px-2 py-0.5 rounded border border-stone-200">
            [{latLng[1].toFixed(5)}, {latLng[0].toFixed(5)}]
          </span>
        </div>

        {/* Leaflet Picker Map */}
        <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-stone-200 z-0">
          <MapContainer
            center={latLng}
            zoom={14}
            scrollWheelZoom={true}
            className="w-full h-full"
            style={{ height: '100%', minHeight: '280px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRecenter center={latLng} />
            <MapClickHandler onLocationChange={setLatLng} />
            <Marker position={latLng} icon={pinIcon} />
          </MapContainer>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
          <div className="text-xs text-stone-500">
            Coordinates stored in GeoJSON format: <code className="font-mono text-forest-800">[longitude, latitude]</code>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" icon={CheckCircle2} onClick={handleConfirm}>
              Confirm Pickup Point
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
