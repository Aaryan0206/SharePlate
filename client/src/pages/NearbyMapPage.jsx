import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Navigation, 
  Layers, 
  Compass, 
  Clock, 
  ShieldCheck,
  Sparkles,
  Database,
  Search,
  Crosshair,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  Package
} from 'lucide-react';
import FoodMap from '../components/map/FoodMap';
import FoodCard from '../components/listings/FoodCard';
import FoodDetailModal from '../components/listings/FoodDetailModal';
import ClaimPortionModal from '../components/listings/ClaimPortionModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

// Location presets for demo & testing
const LOCATION_PRESETS = [
  { name: 'Metro Central (MG Rd)', coords: [77.5946, 12.9716] },
  { name: 'Indiranagar 100ft Rd', coords: [77.6408, 12.9784] },
  { name: 'Koramangala 5th Block', coords: [77.6200, 12.9352] },
  { name: 'Whitefield ITPL', coords: [77.7499, 12.9698] },
];

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'cooked meals', label: 'Cooked Meals' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'fruits and vegetables', label: 'Fruits & Veggies' },
  { id: 'packaged food', label: 'Packaged Food' },
  { id: 'groceries', label: 'Groceries' },
];

export default function NearbyMapPage() {
  // GeoJSON anchor: [longitude, latitude]
  const [anchorCoords, setAnchorCoords] = useState([77.5946, 12.9716]);
  const [anchorName, setAnchorName] = useState('Metro Central (MG Rd)');
  const [radiusKm, setRadiusKm] = useState(5);
  const [category, setCategory] = useState('all');
  const [searchAddress, setSearchAddress] = useState('');
  
  // Data states
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState(null);
  const [geoNotice, setGeoNotice] = useState('');
  
  // Selection states
  const [selectedListing, setSelectedListing] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [claimListing, setClaimListing] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Fetch nearby listings from backend
  const fetchNearbyListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        longitude: anchorCoords[0].toString(),
        latitude: anchorCoords[1].toString(),
        radiusKm: radiusKm.toString(),
      });

      if (category && category !== 'all') {
        params.append('category', category);
      }

      const res = await fetch(`/api/food/nearby?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to query nearby food listings');
      }

      setListings(data.listings || []);
      // Auto-select first item if current selection not in new results
      if (data.listings && data.listings.length > 0) {
        setSelectedListing((prev) => {
          const exists = data.listings.find((l) => l._id === prev?._id);
          return exists ? prev : data.listings[0];
        });
      } else {
        setSelectedListing(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [anchorCoords, radiusKm, category]);

  useEffect(() => {
    fetchNearbyListings();
  }, [fetchNearbyListings]);

  // Geolocation API handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoNotice('Geolocation is not supported by your current browser.');
      return;
    }

    setGeoNotice('Detecting GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setAnchorCoords(coords);
        setAnchorName('My Current Location (GPS)');
        setGeoNotice(`Locked onto GPS coordinates: [${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}]`);
        setTimeout(() => setGeoNotice(''), 4000);
      },
      (err) => {
        setGeoNotice(`Could not retrieve location: ${err.message}. Using default anchor.`);
        setTimeout(() => setGeoNotice(''), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Address search via backend Nominatim geocoder
  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchAddress.trim() || searchAddress.trim().length < 3) return;

    setGeocoding(true);
    setGeoNotice('');
    try {
      const res = await fetch(`/api/food/geocode?address=${encodeURIComponent(searchAddress.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.coordinates)) {
        setAnchorCoords(data.coordinates);
        setAnchorName(data.displayName ? data.displayName.slice(0, 35) + '...' : searchAddress);
        setGeoNotice(`Map centered on: ${data.displayName || searchAddress}`);
        setTimeout(() => setGeoNotice(''), 4000);
      } else {
        setGeoNotice(data.message || 'Could not locate address. Try another query.');
      }
    } catch (err) {
      setGeoNotice('Geocoding service unavailable. Using current location.');
    } finally {
      setGeocoding(false);
    }
  };

  // Select preset
  const handlePresetSelect = (preset) => {
    setAnchorCoords(preset.coords);
    setAnchorName(preset.name);
  };

  // Leaflet expects [latitude, longitude]
  const leafletCenter = [anchorCoords[1], anchorCoords[0]];

  return (
    <div className="py-8 bg-cream-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Phase Header Banner */}
        <div className="p-5 bg-forest-900 text-white rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-forest-800 flex items-center justify-center text-sage-300 flex-shrink-0 shadow-inner">
              <Compass className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sage-300 uppercase tracking-wider">
                  MongoDB Geospatial Engine &bull; Live Discovery
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Interactive Food Rescue Map & Geospatial Search
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sage-300 font-mono bg-forest-800/80 px-3 py-1.5 rounded-xl border border-forest-700">
              MongoDB 2dsphere &bull; $near
            </span>
            <Badge variant="sage" size="md">
              Live Map
            </Badge>
          </div>
        </div>

        {/* Location & Radius Control Panel */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-subtle space-y-4">
          
          {/* Top Row: Address search + My Location */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Geocode Address Search */}
            <form onSubmit={handleAddressSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search any neighborhood, campus, or landmark (e.g. Indiranagar, MG Road, Koramangala)..."
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 bg-cream-50/40"
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                type="submit"
                loading={geocoding}
                icon={Search}
              >
                Locate
              </Button>
            </form>

            {/* GPS Geolocation Button */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseMyLocation}
                icon={Crosshair}
                className="whitespace-nowrap"
              >
                Use My GPS Location
              </Button>
            </div>
          </div>

          {/* Notice Banner */}
          {geoNotice && (
            <div className="p-2.5 rounded-xl text-xs bg-forest-50 text-forest-900 border border-forest-200 flex items-center gap-2 animate-in fade-in duration-200">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{geoNotice}</span>
            </div>
          )}

          {/* Second Row: Location Presets & Radius Selectors */}
          <div className="pt-3 border-t border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Location presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-stone-500 font-medium mr-1 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-forest-700" />
                Presets:
              </span>
              {LOCATION_PRESETS.map((preset) => {
                const isActive = anchorCoords[0] === preset.coords[0] && anchorCoords[1] === preset.coords[1];
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-forest-800 text-white shadow-xs'
                        : 'bg-stone-100 text-charcoal-700 hover:bg-stone-200/70'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Radius selector buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500 font-medium">Radius:</span>
              {[1, 3, 5, 10, 25, 50].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    radiusKm === r
                      ? 'bg-forest-800 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>

          </div>

          {/* Third Row: Category Filter Pills */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-stone-500 font-medium mr-1">Category:</span>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    category === cat.id
                      ? 'bg-forest-700 text-white shadow-xs'
                      : 'bg-cream-100/70 text-charcoal-700 hover:bg-cream-200/80 border border-stone-200/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Active Anchor Coordinates Badge */}
            <div className="text-xs text-stone-500 flex items-center gap-2">
              <span className="font-medium text-charcoal-800">Anchor:</span>
              <span className="font-mono text-[11px] bg-stone-100 px-2 py-0.5 rounded text-forest-900 font-bold border border-stone-200">
                [{anchorCoords[0].toFixed(4)}, {anchorCoords[1].toFixed(4)}]
              </span>
              <span className="font-semibold text-charcoal-700 truncate max-w-[150px]">
                {anchorName}
              </span>
            </div>
          </div>

        </div>

        {/* Map & Listings Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Real Leaflet Map Container */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-5 border border-stone-200 shadow-card space-y-4">
            
            {/* Map Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-charcoal-900">
                  {listings.length} Surplus Food Listings
                </span>
                <span className="text-stone-500">
                  within <strong className="text-forest-800">{radiusKm} km</strong> of {anchorName}
                </span>
              </div>
              <div className="text-stone-500 font-mono text-[11px] hidden sm:block">
                OpenStreetMap &bull; Leaflet v1.9
              </div>
            </div>

            {/* Leaflet Map Component */}
            <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-stone-200 shadow-inner">
              <FoodMap
                center={leafletCenter}
                zoom={radiusKm <= 3 ? 14 : radiusKm <= 10 ? 13 : 11}
                listings={listings}
                selectedListing={selectedListing}
                onSelectListing={(item) => setSelectedListing(item)}
                userLocation={leafletCenter}
                radiusKm={radiusKm}
              />
            </div>

            {/* Map Legend & Tech Stack Notes */}
            <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100 gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-forest-800 border-2 border-white shadow-xs inline-block" />
                  <span className="text-charcoal-700 font-medium">Food Listing Pin</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs inline-block" />
                  <span className="text-charcoal-700 font-medium">Your Search Anchor</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-forest-600 bg-forest-200/40 inline-block" />
                  <span className="text-charcoal-700 font-medium">{radiusKm}km Query Perimeter</span>
                </span>
              </div>
              <div className="text-[11px] font-mono text-forest-800">
                GeoJSON format: [longitude, latitude]
              </div>
            </div>

          </div>

          {/* Right: Listings Stream & Card Previews */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-forest-700" />
                <span>Nearby Food Feed ({listings.length})</span>
              </div>
              {selectedListing && (
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="text-xs text-forest-800 hover:underline font-semibold"
                >
                  View Details
                </button>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-stone-200 animate-pulse space-y-3">
                    <div className="h-4 bg-stone-200 rounded w-2/3" />
                    <div className="h-3 bg-stone-200 rounded w-full" />
                    <div className="h-8 bg-stone-200 rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error querying nearby food: </span>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && listings.length === 0 && (
              <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4">
                <div className="w-12 h-12 bg-cream-100 text-forest-800 rounded-full flex items-center justify-center mx-auto">
                  <MapPin className="w-6 h-6 text-forest-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-charcoal-900">
                    No Food Listed within {radiusKm} km
                  </h3>
                  <p className="text-xs text-charcoal-500 max-w-xs mx-auto">
                    There are currently no active surplus listings in this immediate zone. Try increasing your radius or shifting to another neighborhood.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setRadiusKm(25)}
                  >
                    Expand Radius to 25 km
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRadiusKm(50);
                      setCategory('all');
                    }}
                  >
                    Show All Listings (50 km)
                  </Button>
                </div>
              </div>
            )}

            {/* Active Selected Card Preview */}
            {!loading && !error && selectedListing && (
              <div className="space-y-4">
                <div className="border-2 border-forest-600 rounded-2xl shadow-card overflow-hidden">
                  <FoodCard
                    listing={selectedListing}
                    onSelect={() => setIsDetailModalOpen(true)}
                    onReserve={(listing) => {
                      setClaimListing(listing || selectedListing);
                      setIsClaimModalOpen(true);
                    }}
                  />
                </div>
              </div>
            )}

            {/* Scrollable List of Other Nearby Options */}
            {!loading && !error && listings.length > 1 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Other Nearby Locations
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {listings
                    .filter((item) => item._id !== selectedListing?._id)
                    .map((item) => (
                      <button
                        key={item._id}
                        onClick={() => setSelectedListing(item)}
                        className="w-full text-left p-3 bg-white hover:bg-forest-50/50 rounded-xl border border-stone-200 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-charcoal-900 group-hover:text-forest-800 truncate">
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                            <span className="capitalize">{item.category}</span>
                            <span>&bull;</span>
                            <span className="font-semibold text-forest-800">{item.quantity} {item.unit}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          {item.distanceKm !== undefined && (
                            <span className="text-[11px] font-bold text-forest-800 bg-forest-100 px-2 py-0.5 rounded-full">
                              {item.distanceKm} km
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-forest-700 mt-1" />
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Technical Geospatial Showcase Panel for Interviews */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 text-xs text-charcoal-600 space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-forest-900">MongoDB Geospatial Query Architecture</span>
              </div>
              <p className="text-[11px] text-charcoal-500 leading-relaxed">
                This endpoint executes an indexed <code>$near</code> geospatial query against the MongoDB collection, converting <code>radiusKm</code> into meters:
              </p>
              <pre className="p-3 bg-stone-900 text-emerald-400 rounded-xl font-mono text-[10.5px] overflow-x-auto leading-relaxed">
{`// MongoDB 2dsphere $near query
FoodListing.find({
  status: 'available',
  expiryTime: { $gt: new Date() },
  location: {
    $near: {
      $geometry: {
        type: 'Point',
        coordinates: [${anchorCoords[0].toFixed(4)}, ${anchorCoords[1].toFixed(4)}]
      },
      $maxDistance: ${radiusKm * 1000} // meters
    }
  }
})`}
              </pre>
            </div>

          </div>

        </div>

      </div>

      {/* Food Detail Modal */}
      {selectedListing && (
        <FoodDetailModal
          listing={selectedListing}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onReserveSuccess={() => fetchNearbyListings()}
        />
      )}

      {/* Direct Claim Portion Modal */}
      <ClaimPortionModal
        listing={claimListing}
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimListing(null);
        }}
        onReserveSuccess={() => fetchNearbyListings()}
      />
    </div>
  );
}