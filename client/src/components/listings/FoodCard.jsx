import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  AlertCircle,
  Tag
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function FoodCard({ listing, onSelect, onReserve }) {
  // Support both _id (MongoDB) and id (mock)
  const listingId = listing._id || listing.id;

  // Calculate time remaining until expiry
  const calculateExpiryTime = (isoString) => {
    if (!isoString) return { text: 'N/A', urgent: false };
    const diff = new Date(isoString) - new Date();
    if (diff <= 0) return { text: 'Expired', urgent: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 1) return { text: `${minutes}m left`, urgent: true };
    if (hours < 6) return { text: `${hours}h ${minutes}m left`, urgent: true };
    if (hours < 24) return { text: `${hours}h left`, urgent: false };
    const days = Math.floor(hours / 24);
    return { text: `${days}d left`, urgent: false };
  };

  const expiry = calculateExpiryTime(listing.expiryTime);

  const getCategoryLabel = (cat) => {
    if (!cat) return 'Food Item';
    const clean = cat.replace(/-/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Format pickup window
  const formatPickupWindow = () => {
    if (listing.pickupWindow) {
      return `${listing.pickupWindow.start} - ${listing.pickupWindow.end}`;
    }
    if (listing.pickupStartTime && listing.pickupEndTime) {
      const start = new Date(listing.pickupStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const end = new Date(listing.pickupEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${start} - ${end}`;
    }
    return 'See instructions';
  };

  // Donor display name & type
  const donorName = listing.donor?.name || 'Verified Food Donor';
  const donorType = listing.donor?.organizationType || listing.donor?.type || 'Food Donor';
  const pickupLocation = typeof listing.pickupAddress === 'string'
    ? listing.pickupAddress
    : listing.pickupAddress?.facility || listing.pickupAddress?.street || 'Local pickup';

  const isAvailable = listing.status === 'available';

  return (
    <div className="group bg-white rounded-2xl border border-stone-200/80 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-100">
        <img
          src={listing.imageUrl || listing.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'}
          alt={listing.title}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent opacity-80" />

        {/* Category Badge & Distance Badge top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <Badge variant="forest" size="sm" className="bg-white/95 backdrop-blur-md text-forest-900 font-semibold shadow-xs">
            {getCategoryLabel(listing.category)}
          </Badge>
          {listing.distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-forest-900/90 text-sage-200 backdrop-blur-md border border-forest-700/50">
              <MapPin className="w-2.5 h-2.5 text-emerald-400" />
              {listing.distanceKm} km away
            </span>
          )}
        </div>

        {/* Expiry Badge top-right */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
            expiry.urgent 
              ? 'bg-amber-500/95 text-white' 
              : 'bg-charcoal-900/80 text-cream-100'
          }`}>
            <Clock className="w-3 h-3" />
            {expiry.text}
          </span>
        </div>

        {/* Quantity & Servings at image bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
          <span className="bg-forest-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-forest-700/50 flex items-center gap-1.5">
            <span className="font-bold text-sage-300 text-sm">{listing.availableQuantity ?? listing.quantity}</span>
            <span>{listing.unit} left</span>
          </span>
          {(listing.servingsCount || listing.servings) && (
            <span className="bg-charcoal-900/70 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-stone-200">
              <Users className="w-3 h-3 text-sage-300" />
              ~{listing.servingsCount || listing.servings} servings
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Donor info */}
          <div className="flex items-center justify-between text-xs text-charcoal-500 mb-2">
            <div className="flex items-center gap-1.5 font-medium text-forest-900">
              <span className="truncate max-w-[170px]">{donorName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600 flex-shrink-0" title="Verified Safe Donor" />
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-stone-100 text-charcoal-600 font-medium">
              {donorType}
            </span>
          </div>

          {/* Title */}
          <Link to={`/food/${listingId}`}>
            <h3 className="text-base font-semibold text-charcoal-900 group-hover:text-forest-800 transition-colors line-clamp-2 leading-snug">
              {listing.title}
            </h3>
          </Link>

          {/* Description snippet */}
          <p className="text-xs text-charcoal-500 mt-2 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Pickup & Action Footer */}
        <div className="mt-4 pt-3.5 border-t border-stone-100 space-y-3">
          <div className="flex items-center justify-between text-xs text-charcoal-600">
            <div className="flex items-center gap-1.5 text-charcoal-700 truncate max-w-[180px]">
              <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
              <span className="truncate text-stone-600">{pickupLocation}</span>
            </div>
            <div className="text-[11px] font-medium text-stone-500 flex-shrink-0">
              {formatPickupWindow()}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link to={`/food/${listingId}`} className="flex-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                View Details
              </Button>
            </Link>

            {isAvailable ? (
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => onReserve ? onReserve(listing) : onSelect ? onSelect(listing) : null}
              >
                Claim Portion
              </Button>
            ) : (
              <Badge variant="warning" size="sm" className="flex-1 justify-center py-2">
                {listing.status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
