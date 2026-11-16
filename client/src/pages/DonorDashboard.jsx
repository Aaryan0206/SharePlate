import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  PlusCircle, 
  Clock, 
  Package, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  KeyRound,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EditListingModal from '../components/listings/EditListingModal';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({ total: 0, available: 0, expired: 0, collected: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phase 5 Donor Reservations & Verification states
  const [reservations, setReservations] = useState([]);
  const [resvLoading, setResvLoading] = useState(true);
  const [pickupCodes, setPickupCodes] = useState({});
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyErrors, setVerifyErrors] = useState({});

  // Modal & Action states
  const [selectedForEdit, setSelectedForEdit] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/food/my-listings', {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch your listings');
      }

      setListings(data.listings || []);
      setStats(data.stats || { total: 0, available: 0, expired: 0, collected: 0, cancelled: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDonorReservations = useCallback(async () => {
    setResvLoading(true);
    try {
      const res = await fetch('/api/reservations/donor', {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Failed to load donor reservations:', err);
    } finally {
      setResvLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyListings();
    fetchDonorReservations();
  }, [fetchMyListings, fetchDonorReservations]);

  const handleVerifyPickup = async (e, reservationId) => {
    e.preventDefault();
    const code = (pickupCodes[reservationId] || '').trim();
    if (!code) {
      setVerifyErrors((prev) => ({ ...prev, [reservationId]: 'Please enter the pickup code.' }));
      return;
    }

    setVerifyingId(reservationId);
    setVerifyErrors((prev) => ({ ...prev, [reservationId]: '' }));

    try {
      const res = await fetch(`/api/reservations/${reservationId}/verify-pickup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pickupCode: code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Pickup verification failed');
      }

      setActionSuccess(data.message || 'Pickup verified and food collection recorded!');
      setTimeout(() => setActionSuccess(''), 5000);
      setPickupCodes((prev) => ({ ...prev, [reservationId]: '' }));
      await Promise.all([fetchDonorReservations(), fetchMyListings()]);
    } catch (err) {
      setVerifyErrors((prev) => ({ ...prev, [reservationId]: err.message }));
    } finally {
      setVerifyingId(null);
    }
  };

  // Cancel listing handler
  const handleCancel = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to cancel the surplus listing: "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/food/${listingId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to cancel listing');
      }

      setActionSuccess(`Listing "${title}" was successfully cancelled.`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchMyListings();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditClick = (listing) => {
    setSelectedForEdit(listing);
    setIsEditOpen(true);
  };

  const handleListingUpdated = () => {
    setActionSuccess('Listing updated successfully.');
    setTimeout(() => setActionSuccess(''), 4000);
    fetchMyListings();
  };

  const formatShortTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="py-10 bg-cream-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Success toast */}
        {actionSuccess && (
          <div className="fixed bottom-6 right-6 z-50 bg-forest-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-forest-700 animate-in slide-in-from-bottom">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
        )}

        {/* Donor Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest-800 text-sage-200 flex items-center justify-center text-2xl font-bold shadow-md">
              <Building2 className="w-8 h-8 text-sage-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="forest" size="sm">Donor Portal</Badge>
                <span className="text-xs text-stone-500 font-medium">Verified Partner</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight mt-1">
                {user?.name || 'Partner Food Donor'}
              </h1>
              <p className="text-xs sm:text-sm text-charcoal-600 mt-0.5">
                {user?.email} &bull; Role: <span className="font-semibold text-forest-800 capitalize">{user?.role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link to="/donate" className="w-full md:w-auto">
              <Button variant="primary" size="md" icon={PlusCircle} className="w-full md:w-auto">
                Share New Surplus
              </Button>
            </Link>
          </div>
        </div>

        {/* Phase 3 Live Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Live Active Listings</div>
            <div className="text-3xl font-extrabold text-forest-900 mt-1">{stats.available}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Available for community pickup</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Total Listings Created</div>
            <div className="text-3xl font-extrabold text-forest-900 mt-1">{stats.total}</div>
            <div className="text-xs text-stone-500 mt-1">Logged in MongoDB database</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Past / Expired Listings</div>
            <div className="text-3xl font-extrabold text-amber-700 mt-1">{stats.expired}</div>
            <div className="text-xs text-stone-500 mt-1">Archived safely from public search</div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-subtle">
            <div className="text-xs text-stone-500 font-medium">Cancelled Listings</div>
            <div className="text-3xl font-extrabold text-stone-500 mt-1">{stats.cancelled}</div>
            <div className="text-xs text-stone-500 mt-1">Managed securely by donor</div>
          </div>
        </div>

        {/* My Food Listings Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-charcoal-900 tracking-tight">
                My Food Listings Management
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Manage your active and past surplus food donations stored in MongoDB.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchMyListings}>
                Refresh
              </Button>
              <Link to="/donate">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Post Surplus
                </Button>
              </Link>
            </div>
          </div>

          {/* Listings Table or Empty State */}
          {loading ? (
            <div className="py-12 text-center text-xs text-stone-500">
              Loading your surplus listings from MongoDB...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-xs">
              {error}
            </div>
          ) : listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-y border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Food Item & Category</th>
                    <th className="py-3 px-4">Available Quantity</th>
                    <th className="py-3 px-4">Pickup Window</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-charcoal-800">
                  {listings.map((item) => {
                    const isExpired = new Date(item.expiryTime) <= new Date();
                    const isEditable = item.status === 'available' && !isExpired;
                    const isCancellable = item.status === 'available' && !isExpired;

                    return (
                      <tr key={item._id} className="hover:bg-cream-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <Link to={`/food/${item._id}`} className="font-bold text-charcoal-900 hover:text-forest-800">
                            {item.title}
                          </Link>
                          <div className="text-[11px] text-stone-500 capitalize">{item.category}</div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-bold text-forest-900">
                            {item.availableQuantity ?? item.quantity} / {item.originalQuantity ?? item.quantity} {item.unit}
                          </div>
                          {(item.reservedQuantity > 0 || item.collectedQuantity > 0) && (
                            <div className="text-[10px] text-stone-500">
                              {item.reservedQuantity || 0} reserved &bull; {item.collectedQuantity || 0} collected
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-stone-600">
                          <div>{formatShortTime(item.pickupStartTime)}</div>
                          <div className="text-[10px] text-stone-400">to {formatShortTime(item.pickupEndTime)}</div>
                        </td>

                        <td className="py-4 px-4 text-amber-800 font-medium">
                          {formatShortTime(item.expiryTime)}
                        </td>

                        <td className="py-4 px-4">
                          {isExpired ? (
                            <Badge variant="warning" size="sm">Expired</Badge>
                          ) : item.status === 'available' ? (
                            <Badge variant="success" size="sm">Available</Badge>
                          ) : item.status === 'cancelled' ? (
                            <Badge variant="default" size="sm">Cancelled</Badge>
                          ) : (
                            <Badge variant="info" size="sm">{item.status}</Badge>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Link to={`/food/${item._id}`}>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700"
                              title="View Public Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </Link>

                          {isEditable && (
                            <button
                              type="button"
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 rounded-lg bg-forest-50 hover:bg-forest-100 text-forest-800"
                              title="Edit Listing"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isCancellable && (
                            <button
                              type="button"
                              onClick={() => handleCancel(item._id, item.title)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                              title="Cancel Listing"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center max-w-sm mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cream-100 text-forest-800 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">You haven't posted any surplus food yet</h3>
              <p className="text-xs text-charcoal-500">
                Share excess edible food from your cafeteria, bakery, or hostel in under 2 minutes.
              </p>
              <Link to="/donate">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  Create First Listing
                </Button>
              </Link>
            </div>
          )}

        </div>

        {/* Phase 5: Incoming Reservations & Pickup Verification */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-card space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-forest-800" />
                <h2 className="text-xl font-bold text-charcoal-900">
                  Incoming Reservations & Pickup Verification
                </h2>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Ask the recipient for their 8-character pickup code when they arrive to verify collection.
              </p>
            </div>
            <Button variant="ghost" size="sm" icon={RefreshCw} onClick={fetchDonorReservations}>
              Refresh Queue
            </Button>
          </div>

          {resvLoading ? (
            <div className="py-8 text-center text-xs text-stone-500">
              Loading incoming reservations...
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <UserCheck className="w-8 h-8 text-stone-300 mx-auto" />
              <div className="text-sm font-bold text-charcoal-800">No Reservations Yet</div>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                When community recipients reserve portions of your surplus listings, they will appear here for pickup verification.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((resv) => {
                const isActive = resv.status === 'reserved';
                const listing = resv.foodListing || {};
                const recipient = resv.recipient || {};

                return (
                  <div
                    key={resv._id}
                    className={`p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-forest-50/40 border-forest-200'
                        : 'bg-stone-50/60 border-stone-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={
                            resv.status === 'reserved'
                              ? 'forest'
                              : resv.status === 'collected'
                              ? 'success'
                              : resv.status === 'expired'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                          className="uppercase font-bold"
                        >
                          {resv.status}
                        </Badge>
                        <span className="text-xs font-bold text-forest-900 bg-white px-2.5 py-0.5 rounded-full border border-stone-200">
                          {resv.quantityReserved} {resv.unit}
                        </span>
                        {resv.pickupCodeHint && (
                          <span className="text-[11px] font-mono text-stone-500">
                            Hint: {resv.pickupCodeHint}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-charcoal-900">
                        {listing.title || 'Food Listing'}
                      </h4>

                      <div className="text-xs text-charcoal-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>
                          Recipient: <strong>{recipient.name || 'Community Member'}</strong> ({recipient.organizationType || 'Individual'})
                        </span>
                        <span>
                          Deadline: <strong>{formatShortTime(resv.pickupDeadline)}</strong>
                        </span>
                        {resv.collectedAt && (
                          <span className="text-emerald-700 font-semibold">
                            Collected at {formatShortTime(resv.collectedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <form
                        onSubmit={(e) => handleVerifyPickup(e, resv._id)}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0"
                      >
                        <div>
                          <input
                            type="text"
                            placeholder="Enter code (e.g. K7M3-P9Q2)"
                            value={pickupCodes[resv._id] || ''}
                            onChange={(e) =>
                              setPickupCodes((prev) => ({
                                ...prev,
                                [resv._id]: e.target.value.toUpperCase(),
                              }))
                            }
                            className="px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-forest-600 bg-white w-full sm:w-52"
                          />
                          {verifyErrors[resv._id] && (
                            <p className="text-[11px] text-red-600 font-medium mt-1">
                              {verifyErrors[resv._id]}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          type="submit"
                          loading={verifyingId === resv._id}
                          icon={CheckCircle2}
                        >
                          Verify & Collect
                        </Button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Edit Listing Modal */}
      <EditListingModal
        listing={selectedForEdit}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedForEdit(null);
        }}
        onListingUpdated={handleListingUpdated}
      />
    </div>
  );
}
