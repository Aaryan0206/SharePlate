import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartHandshake, 
  Search, 
  MapPin, 
  Clock, 
  PackageCheck, 
  ShieldCheck, 
  AlertCircle,
  KeyRound,
  Copy,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const STATUS_FILTERS = [
  { id: 'all', label: 'All Reservations' },
  { id: 'reserved', label: 'Active' },
  { id: 'collected', label: 'Collected' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'expired', label: 'Expired' },
];

export default function RecipientDashboard() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cancellingId, setCancellingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchMyReservations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reservations/my-reservations', {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch your reservations');
      }
      setReservations(data.reservations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReservations();
  }, [fetchMyReservations]);

  const handleCancelReservation = async (reservationId, title) => {
    if (!window.confirm(`Cancel your reservation for "${title}"? The reserved quantity will be released back to the community.`)) {
      return;
    }

    setCancellingId(reservationId);
    setError('');
    setActionMessage('');
    try {
      const res = await fetch(`/api/reservations/${reservationId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel reservation');
      }
      setActionMessage(`Reservation for "${title}" cancelled and quantity restored.`);
      setTimeout(() => setActionMessage(''), 4000);
      await fetchMyReservations();
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCopyCode = (id, code) => {
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getStatusBadgeVariant = (status) => {
    if (status === 'reserved') return 'forest';
    if (status === 'collected') return 'success';
    if (status === 'expired') return 'warning';
    return 'neutral';
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const activeCount = reservations.filter((r) => r.status === 'reserved').length;
  const collectedCount = reservations.filter((r) => r.status === 'collected').length;
  const totalPortionsRescued = reservations
    .filter((r) => r.status === 'collected')
    .reduce((sum, r) => sum + (Number(r.quantityReserved) || 0), 0);

  const filteredReservations =
    statusFilter === 'all'
      ? reservations
      : reservations.filter((r) => r.status === statusFilter);

  return (
    <div className="py-10 bg-cream-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Recipient Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest-800 text-sage-200 flex items-center justify-center text-2xl font-bold shadow-md">
              <HeartHandshake className="w-8 h-8 text-sage-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="sage" size="sm">Recipient Portal</Badge>
                <span className="text-xs text-stone-500 font-medium">Community Member</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-1">
                Hello, {user?.name || 'Community Friend'}!
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
                {user?.email} &bull; Role: <span className="font-semibold text-forest-800 capitalize">{user?.role}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <Link to="/map">
              <Button variant="outline" size="md" icon={MapPin}>
                Nearby Map
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="primary" size="md" icon={Search}>
                Explore Available Food
              </Button>
            </Link>
          </div>
        </div>

        {/* Recipient Metric Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Active Reservations</div>
            <div className="text-3xl font-extrabold text-forest-900 mt-1">{activeCount}</div>
            <div className="text-xs text-stone-500 mt-1">Ready for pickup with code</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Completed Collections</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{collectedCount}</div>
            <div className="text-xs text-stone-500 mt-1">Verified food rescues</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Units Rescued</div>
            <div className="text-3xl font-extrabold text-forest-900 mt-1">{totalPortionsRescued}</div>
            <div className="text-xs text-stone-500 mt-1">Verified portions collected</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Account Status</div>
            <div className="text-xl font-bold text-emerald-700 mt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verified Recipient</span>
            </div>
            <div className="text-xs text-stone-500 mt-1">Authorized for free claims</div>
          </div>
        </div>

        {/* Action & Error Alerts */}
        {actionMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reservations History Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900">My Food Reservations</h2>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Present your unique pickup code to the donor at collection time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {STATUS_FILTERS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    statusFilter === tab.id
                      ? 'bg-forest-800 text-white shadow-xs'
                      : 'bg-stone-100 text-charcoal-600 hover:bg-stone-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
              <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchMyReservations}>
                Refresh
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl border border-stone-200 animate-pulse space-y-3">
                  <div className="h-5 bg-stone-200 rounded w-1/3" />
                  <div className="h-4 bg-stone-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-cream-100 text-forest-800 rounded-2xl flex items-center justify-center mx-auto">
                <PackageCheck className="w-7 h-7 text-forest-700" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-charcoal-900">
                  {statusFilter === 'all' ? 'No Reservations Yet' : `No ${statusFilter} reservations`}
                </h3>
                <p className="text-xs text-charcoal-500 max-w-md mx-auto">
                  Browse live surplus food listings near you and claim portions to receive your pickup verification code.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/browse">
                  <Button variant="primary" size="md" icon={Search}>
                    Browse Surplus Food
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReservations.map((resv) => {
                const listing = resv.foodListing || {};
                const donor = resv.donor || {};
                const isActive = resv.status === 'reserved';

                return (
                  <div
                    key={resv._id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-forest-50/40 border-forest-200 shadow-xs'
                        : 'bg-stone-50/50 border-stone-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Left: Food & Pickup Details */}
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={listing.imageUrl || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&q=80'}
                          alt={listing.title || 'Food item'}
                          className="w-20 h-20 rounded-xl object-cover bg-stone-200 flex-shrink-0 hidden sm:block"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(resv.status)} size="sm" className="uppercase font-bold">
                              {resv.status}
                            </Badge>
                            <span className="text-xs font-bold text-forest-900 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                              {resv.quantityReserved} {resv.unit}
                            </span>
                            {listing.category && (
                              <span className="text-[11px] text-stone-500 capitalize">
                                {listing.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-charcoal-900 truncate">
                              {listing.title || 'Food Surplus Listing'}
                            </h3>
                            {listing._id && (
                              <Link
                                to={`/food/${listing._id}`}
                                className="text-forest-800 hover:text-forest-950 flex-shrink-0"
                                title="View Listing"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>

                          <div className="text-xs text-charcoal-600 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-forest-700 flex-shrink-0" />
                              <span className="truncate">
                                <strong>{donor.name || 'Food Donor'}:</strong> {listing.pickupAddress || 'See listing details'}
                              </span>
                            </div>
                            {listing.pickupInstructions && (
                              <div className="text-[11px] text-stone-600 pl-5">
                                Instructions: {listing.pickupInstructions}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pl-5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pickup Deadline: <strong className="text-charcoal-800">{formatDateTime(resv.pickupDeadline)}</strong>
                              </span>
                              {resv.collectedAt && (
                                <span className="text-emerald-700 font-semibold">
                                  Collected: {formatDateTime(resv.collectedAt)}
                                </span>
                              )}
                              {resv.cancelledAt && (
                                <span className="text-stone-500">
                                  Cancelled: {formatDateTime(resv.cancelledAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Verification Code & Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 flex-shrink-0">
                        {isActive && resv.pickupCode && (
                          <div className="bg-white px-4 py-2.5 rounded-xl border-2 border-forest-300 flex items-center justify-between gap-3 shadow-2xs">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-4 h-4 text-forest-700" />
                              <div>
                                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                                  Pickup Code
                                </div>
                                <div className="text-base font-mono font-black tracking-widest text-forest-900">
                                  {resv.pickupCode}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(resv._id, resv.pickupCode)}
                              className="p-1.5 rounded-lg hover:bg-forest-50 text-forest-800 text-xs font-semibold flex items-center gap-1"
                              title="Copy pickup code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{copiedId === resv._id ? 'Copied' : ''}</span>
                            </button>
                          </div>
                        )}

                        {isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            icon={XCircle}
                            loading={cancellingId === resv._id}
                            onClick={() => handleCancelReservation(resv._id, listing.title || 'this item')}
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Cancel Reservation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
