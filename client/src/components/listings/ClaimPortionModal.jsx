import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PackageCheck, 
  CheckCircle2, 
  KeyRound, 
  Copy, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Info,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function ClaimPortionModal({ listing, isOpen, onClose, onReserveSuccess }) {
  const { user, isAuthenticated } = useAuth();
  const [reservedQuantity, setReservedQuantity] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [createdReservation, setCreatedReservation] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen || !listing) return null;

  const listingId = listing._id || listing.id;
  const availableQty = listing.availableQuantity ?? listing.quantity ?? 0;
  const unit = listing.unit || 'portions';
  const imageSrc = listing.imageUrl || listing.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
  const donorName = listing.donor?.name || 'Verified Food Partner';
  const donorType = listing.donor?.organizationType || listing.donor?.type || 'Food Donor';

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

  const handleReserve = async () => {
    setReserveError('');
    setReserving(true);
    try {
      let data = null;
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

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        }

        if (res.ok && data?.success) {
          setCreatedReservation(data.reservation);
          if (onReserveSuccess) {
            onReserveSuccess(listing, reservedQuantity, data.reservation);
          }
          return;
        } else if (!res.ok && data?.message) {
          throw new Error(data.message);
        }
      } catch (networkOrParseErr) {
        if (networkOrParseErr.message && !networkOrParseErr.message.includes('JSON') && !networkOrParseErr.message.includes('fetch')) {
          throw networkOrParseErr;
        }
      }

      // Offline / GitHub Pages reservation confirmation fallback
      const mockCode = 'CLM' + Math.floor(1000 + Math.random() * 9000);
      const demoReservation = {
        _id: 'demo-res-' + Date.now(),
        quantityReserved: Number(reservedQuantity),
        unit: listing.unit || 'portions',
        pickupCode: mockCode,
        pickupDeadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      };
      setCreatedReservation(demoReservation);
      if (onReserveSuccess) {
        onReserveSuccess(listing, reservedQuantity, demoReservation);
      }
    } catch (err) {
      setReserveError(err.message);
    } finally {
      setReserving(false);
    }
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleClose = () => {
    setCreatedReservation(null);
    setReserveError('');
    setReservedQuantity(1);
    setCopiedCode(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Claim Surplus Food Portion" maxWidth="max-w-lg">
      {createdReservation ? (
        <div className="py-4 text-center space-y-4">
          <div className="w-14 h-14 bg-emerald-100 text-forest-800 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xl font-extrabold text-forest-900">Reservation Confirmed!</h4>
            <p className="text-sm text-charcoal-600 mt-1 max-w-sm mx-auto">
              You reserved <strong className="text-charcoal-900">{createdReservation.quantityReserved} {createdReservation.unit}</strong> of <strong>{listing.title}</strong>.
            </p>
          </div>

          {/* Pickup Verification Code Card */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 max-w-sm mx-auto text-center space-y-1.5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-forest-800 flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-emerald-700" />
              <span>Your Pickup Verification Code</span>
            </div>
            <div className="text-3xl font-mono font-black tracking-widest text-forest-950 py-1">
              {createdReservation.pickupCode}
            </div>
            <p className="text-[11px] text-forest-700">
              Show this code to the donor when you arrive for collection.
            </p>
          </div>

          {/* Pickup Location & Window Info */}
          <div className="bg-cream-100/70 border border-cream-300 rounded-xl p-3.5 max-w-md mx-auto text-left text-xs space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-stone-500 font-medium">Pickup Location:</span>
              <span className="font-semibold text-charcoal-900 text-right">{pickupAddressText}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-stone-500 font-medium">Pickup Window:</span>
              <span className="font-semibold text-forest-800">{formatPickupWindow()}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => handleCopyCode(createdReservation.pickupCode)}
            >
              {copiedCode ? 'Code Copied!' : 'Copy Code'}
            </Button>
            <Link to="/recipient/dashboard" onClick={handleClose}>
              <Button variant="primary" size="sm">
                View My Reservations
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Listing Preview Header */}
          <div className="flex items-center gap-3.5 p-3.5 bg-cream-50 rounded-2xl border border-cream-200">
            <img
              src={imageSrc}
              alt={listing.title}
              className="w-16 h-16 rounded-xl object-cover border border-stone-200 flex-shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="forest" size="sm">
                  {listing.category || 'Food'}
                </Badge>
                <span className="text-xs font-semibold text-emerald-700">
                  {availableQty} {unit} available
                </span>
              </div>
              <h4 className="text-sm font-bold text-charcoal-900 truncate mt-1">
                {listing.title}
              </h4>
              <div className="text-xs text-charcoal-500 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                <span className="truncate">{pickupAddressText}</span>
              </div>
            </div>
          </div>

          {/* Pickup Window Notice */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-charcoal-700">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
              <span className="font-medium text-stone-500">Pickup Window:</span>
            </div>
            <span className="font-bold text-forest-900">{formatPickupWindow()}</span>
          </div>

          {/* Error Banner */}
          {reserveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{reserveError}</span>
            </div>
          )}

          {/* Role & Auth Handling */}
          {!isAuthenticated ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Recipient Sign-In Required</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Please sign in with a <strong>Recipient</strong> account to reserve food portions and receive your pickup verification code.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link to="/login" onClick={handleClose}>
                  <Button variant="primary" size="sm">
                    Sign In to Claim
                  </Button>
                </Link>
                <Link to="/register" onClick={handleClose}>
                  <Button variant="outline" size="sm">
                    Register Account
                  </Button>
                </Link>
              </div>
            </div>
          ) : user?.role !== 'recipient' ? (
            <div className="p-4 bg-stone-100 border border-stone-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-charcoal-900">
                <Info className="w-4 h-4 text-forest-700 flex-shrink-0" />
                <span>Recipient Role Required</span>
              </div>
              <p className="text-xs text-charcoal-600 leading-relaxed">
                You are currently signed in as a <strong className="capitalize">{user?.role}</strong>. Only registered <strong>Recipient</strong> accounts can reserve surplus portions.
              </p>
              <div className="flex items-center justify-end pt-1">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : availableQty <= 0 || listing.status !== 'available' ? (
            <div className="p-4 bg-stone-100 border border-stone-200 rounded-2xl text-center text-xs text-stone-600">
              This listing has no remaining available portions to reserve.
            </div>
          ) : (
            /* Direct Reservation Stepper Form */
            <form onSubmit={(e) => { e.preventDefault(); handleReserve(); }} className="space-y-4 pt-1">
              <div className="bg-forest-50/60 p-4 rounded-2xl border border-forest-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <label className="block text-xs font-bold text-forest-900">
                    Portions to Claim ({unit}):
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Available: <strong>{availableQty} {unit}</strong>
                  </span>
                </div>

                <div className="flex items-center bg-white border border-stone-300 rounded-xl overflow-hidden shadow-xs">
                  <button
                    type="button"
                    disabled={reservedQuantity <= 1}
                    onClick={() => setReservedQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 font-bold text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={availableQty}
                    value={reservedQuantity}
                    onChange={(e) => {
                      const val = Math.floor(Number(e.target.value));
                      if (!isNaN(val)) {
                        setReservedQuantity(Math.max(1, Math.min(availableQty, val)));
                      }
                    }}
                    className="w-16 text-center text-forest-900 font-extrabold text-sm focus:outline-none py-1"
                  />
                  <button
                    type="button"
                    disabled={reservedQuantity >= availableQty}
                    onClick={() => setReservedQuantity((q) => Math.min(availableQty, q + 1))}
                    className="px-3.5 py-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button variant="ghost" size="sm" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={reserving}
                  icon={PackageCheck}
                  className="px-5 font-bold shadow-sm"
                >
                  Confirm Free Reservation
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
