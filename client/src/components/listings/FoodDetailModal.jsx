import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Users, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Star, 
  Phone, 
  Share2,
  PackageCheck,
  ArrowRight,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function FoodDetailModal({ listing, isOpen, onClose, onReserveSuccess }) {
  const { user, isAuthenticated } = useAuth();
  const [reservedQuantity, setReservedQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [createdReservation, setCreatedReservation] = useState(null);

  if (!isOpen || !listing) return null;

  const listingId = listing._id || listing.id;
  const availableQty = listing.availableQuantity ?? listing.quantity ?? 0;
  const imageSrc = listing.imageUrl || listing.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
  const servings = listing.servingsCount ?? listing.servings;
  const donorName = listing.donor?.name || 'Verified Food Partner';
  const donorType = listing.donor?.organizationType || listing.donor?.type || 'Food Donor';
  const distanceKm = listing.distanceKm ?? listing.pickupAddress?.distanceKm;

  const pickupAddressText = typeof listing.pickupAddress === 'string'
    ? listing.pickupAddress
    : [listing.pickupAddress?.facility, listing.pickupAddress?.street, listing.pickupAddress?.city]
        .filter(Boolean)
        .join(', ') || 'Local pickup location';

  const formatPickupWindow = () => {
    if (listing.pickupWindow?.start && listing.pickupWindow?.end) {
      return `${listing.pickupWindow.start} - ${listing.pickupWindow.end}`;
    }
    if (listing.pickupStartTime && listing.pickupEndTime) {
      const start = new Date(listing.pickupStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(listing.pickupEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }
    return 'See instructions';
  };

  const formatExpiry = () => {
    if (!listing.expiryTime) return 'Soon';
    const diff = new Date(listing.expiryTime) - new Date();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 1) return `${minutes}m left`;
    if (hours < 24) return `${hours}h ${minutes}m left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  const pickupInstructions = listing.pickupInstructions || listing.pickupWindow?.instructions || '';

  const handleReserve = async () => {
    setReserveError('');
    setReserving(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          foodListingId: listingId,
          quantityReserved: Number(reservedQuantity),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reserve food listing');
      }
      setCreatedReservation(data.reservation);
      if (onReserveSuccess) onReserveSuccess(listing, reservedQuantity, data.reservation);
    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  const handleClose = () => {
    setCreatedReservation(null);
    setReserveError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Food Surplus Details" maxWidth="max-w-3xl">
      {createdReservation ? (
        <div className="py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-forest-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-bold text-forest-900">Reservation Confirmed!</h4>
            <p className="text-sm text-charcoal-600 max-w-md mx-auto">
              You reserved <span className="font-semibold text-charcoal-900">{createdReservation.quantityReserved} {createdReservation.unit}</span> of <span className="font-medium">{listing.title}</span>.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 max-w-md mx-auto text-center space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center justify-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pickup Verification Code</span>
            </div>
            <div className="text-2xl font-mono font-black tracking-widest text-forest-950">
              {createdReservation.pickupCode}
            </div>
          </div>
          <div className="bg-cream-100 border border-cream-300 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
            <div className="flex justify-between gap-2">
              <span className="text-stone-500">Pickup Location:</span>
              <span className="font-semibold text-charcoal-900 text-right">{pickupAddressText}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-stone-500">Pickup Window:</span>
              <span className="font-semibold text-forest-800">{formatPickupWindow()}</span>
            </div>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/recipient/dashboard" onClick={handleClose}>
              <Button variant="primary" size="md">
                View My Reservations
              </Button>
            </Link>
            <Button variant="ghost" size="md" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top visual & badges */}
          <div className="relative h-64 rounded-xl overflow-hidden bg-stone-100">
            <img 
              src={imageSrc} 
              alt={listing.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
              <Badge variant="forest" size="md" className="bg-white/95 text-forest-900 font-bold backdrop-blur-md">
                {(listing.category || 'Food').toUpperCase().replace('-', ' ')}
              </Badge>
              <span className="text-xs font-semibold bg-black/60 backdrop-blur-md px-3 py-1 rounded-full capitalize">
                Status: {listing.status || 'available'}
              </span>
            </div>
          </div>

          {/* Title and Donor Overview */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-charcoal-900 leading-snug">
              {listing.title}
            </h2>

            {/* Donor bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-800 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {donorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-charcoal-900">
                    <span>{donorName}</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" title="Verified Safe Donor" />
                  </div>
                  <div className="text-xs text-charcoal-500">
                    {donorType}
                  </div>
                </div>
              </div>
              {listingId && (
                <Link
                  to={`/food/${listingId}`}
                  onClick={handleClose}
                  className="inline-flex items-center gap-1 text-xs font-bold text-forest-800 hover:underline bg-white px-3 py-1.5 rounded-lg border border-stone-200"
                >
                  <span>Full Listing Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div className="text-xs text-stone-500">Available Quantity</div>
              <div className="text-lg font-bold text-forest-900 mt-0.5">{listing.quantity} {listing.unit}</div>
            </div>
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div className="text-xs text-stone-500">Est. Servings</div>
              <div className="text-lg font-bold text-forest-900 mt-0.5">{servings ? `~${servings}` : 'N/A'}</div>
            </div>
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div className="text-xs text-stone-500">Distance</div>
              <div className="text-lg font-bold text-forest-900 mt-0.5">
                {distanceKm !== undefined ? `${distanceKm} km` : 'Nearby'}
              </div>
            </div>
            <div className="p-3 bg-cream-50 rounded-xl border border-cream-200">
              <div className="text-xs text-stone-500">Expiry</div>
              <div className="text-sm font-bold text-amber-700 mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatExpiry()}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Food Description</h4>
            <p className="text-sm text-charcoal-700 leading-relaxed bg-white p-3.5 rounded-xl border border-stone-200/80">
              {listing.description}
            </p>
          </div>

          {/* Allergen & Handling Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Allergen Notice</h4>
              <div className="flex flex-wrap gap-1.5">
                {Array.isArray(listing.allergens) && listing.allergens.length > 0 ? (
                  listing.allergens.map((allergen) => (
                    <Badge key={allergen} variant="terracotta" size="sm" icon={AlertTriangle}>
                      {allergen}
                    </Badge>
                  ))
                ) : listing.allergenInformation ? (
                  <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                    {listing.allergenInformation}
                  </span>
                ) : (
                  <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    No major common allergens noted
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Handling Notes</h4>
              <p className="text-xs text-charcoal-700 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200">
                {listing.foodHandlingNotes || 'Store properly and consume within pickup expiry window.'}
              </p>
            </div>
          </div>

          {/* Pickup Window and Instructions */}
          <div className="bg-forest-50/50 p-4 rounded-xl border border-forest-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-forest-900 font-semibold text-sm">
                <MapPin className="w-4 h-4 text-forest-800" />
                <span>Pickup Instructions & Location</span>
              </div>
              {listing.location?.coordinates && (
                <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-forest-200 text-forest-800">
                  [{listing.location.coordinates[0].toFixed(4)}, {listing.location.coordinates[1].toFixed(4)}]
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal-800 font-semibold">
              {pickupAddressText}
            </p>
            <p className="text-xs text-stone-600">
              <span className="font-semibold text-charcoal-800">Pickup Window: </span>
              {formatPickupWindow()}
              {pickupInstructions ? ` • ${pickupInstructions}` : ''}
            </p>
          </div>

          {/* Reservation Action Box */}
          <div className="pt-3 border-t border-stone-100 space-y-3">
            {reserveError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{reserveError}</span>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-cream-50 p-3.5 rounded-xl border border-cream-200">
                <span className="text-xs text-charcoal-700 font-medium">
                  Sign in as a Recipient to reserve portions of this listing.
                </span>
                <div className="flex items-center gap-2">
                  <Link to="/login" onClick={handleClose}>
                    <Button variant="primary" size="sm">Sign In</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleClose}>Close</Button>
                </div>
              </div>
            ) : user?.role !== 'recipient' ? (
              <div className="flex items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <span className="text-xs text-charcoal-600">
                  Signed in as <strong className="capitalize">{user?.role}</strong>. Only Recipient accounts can reserve food.
                </span>
                <Button variant="ghost" size="sm" onClick={handleClose}>Close</Button>
              </div>
            ) : availableQty <= 0 || listing.status !== 'available' ? (
              <div className="flex items-center justify-between gap-3 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                <span className="text-xs text-amber-800 font-medium">
                  This listing currently has no remaining quantity available.
                </span>
                <Button variant="ghost" size="sm" onClick={handleClose}>Close</Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-charcoal-700">Portions to claim:</span>
                  <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                    <button
                      type="button"
                      disabled={reservedQuantity <= 1}
                      onClick={() => setReservedQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 font-bold text-sm text-forest-900 min-w-[36px] text-center">
                      {reservedQuantity}
                    </span>
                    <button
                      type="button"
                      disabled={reservedQuantity >= availableQty}
                      onClick={() => setReservedQuantity((q) => Math.min(availableQty, q + 1))}
                      className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-stone-500">max {availableQty} {listing.unit}</span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="ghost" size="md" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    size="md" 
                    loading={reserving}
                    onClick={handleReserve}
                    icon={PackageCheck}
                    className="w-full sm:w-auto"
                  >
                    Confirm Free Reservation
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}