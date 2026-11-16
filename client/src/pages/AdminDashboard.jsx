import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  ClipboardCheck,
  Scale,
  History,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Ban,
  UserCheck,
  UserX,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AdminAnalyticsSection from '../components/admin/AdminAnalyticsSection';

const TABS = [
  { id: 'overview', label: 'Overview & Analytics', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'listings', label: 'Food Listings', icon: Package },
  { id: 'reservations', label: 'Reservations', icon: ClipboardCheck },
  { id: 'audit', label: 'Audit Logs', icon: History },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'cooked meals', label: 'Cooked Meals' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'fruits and vegetables', label: 'Fruits & Vegetables' },
  { value: 'packaged food', label: 'Packaged Food' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'other', label: 'Other' },
];

const LISTING_STATUS_BADGE = {
  available: 'success',
  reserved: 'warning',
  collected: 'sage',
  expired: 'neutral',
  cancelled: 'default',
};

const RESERVATION_STATUS_BADGE = {
  reserved: 'warning',
  collected: 'success',
  cancelled: 'neutral',
  expired: 'default',
};

const ACTION_BADGE = {
  USER_DEACTIVATED: 'warning',
  USER_ACTIVATED: 'success',
  USER_ROLE_CHANGED: 'info',
  LISTING_MODERATED_CANCEL: 'warning',
  RESERVATION_ADMIN_CANCEL: 'warning',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Feedback banner
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Overview & Analytics state
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [days, setDays] = useState(30);

  // Users state
  const [usersData, setUsersData] = useState({ users: [], totalUsers: 0, totalPages: 1, currentPage: 1 });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userActiveFilter, setUserActiveFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);

  // Listings state
  const [listingsData, setListingsData] = useState({ listings: [], totalListings: 0, totalPages: 1, currentPage: 1 });
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingSearch, setListingSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('all');
  const [listingPage, setListingPage] = useState(1);

  // Reservations state
  const [reservationsData, setReservationsData] = useState({ reservations: [], totalReservations: 0, totalPages: 1, currentPage: 1 });
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationStatusFilter, setReservationStatusFilter] = useState('all');
  const [reservationPage, setReservationPage] = useState(1);

  // Audit logs state
  const [auditData, setAuditData] = useState({ logs: [], totalLogs: 0, totalPages: 1, currentPage: 1 });
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTargetFilter, setAuditTargetFilter] = useState('all');
  const [auditPage, setAuditPage] = useState(1);

  // Confirmation modal state
  const [modal, setModal] = useState(null);
  const [modalReason, setModalReason] = useState('');
  const [modalRole, setModalRole] = useState('recipient');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const storedToken = token || localStorage.getItem('shareplate_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (storedToken) {
        headers.Authorization = `Bearer ${storedToken}`;
      }
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || `Request failed (${res.status})`);
      }
      return data;
    },
    [token]
  );

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  };

  // Loaders
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await apiFetch('/api/admin/overview');
      setOverview(data.overview);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setOverviewLoading(false);
    }
  }, [apiFetch]);

  const fetchAnalytics = useCallback(
    async (selectedDays = days) => {
      setAnalyticsLoading(true);
      try {
        const data = await apiFetch(`/api/admin/analytics?days=${selectedDays}`);
        setAnalytics(data.analytics);
      } catch (err) {
        showFeedback('error', err.message);
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [apiFetch, days]
  );

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(userPage),
        limit: '10',
        search: userSearch.trim(),
        role: userRoleFilter,
        isActive: userActiveFilter,
      });
      const data = await apiFetch(`/api/admin/users?${params.toString()}`);
      setUsersData(data);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setUsersLoading(false);
    }
  }, [apiFetch, userPage, userSearch, userRoleFilter, userActiveFilter]);

  const fetchListings = useCallback(async () => {
    setListingsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(listingPage),
        limit: '10',
        search: listingSearch.trim(),
        status: listingStatusFilter,
        category: listingCategoryFilter,
      });
      const data = await apiFetch(`/api/admin/listings?${params.toString()}`);
      setListingsData(data);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setListingsLoading(false);
    }
  }, [apiFetch, listingPage, listingSearch, listingStatusFilter, listingCategoryFilter]);

  const fetchReservations = useCallback(async () => {
    setReservationsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(reservationPage),
        limit: '10',
        status: reservationStatusFilter,
      });
      const data = await apiFetch(`/api/admin/reservations?${params.toString()}`);
      setReservationsData(data);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setReservationsLoading(false);
    }
  }, [apiFetch, reservationPage, reservationStatusFilter]);

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(auditPage),
        limit: '10',
        actionType: auditActionFilter,
        targetType: auditTargetFilter,
      });
      const data = await apiFetch(`/api/admin/audit-logs?${params.toString()}`);
      setAuditData(data);
    } catch (err) {
      showFeedback('error', err.message);
    } finally {
      setAuditLoading(false);
    }
  }, [apiFetch, auditPage, auditActionFilter, auditTargetFilter]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchOverview();
      fetchAnalytics(days);
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [
    activeTab,
    days,
    fetchOverview,
    fetchAnalytics,
    fetchUsers,
    fetchListings,
    fetchReservations,
    fetchAuditLogs,
  ]);

  const refreshActiveTab = () => {
    if (activeTab === 'overview') {
      fetchOverview();
      fetchAnalytics(days);
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'listings') {
      fetchListings();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  };

  // Modal triggers
  const openStatusModal = (targetUser) => {
    setModal({
      type: 'USER_STATUS',
      target: targetUser,
      nextActive: !targetUser.isActive,
      title: targetUser.isActive ? 'Deactivate User Account' : 'Activate User Account',
      description: targetUser.isActive
        ? `Deactivating ${targetUser.name} (${targetUser.email}) will immediately block them from protected routes.`
        : `Reactivating ${targetUser.name} (${targetUser.email}) will restore their platform access.`,
    });
    setModalReason('');
    setModalError('');
  };

  const openRoleModal = (targetUser) => {
    setModal({
      type: 'USER_ROLE',
      target: targetUser,
      title: 'Change User Role',
      description: `Update role for ${targetUser.name} (${targetUser.email}).`,
    });
    setModalRole(targetUser.role);
    setModalReason('');
    setModalError('');
  };

  const openListingCancelModal = (listing) => {
    setModal({
      type: 'LISTING_CANCEL',
      target: listing,
      title: 'Moderate & Cancel Food Listing',
      description: `Cancelling "${listing.title}" will mark the listing cancelled and automatically cancel any active reservations while restoring reserved quantities.`,
    });
    setModalReason('');
    setModalError('');
  };

  const openReservationCancelModal = (reservation) => {
    setModal({
      type: 'RESERVATION_CANCEL',
      target: reservation,
      title: 'Admin Cancel Reservation',
      description: `Cancelling this reservation of ${reservation.quantityReserved} ${reservation.unit} will restore the reserved quantity back to the food listing.`,
    });
    setModalReason('');
    setModalError('');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!modal) return;
    if (!modalReason.trim()) {
      setModalError('Please provide an administrative reason for the audit log.');
      return;
    }

    setModalSubmitting(true);
    setModalError('');
    try {
      let result;
      if (modal.type === 'USER_STATUS') {
        result = await apiFetch(`/api/admin/users/${modal.target._id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ isActive: modal.nextActive, reason: modalReason.trim() }),
        });
        await fetchUsers();
      } else if (modal.type === 'USER_ROLE') {
        result = await apiFetch(`/api/admin/users/${modal.target._id}/role`, {
          method: 'PATCH',
          body: JSON.stringify({ role: modalRole, reason: modalReason.trim() }),
        });
        await fetchUsers();
      } else if (modal.type === 'LISTING_CANCEL') {
        result = await apiFetch(`/api/admin/listings/${modal.target._id}/cancel`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: modalReason.trim() }),
        });
        await fetchListings();
      } else if (modal.type === 'RESERVATION_CANCEL') {
        result = await apiFetch(`/api/admin/reservations/${modal.target._id}/cancel`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: modalReason.trim() }),
        });
        await fetchReservations();
      }

      showFeedback('success', result?.message || 'Action completed and logged.');
      setModal(null);
      fetchOverview();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-forest-700/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sage-500/20 border border-sage-400/30 rounded-full text-sage-200 text-xs font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Portal & Platform Governance</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                SharePlate Admin Dashboard
              </h1>
              <p className="text-sage-200/90 text-sm">
                Signed in as <span className="font-semibold text-white">{user?.name}</span> ({user?.email}). All moderation actions are recorded in the immutable audit log.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                onClick={refreshActiveTab}
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-forest-900 shadow-sm'
                      : 'bg-white/10 text-sage-100 hover:bg-white/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`flex items-center justify-between gap-3 p-4 rounded-2xl border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-semibold underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overviewLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 h-36 animate-pulse">
                    <div className="h-4 bg-stone-200 rounded w-1/2 mb-3" />
                    <div className="h-8 bg-stone-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : overview ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Users KPI */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Platform Users
                    </span>
                    <div className="p-2 rounded-xl bg-forest-50 text-forest-700">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-charcoal-900">{overview.users.total}</p>
                  <p className="text-xs text-stone-600">
                    {overview.users.donors} donors · {overview.users.recipients} recipients · {overview.users.admins} admins
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {overview.users.active} active · {overview.users.inactive} deactivated
                  </p>
                </div>

                {/* Listings KPI */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Food Listings
                    </span>
                    <div className="p-2 rounded-xl bg-sage-100 text-forest-800">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-charcoal-900">{overview.listings.total}</p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {overview.listings.availableNow} available now
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {overview.listings.byStatus?.collected || 0} collected · {overview.listings.byStatus?.cancelled || 0} cancelled
                  </p>
                </div>

                {/* Reservations KPI */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Reservations
                    </span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-charcoal-900">{overview.reservations.total}</p>
                  <p className="text-xs text-stone-600">
                    {overview.reservations.active} active · {overview.reservations.collected} collected
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {overview.reservations.cancelledAndExpired} cancelled / expired
                  </p>
                </div>

                {/* Collected Quantity By Unit KPI (never mixed!) */}
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-card space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Collected by Unit
                    </span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                      <Scale className="w-4 h-4" />
                    </div>
                  </div>
                  {overview.collectedByUnit?.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      {overview.collectedByUnit.map((u) => (
                        <div key={u.unit} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-charcoal-700 capitalize">{u.unit}</span>
                          <span className="font-bold text-forest-800">
                            {u.totalQuantity} <span className="text-xs font-normal text-stone-500">({u.collectionCount} pickups)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-stone-500 pt-2">No verified collections yet</p>
                  )}
                  <p className="text-[11px] text-stone-400 pt-1">
                    Audit logs recorded: {overview.recentAuditCount}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Analytics Charts */}
            <AdminAnalyticsSection
              analytics={analytics}
              days={days}
              onDaysChange={(newDays) => setDays(newDays)}
              loading={analyticsLoading}
            />
          </div>
        )}

        {/* TAB 2: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">User Management</h2>
                <p className="text-xs text-stone-500">
                  Search, filter, activate/deactivate accounts, or update roles. Self-lockout and last-admin demotion are blocked.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    placeholder="Search name, email, org..."
                    className="pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="donor">Donor</option>
                  <option value="recipient">Recipient</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={userActiveFilter}
                  onChange={(e) => {
                    setUserActiveFilter(e.target.value);
                    setUserPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {usersLoading ? (
              <div className="py-12 text-center text-sm text-stone-500">Loading users...</div>
            ) : usersData.users.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500">No users matched your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                      <th className="py-3 pr-4 font-semibold">User</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Joined</th>
                      <th className="py-3 pl-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {usersData.users.map((u) => {
                      const isSelf = u._id === user?.id || u._id === user?._id;
                      return (
                        <tr key={u._id} className="hover:bg-cream-50/70">
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-charcoal-900">
                              {u.name} {isSelf && <span className="text-xs text-forest-700 font-normal">(You)</span>}
                            </div>
                            <div className="text-xs text-stone-500">{u.email}</div>
                            {u.organizationName && (
                              <div className="text-xs text-stone-400">{u.organizationName}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={u.role === 'admin' ? 'forest' : u.role === 'donor' ? 'sage' : 'info'} size="sm">
                              {u.role}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={u.isActive ? 'success' : 'warning'} size="sm">
                              {u.isActive ? 'Active' : 'Deactivated'}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-500">
                            {formatDate(u.createdAt)}
                          </td>
                          <td className="py-3.5 pl-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              disabled={isSelf}
                              onClick={() => openRoleModal(u)}
                              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Change Role
                            </button>
                            <button
                              disabled={isSelf}
                              onClick={() => openStatusModal(u)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed ${
                                u.isActive
                                  ? 'border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100'
                                  : 'border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              <span>{u.isActive ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={usersData.currentPage}
              totalPages={usersData.totalPages}
              totalItems={usersData.totalUsers}
              onPageChange={setUserPage}
            />
          </div>
        )}

        {/* TAB 3: FOOD LISTINGS OVERSIGHT */}
        {activeTab === 'listings' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">Food Listings Oversight</h2>
                <p className="text-xs text-stone-500">
                  Review all surplus food listings and moderate/cancel listings when necessary while preserving reservation quantity invariants.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => {
                      setListingSearch(e.target.value);
                      setListingPage(1);
                    }}
                    placeholder="Search title or address..."
                    className="pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
                <select
                  value={listingStatusFilter}
                  onChange={(e) => {
                    setListingStatusFilter(e.target.value);
                    setListingPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="collected">Collected</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={listingCategoryFilter}
                  onChange={(e) => {
                    setListingCategoryFilter(e.target.value);
                    setListingPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {listingsLoading ? (
              <div className="py-12 text-center text-sm text-stone-500">Loading food listings...</div>
            ) : listingsData.listings.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500">No food listings matched your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                      <th className="py-3 pr-4 font-semibold">Listing</th>
                      <th className="py-3 px-4 font-semibold">Donor</th>
                      <th className="py-3 px-4 font-semibold">Quantities</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Expires</th>
                      <th className="py-3 pl-4 font-semibold text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {listingsData.listings.map((item) => {
                      const canModerate = item.status === 'available' || item.status === 'reserved';
                      return (
                        <tr key={item._id} className="hover:bg-cream-50/70">
                          <td className="py-3.5 pr-4">
                            <div className="font-semibold text-charcoal-900">{item.title}</div>
                            <div className="text-xs text-stone-500 capitalize">{item.category}</div>
                            <div className="text-xs text-stone-400 truncate max-w-xs">{item.pickupAddress}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            <div className="font-medium text-charcoal-800">{item.donor?.name || 'Unknown'}</div>
                            <div className="text-stone-500">{item.donor?.email || ''}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-600">
                            <div>Avail: <strong>{item.availableQuantity}</strong> {item.unit}</div>
                            <div className="text-stone-400">
                              Res: {item.reservedQuantity} · Col: {item.collectedQuantity} · Orig: {item.originalQuantity}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={LISTING_STATUS_BADGE[item.status] || 'neutral'} size="sm">
                              {item.status}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-stone-500">
                            {formatDate(item.expiresAt)}
                          </td>
                          <td className="py-3.5 pl-4 text-right">
                            <button
                              disabled={!canModerate}
                              onClick={() => openListingCancelModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Cancel Listing</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={listingsData.currentPage}
              totalPages={listingsData.totalPages}
              totalItems={listingsData.totalListings}
              onPageChange={setListingPage}
            />
          </div>
        )}

        {/* TAB 4: RESERVATIONS OVERSIGHT */}
        {activeTab === 'reservations' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">Reservations Oversight</h2>
                <p className="text-xs text-stone-500">
                  Monitor reservations across the platform. Verification codes are never exposed in admin views.
                </p>
              </div>
              <select
                value={reservationStatusFilter}
                onChange={(e) => {
                  setReservationStatusFilter(e.target.value);
                  setReservationPage(1);
                }}
                className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="reserved">Reserved</option>
                <option value="collected">Collected</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {reservationsLoading ? (
              <div className="py-12 text-center text-sm text-stone-500">Loading reservations...</div>
            ) : reservationsData.reservations.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500">No reservations matched your filter.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                      <th className="py-3 pr-4 font-semibold">Food Listing</th>
                      <th className="py-3 px-4 font-semibold">Recipient</th>
                      <th className="py-3 px-4 font-semibold">Donor</th>
                      <th className="py-3 px-4 font-semibold">Quantity</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Deadline</th>
                      <th className="py-3 pl-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {reservationsData.reservations.map((resv) => (
                      <tr key={resv._id} className="hover:bg-cream-50/70">
                        <td className="py-3.5 pr-4">
                          <div className="font-semibold text-charcoal-900">
                            {resv.listing?.title || 'Deleted Listing'}
                          </div>
                          <div className="text-xs text-stone-400">
                            Created {formatDate(resv.createdAt)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-charcoal-800">{resv.recipient?.name || 'Unknown'}</div>
                          <div className="text-stone-500">{resv.recipient?.email || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-charcoal-800">{resv.donor?.name || 'Unknown'}</div>
                          <div className="text-stone-500">{resv.donor?.email || ''}</div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-forest-800">
                          {resv.quantityReserved} {resv.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={RESERVATION_STATUS_BADGE[resv.status] || 'neutral'} size="sm">
                            {resv.status}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-500">
                          {formatDate(resv.pickupDeadline)}
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            disabled={resv.status !== 'reserved'}
                            onClick={() => openReservationCancelModal(resv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancel</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={reservationsData.currentPage}
              totalPages={reservationsData.totalPages}
              totalItems={reservationsData.totalReservations}
              onPageChange={setReservationPage}
            />
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-stone-200 shadow-card p-6 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">Administrative Audit Logs</h2>
                <p className="text-xs text-stone-500">
                  Read-only ledger of all administrative user, listing, and reservation moderation events.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  <option value="all">All Actions</option>
                  <option value="USER_DEACTIVATED">User Deactivated</option>
                  <option value="USER_ACTIVATED">User Activated</option>
                  <option value="USER_ROLE_CHANGED">Role Changed</option>
                  <option value="LISTING_MODERATED_CANCEL">Listing Cancelled</option>
                  <option value="RESERVATION_ADMIN_CANCEL">Reservation Cancelled</option>
                </select>
                <select
                  value={auditTargetFilter}
                  onChange={(e) => {
                    setAuditTargetFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                >
                  <option value="all">All Targets</option>
                  <option value="User">User</option>
                  <option value="FoodListing">FoodListing</option>
                  <option value="Reservation">Reservation</option>
                </select>
              </div>
            </div>

            {auditLoading ? (
              <div className="py-12 text-center text-sm text-stone-500">Loading audit logs...</div>
            ) : auditData.logs.length === 0 ? (
              <div className="py-12 text-center text-sm text-stone-500">No audit logs recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-xs uppercase text-stone-500">
                      <th className="py-3 pr-4 font-semibold">Timestamp</th>
                      <th className="py-3 px-4 font-semibold">Admin</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                      <th className="py-3 px-4 font-semibold">Target</th>
                      <th className="py-3 pl-4 font-semibold">Reason & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {auditData.logs.map((log) => (
                      <tr key={log._id} className="hover:bg-cream-50/70">
                        <td className="py-3.5 pr-4 text-xs text-stone-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <div className="font-medium text-charcoal-800">{log.admin?.name || 'Admin'}</div>
                          <div className="text-stone-500">{log.admin?.email || ''}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={ACTION_BADGE[log.actionType] || 'neutral'} size="sm">
                            {log.actionType}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-stone-600">
                          {log.targetType} #{String(log.targetId).slice(-6)}
                        </td>
                        <td className="py-3.5 pl-4 text-xs text-charcoal-700">
                          <div className="font-medium">{log.reason || 'No reason provided'}</div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="text-stone-400 font-mono mt-0.5 break-all">
                              {JSON.stringify(log.metadata)}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={auditData.currentPage}
              totalPages={auditData.totalPages}
              totalItems={auditData.totalLogs}
              onPageChange={setAuditPage}
            />
          </div>
        )}
      </div>

      {/* Confirmation & Reason Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-charcoal-900">{modal.title}</h3>
                <p className="text-xs text-stone-600 mt-1">{modal.description}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {modal.type === 'USER_ROLE' && (
                <div>
                  <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
                    New Role
                  </label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl bg-white"
                  >
                    <option value="donor">donor</option>
                    <option value="recipient">recipient</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">
                  Audit Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  placeholder="Explain why this administrative action is being taken..."
                  className="w-full px-3 py-2 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-600"
                />
              </div>

              {modalError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {modalError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModal(null)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={modalSubmitting}
                >
                  Confirm Action
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ currentPage, totalPages, totalItems, onPageChange }) {
  if (!totalPages || totalPages <= 1) {
    return (
      <div className="text-xs text-stone-500 pt-2">
        Showing {totalItems || 0} total record{totalItems === 1 ? '' : 's'}
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-600">
      <span>
        Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalItems} total)
      </span>
      <div className="flex items-center gap-2">
        <button
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <button
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
