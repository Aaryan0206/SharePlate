import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Calendar, 
  AlertTriangle, 
  Star, 
  Phone, 
  ArrowLeft,
  Share2,
  PackageCheck,
  Building2,
  Info,
  CheckCircle2,
  KeyRound,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { MOCK_LISTINGS } from '../data/mockListings';

export default function FoodDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 5 Reservation states
  const [reserveQty, setReserveQty] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [createdReservation, setCreatedReservation] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchListing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/food/${id}`);
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('OFFLINE_OR_STATIC');
      }
      const data = await res.json();

      if (!res.ok || !data.success || !data.listing) {
        throw new Error(data.message || 'Unable to retrieve food listing');
      }

      setListing(data.listing);
      const rem = data.listing.availableQuantity ?? data.listing.quantity;
      setReserveQty((prev) => Math.min(Math.max(1, prev), Math.max(1, Math.floor(rem) || rem)));
    } catch (err) {
      // Fallback for static demo hosting / offline
      let custom = [];
      try {
        custom = JSON.parse(localStorage.getItem('shareplate_custom_listings') || '[]');
      } catch (e) {}
      const found = custom.find((l) => l._id === id || l.id === id) ||
                    MOCK_LISTINGS.find((l) => l._id === id || l.id === id || l.id === 'sp-101');
      if (found) {
        setListing(found);
        const rem = found.availableQuantity ?? found.quantity;
        setReserveQty((prev) => Math.min(Math.max(1, prev), Math.max(1, Math.floor(rem) || rem)));
        setError(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchListing();
    }
  }, [id, fetchListing]);

  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    setReserveError('');
    setReserving(true);

    try {
      let isLiveSuccess = false;
      let liveRes = null;

      try {
        const res = await fetch('/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            foodListingId: listing._id || listing.id,
            quantityReserved: Number(reserveQty),
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success) {
            isLiveSuccess = true;
            liveRes = data.reservation;
          } else if (!res.ok && data?.message) {
            fetchListing();
            throw new Error(data.message);
          }
        }
      } catch (e) {
        if (e.message && !e.message.includes('JSON') && !e.message.includes('fetch')) throw e;
      }

      if (isLiveSuccess && liveRes) {
        setCreatedReservation(liveRes);
        fetchListing();
        return;
      }

      // Offline / GitHub Pages reservation fallback
      const mockCode = 'RES' + Math.floor(1000 + Math.random() * 9000);
      const demoReservation = {
        _id: 'res-' + Date.now(),
        quantityReserved: Number(reserveQty),
        unit: listing.unit || 'portions',
        pickupCode: mockCode,
        pickupDeadline: listing.pickupEndTime || new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      };
      setCreatedReservation(demoReservation);
    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  const handleCopyCode = (code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 min-h-[70vh] flex flex-col items-center justify-center text-center bg-cream-50">
        <div className="w-12 h-12 rounded-2xl bg-forest-800 flex items-center justify-center animate-spin mb-4 text-sage-300">
          <PackageCheck className="w-6 h-6" />
        </div>
        <div className="text-base font-bold text-forest-900">Loading Food Listing Details...</div>
        <div className="text-xs text-stone-500 mt-1">Retrieving verified record from MongoDB</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="py-20 bg-cream-50 min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-charcoal-900">Listing Not Found</h2>
        <p className="text-sm text-charcoal-600 max-w-md mt-2">
          {error || 'This listing may have expired, been cancelled, or removed by the donor.'}
        </p>
        <div className="mt-6 flex gap-3">
          <Link to="/browse">
            <Button variant="primary" size="md" icon={ArrowLeft} iconPosition="left">
              Browse Available Food
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = new Date(listing.expiryTime) <= new Date();

  return (
    <div className="py-10 bg-cream-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link to="/browse" className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest-800 hover:text-forest-900">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Browse Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-mono">ID: {listing._id}</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-stone-200/90 shadow-card">
          
          {/* Hero Image */}
          <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-stone-100">
            <img
              src={listing.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1200&q=80'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/20 to-transparent" />

            {/* Badges Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2">
                <Badge variant="forest" size="md" className="bg-white/95 text-forest-900 font-bold backdrop-blur-md uppercase tracking-wider">
                  {listing.category}
                </Badge>
                <Badge 
                  variant={listing.status === 'available' && !isExpired ? 'success' : 'warning'} 
                  size="md"
                  className="font-bold backdrop-blur-md uppercase"
                >
                  {isExpired ? 'EXPIRED' : listing.status.toUpperCase()}
                </Badge>
              </div>

              <div className="text-xs font-semibold bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
                Rescued via SharePlate
              </div>
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* Title & Quantity Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-stone-100">
              <div className="space-y-2 max-w-2xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal-900 tracking-tight leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-xs text-charcoal-500">
                  <span>Published on {formatDateTime(listing.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-cream-50 p-4 rounded-2xl border border-cream-200 flex-shrink-0">
                <div className="text-center px-2">
                  <div className="text-xs text-stone-500 font-medium">Available Quantity</div>
                  <div className="text-2xl font-black text-forest-900 mt-0.5">
                    {listing.availableQuantity ?? listing.quantity}{' '}
                    <span className="text-sm font-semibold">{listing.unit}</span>
                  </div>
                  {(listing.originalQuantity || listing.quantity) > (listing.availableQuantity ?? listing.quantity) && (
                    <div className="text-[11px] text-amber-700 font-semibold">
                      of {listing.originalQuantity || listing.quantity} {listing.unit} total
                    </div>
                  )}
                  {listing.servingsCount && (
                    <div className="text-[11px] text-forest-700 font-medium">~{listing.servingsCount} servings</div>
                  )}
                </div>
              </div>
            </div>

            {/* Donor Overview Card */}
            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-forest-800 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {listing.donor?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-base font-bold text-charcoal-900">
                    <span>{listing.donor?.name || 'Verified Food Partner'}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" title="Verified Safe Donor" />
                  </div>
                  <div className="text-xs text-charcoal-500">
                    {listing.donor?.organizationType || 'Food Provider'} &bull; Contact via pickup instructions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white border border-stone-200 text-forest-900">
                  Registered Partner
                </span>
              </div>
            </div>

            {/* Food Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">Food Description</h3>
              <p className="text-sm sm:text-base text-charcoal-700 leading-relaxed bg-cream-50/50 p-5 rounded-2xl border border-cream-200/80">
                {listing.description}
              </p>
            </div>

            {/* Timing & Pickup Window Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-forest-50/50 rounded-2xl border border-forest-100 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-900">
                  <Clock className="w-4 h-4 text-forest-800" />
                  <span>Pickup Window</span>
                </div>
                <div className="text-sm font-semibold text-charcoal-900">
                  {formatDateTime(listing.pickupStartTime)} &mdash; {formatDateTime(listing.pickupEndTime)}
                </div>
                <p className="text-xs text-stone-600">
                  Please arrive strictly within this scheduled timeframe.
                </p>
              </div>

              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Expiry & Safety Threshold</span>
                </div>
                <div className="text-sm font-semibold text-amber-950">
                  {formatDateTime(listing.expiryTime)}
                </div>
                <p className="text-xs text-stone-600">
                  Food must not be distributed or consumed past this recorded time.
                </p>
              </div>
            </div>

            {/* Pickup Address & Instructions */}
            <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  <MapPin className="w-4 h-4 text-forest-700" />
                  <span>Pickup Address & Instructions</span>
                </div>
                {listing.location?.coordinates && (
                  <Link
                    to="/map"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 px-2.5 py-1 rounded-lg border border-forest-200"
                  >
                    <span>View on Nearby Map</span>
                  </Link>
                )}
              </div>
              <div className="text-sm font-bold text-charcoal-900">
                {listing.pickupAddress}
              </div>
              {listing.location?.coordinates && (
                <div className="p-2.5 bg-forest-50/60 rounded-xl border border-forest-200/70 text-xs flex items-center justify-between">
                  <span className="text-forest-900 font-medium">MongoDB GeoJSON Point:</span>
                  <span className="font-mono text-forest-900 font-bold bg-white px-2 py-0.5 rounded border border-forest-200">
                    [{listing.location.coordinates[0].toFixed(5)}, {listing.location.coordinates[1].toFixed(5)}]
                  </span>
                </div>
              )}
              {listing.pickupInstructions && (
                <p className="text-xs text-charcoal-600 pt-1">
                  <span className="font-semibold text-charcoal-800">Special Instructions: </span>
                  {listing.pickupInstructions}
                </p>
              )}
            </div>

            {/* Allergens & Handling Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Allergen Information</div>
                <div className="text-xs font-medium text-charcoal-800">
                  {listing.allergenInformation || 'None specified'}
                </div>
              </div>

              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Food Handling Notes</div>
                <div className="text-xs font-medium text-charcoal-800">
                  {listing.foodHandlingNotes || 'Standard hygienic food handling applies.'}
                </div>
              </div>
            </div>

            {/* Phase 5 Live Reservation & Pickup Verification Box */}
            {createdReservation ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50 border-2 border-emerald-300 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-forest-900">
                      Reservation Confirmed!
                    </h4>
                    <p className="text-xs sm:text-sm text-charcoal-700 mt-0.5">
                      You reserved <strong>{createdReservation.quantityReserved} {createdReservation.unit}</strong> of this listing. Show the verification code below to the donor at pickup.
                    </p>
                  </div>
                </div>

                {/* Pickup Verification Code Box */}
                <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <KeyRound className="w-5 h-5 text-forest-700" />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Your Pickup Verification Code
                      </div>
                      <div className="text-2xl font-mono font-black tracking-widest text-forest-900">
                        {createdReservation.pickupCode}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Copy}
                      onClick={() => handleCopyCode(createdReservation.pickupCode)}
                    >
                      {copiedCode ? 'Copied!' : 'Copy Code'}
                    </Button>
                    <Link to="/recipient/dashboard">
                      <Button variant="primary" size="sm">
                        My Reservations
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-forest-900 text-white space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sage-300">
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span>Reserve Surplus Food</span>
                  </div>
                  <span className="text-xs font-semibold text-sage-200">
                    {listing.availableQuantity ?? listing.quantity} {listing.unit} remaining
                  </span>
                </div>

                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-stone-200">
                      Sign in with a <strong>Recipient</strong> account to reserve portions and receive your pickup verification code.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link to="/login">
                        <Button variant="secondary" size="sm" className="bg-white text-forest-900 hover:bg-cream-50 font-bold">
                          Sign In to Reserve
                        </Button>
                      </Link>
                      <Link to="/register">
                        <Button variant="outline" size="sm" className="border-white text-white hover:bg-white/10">
                          Register as Recipient
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : user?.role !== 'recipient' ? (
                  <div className="p-3.5 bg-forest-800/80 rounded-xl border border-forest-700 text-xs text-sage-200 flex items-center gap-2">
                    <Info className="w-4 h-4 text-sage-300 flex-shrink-0" />
                    <span>
                      You are signed in as <strong className="capitalize">{user?.role}</strong>. Only registered <strong>Recipient</strong> accounts can reserve food portions.
                    </span>
                  </div>
                ) : isExpired || listing.status !== 'available' || (listing.availableQuantity ?? listing.quantity) <= 0 ? (
                  <div className="p-3.5 bg-amber-900/40 rounded-xl border border-amber-500/40 text-xs text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      {isExpired
                        ? 'This food listing has expired and is no longer accepting reservations.'
                        : `This listing is currently "${listing.status}" with no remaining available quantity.`}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleReserveSubmit} className="space-y-4">
                    {reserveError && (
                      <div className="p-3 bg-red-900/50 border border-red-400/50 rounded-xl text-xs text-red-100 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
                        <span>{reserveError}</span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-semibold text-sage-200">
                          Quantity to reserve ({listing.unit}):
                        </label>
                        <div className="flex items-center bg-forest-800 border border-forest-600 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setReserveQty((q) => Math.max(1, Number(q) - 1))}
                            disabled={reserveQty <= 1}
                            className="px-3 py-2 text-white hover:bg-forest-700 disabled:opacity-40 font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0.1"
                            max={listing.availableQuantity ?? listing.quantity}
                            step="any"
                            value={reserveQty}
                            onChange={(e) => {
                              const maxVal = listing.availableQuantity ?? listing.quantity;
                              const val = Number(e.target.value);
                              if (!isNaN(val)) {
                                setReserveQty(Math.min(maxVal, Math.max(0.1, val)));
                              }
                            }}
                            className="w-16 text-center bg-transparent text-white font-bold text-sm focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setReserveQty((q) =>
                                Math.min(listing.availableQuantity ?? listing.quantity, Number(q) + 1)
                              )
                            }
                            disabled={reserveQty >= (listing.availableQuantity ?? listing.quantity)}
                            className="px-3 py-2 text-white hover:bg-forest-700 disabled:opacity-40 font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="md"
                        type="submit"
                        loading={reserving}
                        icon={PackageCheck}
                        className="bg-emerald-500 hover:bg-emerald-400 text-forest-950 font-extrabold shadow-md"
                      >
                        Confirm Free Reservation
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
