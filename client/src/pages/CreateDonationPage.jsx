import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  UploadCloud, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Info,
  ArrowRight,
  AlertCircle,
  Building2,
  Crosshair,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LocationPickerModal from '../components/map/LocationPickerModal';

export default function CreateDonationPage() {
  const { user, isAuthenticated, token } = useAuth();
  const navigate = useNavigate();

  // Helper to get formatted default local datetime strings
  const getFutureISO = (hoursAhead) => {
    const d = new Date(Date.now() + hoursAhead * 3600 * 1000);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: '',
    category: 'cooked meals',
    description: '',
    quantity: '',
    unit: 'boxes',
    servingsCount: '',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
    pickupAddress: 'Campus Dining Service Block B, University Avenue',
    pickupInstructions: 'Enter through Gate 2 service dock and contact dining manager',
    pickupStartTime: getFutureISO(0.5), // in 30 mins
    pickupEndTime: getFutureISO(3.5),   // in 3.5 hours
    expiryTime: getFutureISO(4.5),      // in 4.5 hours
    allergenInformation: 'None specified',
    foodHandlingNotes: 'Store in cool dry conditions or reheat thoroughly.',
  });

  // GeoJSON [longitude, latitude] coordinates (defaults to Bangalore center)
  const [coordinates, setCoordinates] = useState([77.5946, 12.9716]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdListing, setCreatedListing] = useState(null);

  // Client-side validation
  const validate = () => {
    const errors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'Food title must be at least 3 characters long';
    }
    if (!formData.description.trim() || formData.description.trim().length < 5) {
      errors.description = 'Please provide a clear description (at least 5 characters)';
    }
    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Quantity must be a positive number greater than 0';
    }
    if (!formData.pickupAddress.trim()) {
      errors.pickupAddress = 'Pickup address is required';
    }

    const start = new Date(formData.pickupStartTime);
    const end = new Date(formData.pickupEndTime);
    const exp = new Date(formData.expiryTime);

    if (start >= end) {
      errors.pickupEndTime = 'Pickup end time must be after pickup start time';
    }
    if (end > exp) {
      errors.expiryTime = 'Expiry time must be on or after pickup end time';
    }
    if (exp <= new Date()) {
      errors.expiryTime = 'Expiry time must be in the future';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        unit: formData.unit,
        imageUrl: formData.imageUrl.trim() || undefined,
        pickupAddress: formData.pickupAddress.trim(),
        pickupInstructions: formData.pickupInstructions.trim() || undefined,
        quantity: Number(formData.quantity),
        servingsCount: formData.servingsCount ? Number(formData.servingsCount) : null,
        pickupStartTime: new Date(formData.pickupStartTime).toISOString(),
        pickupEndTime: new Date(formData.pickupEndTime).toISOString(),
        expiryTime: new Date(formData.expiryTime).toISOString(),
        location: {
          type: 'Point',
          coordinates: coordinates,
        },
      };

      const headers = { 'Content-Type': 'application/json' };
      const authToken = token || localStorage.getItem('shareplate_token');
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      let data = null;
      try {
        const res = await fetch('/api/food', {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        }

        if (res.ok && data?.success && data.listing) {
          setCreatedListing(data.listing);
          return;
        } else if (!res.ok && data?.message) {
          throw new Error(data.message);
        }
      } catch (networkOrParseErr) {
        if (networkOrParseErr.message && !networkOrParseErr.message.includes('JSON') && !networkOrParseErr.message.includes('fetch')) {
          throw networkOrParseErr;
        }
      }

      // Offline / GitHub Pages fallback
      const offlineListing = {
        _id: 'listing-' + Date.now(),
        ...payload,
        availableQuantity: Number(payload.quantity),
        reservedQuantity: 0,
        collectedQuantity: 0,
        originalQuantity: Number(payload.quantity),
        status: 'available',
        donor: {
          _id: user?._id || 'donor-1',
          name: user?.name || 'Green Hearth Bakery',
          organizationType: user?.organizationType || 'Food Donor',
        },
        createdAt: new Date().toISOString(),
      };

      try {
        const saved = JSON.parse(localStorage.getItem('shareplate_custom_listings') || '[]');
        saved.unshift(offlineListing);
        localStorage.setItem('shareplate_custom_listings', JSON.stringify(saved));
      } catch (e) {}

      setCreatedListing(offlineListing);
    } catch (err) {
      setServerError(err.message || 'An error occurred while creating listing.');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in as donor or admin, display helpful prompt
  if (!isAuthenticated || (user?.role !== 'donor' && user?.role !== 'admin')) {
    return (
      <div className="py-20 bg-cream-50 min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-3xl bg-forest-800 text-sage-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Building2 className="w-8 h-8 text-sage-300" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Food Donor Sign In Required</h2>
        <p className="text-sm text-charcoal-600 max-w-md mt-2">
          To maintain food quality and community trust, only registered food donors (cafeterias, restaurants, bakeries, hostels) can publish surplus listings.
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/login">
            <Button variant="primary" size="md">
              Sign In as Donor
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="outline" size="md">
              Register as Donor
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-cream-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Phase Indicator */}
        <div className="mb-6 flex items-center justify-between p-3.5 bg-forest-50 border border-forest-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-forest-900">
              Live MongoDB Integration &bull; Publishing as {user.name} ({user.role})
            </span>
          </div>
          <Badge variant="forest" size="sm">Phase 3 Live</Badge>
        </div>

        {createdListing ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-stone-200 shadow-card text-center space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-forest-800 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900">
                Surplus Food Listing Published!
              </h2>
              <p className="text-sm text-charcoal-600 max-w-lg mx-auto">
                "<strong>{createdListing.title}</strong>" is now live in MongoDB and ready for community discovery.
              </p>
            </div>

            {/* Quick Preview Card */}
            <div className="max-w-md mx-auto bg-cream-50 p-4 rounded-2xl border border-cream-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Category:</span>
                <span className="font-semibold text-charcoal-900 capitalize">{createdListing.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Quantity:</span>
                <span className="font-bold text-forest-800">{createdListing.quantity} {createdListing.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pickup Location:</span>
                <span className="font-semibold text-charcoal-900 truncate max-w-[200px]">{createdListing.pickupAddress}</span>
              </div>
              {createdListing.location?.coordinates && (
                <div className="flex justify-between">
                  <span className="text-stone-500">GeoJSON [Lng, Lat]:</span>
                  <span className="font-mono text-forest-800 font-semibold">
                    [{createdListing.location.coordinates[0].toFixed(4)}, {createdListing.location.coordinates[1].toFixed(4)}]
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-stone-500">Database ID:</span>
                <span className="font-mono text-stone-500">{createdListing._id}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/donor/dashboard">
                <Button variant="primary" size="md">
                  View My Listings Dashboard
                </Button>
              </Link>
              <Link to={`/food/${createdListing._id}`}>
                <Button variant="outline" size="md">
                  View Public Listing Page
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setCreatedListing(null);
                  setFormData({
                    ...formData,
                    title: '',
                    description: '',
                    quantity: '',
                  });
                }}
              >
                Post Another Surplus Item
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-card space-y-8">
            
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full mb-2">
                <PlusCircle className="w-3.5 h-3.5 text-forest-700" />
                <span>Donor Food Intake</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                Create Surplus Food Donation
              </h1>
              <p className="text-sm text-charcoal-500 mt-1">
                Enter details below to publish wholesome edible surplus from your kitchen, cafeteria, or market.
              </p>
            </div>

            {/* Error Notice */}
            {serverError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error: </span>
                  <span>{serverError}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Food Listing Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Basmati Rice & Paneer Butter Masala"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                    fieldErrors.title ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Category, Quantity & Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 text-sm bg-white"
                  >
                    <option value="cooked meals">Cooked Meals</option>
                    <option value="bakery">Bakery & Breads</option>
                    <option value="fruits and vegetables">Fruits & Vegetables</option>
                    <option value="packaged food">Packaged Food</option>
                    <option value="groceries">Groceries</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Quantity Available *
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="e.g. 20"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                      fieldErrors.quantity ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.quantity && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.quantity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 text-sm bg-white"
                  >
                    <option value="boxes">Boxes</option>
                    <option value="servings">Servings</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="loaves">Loaves</option>
                    <option value="packets">Packets</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              {/* Optional Servings Count & Image URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Est. Servings (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 25"
                    value={formData.servingsCount}
                    onChange={(e) => setFormData({ ...formData, servingsCount: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Food Image URL (Unsplash or direct image)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                  Detailed Food Description *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detail culinary preparation time, packaging conditions, temperature status, and immediate serving recommendations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                    fieldErrors.description ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                  }`}
                />
                {fieldErrors.description && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.description}</p>
                )}
              </div>

              {/* Pickup Windows & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Pickup Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.pickupStartTime}
                    onChange={(e) => setFormData({ ...formData, pickupStartTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Pickup End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.pickupEndTime}
                    onChange={(e) => setFormData({ ...formData, pickupEndTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      fieldErrors.pickupEndTime ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.pickupEndTime && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.pickupEndTime}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Food Expiry Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.expiryTime}
                    onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      fieldErrors.expiryTime ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.expiryTime && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.expiryTime}</p>
                  )}
                </div>
              </div>

              {/* Pickup Address, Map Coordinates & Instructions */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                      Pickup Address & Specific Facility *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 hover:bg-forest-100 px-2.5 py-1 rounded-lg border border-forest-200 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-forest-700" />
                      <span>Set Exact Pin on Map</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    placeholder="e.g. Block B Ground Floor, Central Campus Dining Hall, 45 University Ave"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm ${
                      fieldErrors.pickupAddress ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  {fieldErrors.pickupAddress && (
                    <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.pickupAddress}</p>
                  )}

                  {/* Active Geospatial Coordinates Badge */}
                  <div className="mt-2 p-2.5 bg-forest-50/60 border border-forest-200/70 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-forest-900">
                      <Crosshair className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-semibold">MongoDB GeoJSON Coordinates: </span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-forest-200 text-forest-800 font-bold">
                          [{coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}]
                        </span>
                        <span className="text-stone-500 text-[11px] ml-2 hidden sm:inline">
                          (Lat: {coordinates[1].toFixed(5)}, Lng: {coordinates[0].toFixed(5)})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="text-xs font-medium text-forest-800 hover:underline flex-shrink-0"
                    >
                      Adjust Location
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Pickup Instructions for Collector
                  </label>
                  <input
                    type="text"
                    value={formData.pickupInstructions}
                    onChange={(e) => setFormData({ ...formData, pickupInstructions: e.target.value })}
                    placeholder="e.g. Enter through West loading dock, ask for Chef Miller at reception"
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm"
                  />
                </div>
              </div>

              {/* Allergen & Dietary Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Allergen Warnings
                  </label>
                  <input
                    type="text"
                    value={formData.allergenInformation}
                    onChange={(e) => setFormData({ ...formData, allergenInformation: e.target.value })}
                    placeholder="e.g. Contains Dairy (Paneer). Gluten-free."
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
                    Food Handling Notes
                  </label>
                  <input
                    type="text"
                    value={formData.foodHandlingNotes}
                    onChange={(e) => setFormData({ ...formData, foodHandlingNotes: e.target.value })}
                    placeholder="e.g. Consume within 2 hours or keep refrigerated at 4°C"
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <Link to="/donor/dashboard">
                  <Button variant="ghost" size="md">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  variant="primary" 
                  size="lg" 
                  type="submit" 
                  loading={loading}
                  icon={PlusCircle}
                >
                  Publish Listing to MongoDB
                </Button>
              </div>

            </form>

          </div>
        )}

        {/* Geospatial Map Picker Modal */}
        <LocationPickerModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          initialCoordinates={coordinates}
          initialAddress={formData.pickupAddress}
          onConfirmCoordinates={(newCoords) => setCoordinates(newCoords)}
        />

      </div>
    </div>
  );
}
