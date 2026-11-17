import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  MapPin, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Crosshair,
  Compass,
  ArrowRight
} from 'lucide-react';
import FoodCard from '../components/listings/FoodCard';
import ClaimPortionModal from '../components/listings/ClaimPortionModal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { MOCK_LISTINGS } from '../data/mockListings';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'cooked meals', label: 'Cooked Meals' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'fruits and vegetables', label: 'Fruits & Veggies' },
  { id: 'packaged food', label: 'Packaged Food' },
  { id: 'groceries', label: 'Groceries' },
  { id: 'other', label: 'Other' },
];

export default function BrowsePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Query States
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, expirySoonest, quantityDesc, distance
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');

  // Geospatial Search States (Phase 4)
  const [nearMe, setNearMe] = useState(false);
  const [nearMeRadius, setNearMeRadius] = useState(10);
  const [userCoords, setUserCoords] = useState([77.5946, 12.9716]); // [longitude, latitude] GeoJSON
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalListings, setTotalListings] = useState(0);

  // Direct Claim Portion Modal State
  const [claimListing, setClaimListing] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Fetch listings from MongoDB backend
  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '9',
        status: 'available',
        sort: sortBy,
      });

      if (category && category !== 'all') {
        params.append('category', category);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      if (minQuantity) {
        params.append('minQuantity', minQuantity);
      }
      if (maxQuantity) {
        params.append('maxQuantity', maxQuantity);
      }

      if (nearMe && userCoords) {
        params.append('longitude', userCoords[0].toString());
        params.append('latitude', userCoords[1].toString());
        params.append('radiusKm', nearMeRadius.toString());
        params.set('sort', 'distance');
      }

      const res = await fetch(`/api/food?${params.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch listings');
      }

      setListings(data.listings || []);
      setTotalPages(data.totalPages || 1);
      setTotalListings(data.totalListings || 0);
    } catch (err) {
      // Graceful fallback for static demo hosting (e.g. GitHub Pages without local backend)
      let custom = [];
      try {
        custom = JSON.parse(localStorage.getItem('shareplate_custom_listings') || '[]');
      } catch (e) {}
      let fallback = [...custom, ...MOCK_LISTINGS];
      if (category && category !== 'all') {
        const catClean = category.toLowerCase().replace(/-/g, ' ');
        fallback = fallback.filter((item) => (item.category || '').toLowerCase().replace(/-/g, ' ') === catClean);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        fallback = fallback.filter((item) => (item.title || '').toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q));
      }
      setListings(fallback);
      setTotalPages(1);
      setTotalListings(fallback.length);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [page, category, searchQuery, sortBy, minQuantity, maxQuantity, nearMe, nearMeRadius, userCoords]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Handle Geolocation for "Near Me"
  const handleToggleNearMe = () => {
    if (!nearMe) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserCoords([pos.coords.longitude, pos.coords.latitude]);
            setNearMe(true);
            setPage(1);
          },
          () => {
            // Fallback to central Bangalore coords
            setUserCoords([77.5946, 12.9716]);
            setNearMe(true);
            setPage(1);
          }
        );
      } else {
        setUserCoords([77.5946, 12.9716]);
        setNearMe(true);
        setPage(1);
      }
    } else {
      setNearMe(false);
      setPage(1);
    }
  };

  // Reset to page 1 on filter changes
  const handleCategoryChange = (catId) => {
    setCategory(catId);
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchListings();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategory('all');
    setSortBy('newest');
    setMinQuantity('');
    setMaxQuantity('');
    setNearMe(false);
    setPage(1);
  };

  return (
    <div className="py-10 bg-cream-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-800 bg-forest-100/60 px-3 py-1 rounded-full w-fit mb-2">
            <MapPin className="w-3.5 h-3.5 text-forest-700" />
            <span>MongoDB Live Surplus Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            Browse Available Surplus Food
          </h1>
          <p className="text-sm sm:text-base text-charcoal-600 mt-1 max-w-2xl">
            Real-time surplus portions from local cafeterias, bakeries, and markets. Wholesome, inspected, and free to reserve.
          </p>
        </div>

        {/* Controls Bar: Search & Filters */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/90 shadow-subtle space-y-5">
          
          {/* Search Row */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search food by title or ingredient (e.g. Basmati, Sourdough, Apples, Curry)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-forest-600 text-sm bg-cream-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setPage(1); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-stone-200 bg-white text-xs sm:text-sm font-medium text-charcoal-700">
                <ArrowUpDown className="w-4 h-4 text-stone-400" />
                <span className="text-stone-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="bg-transparent focus:outline-none font-semibold text-forest-900 cursor-pointer"
                >
                  <option value="newest">Newest First</option>
                  <option value="expirySoonest">Expiry Soonest</option>
                  <option value="quantityDesc">Highest Quantity</option>
                </select>
              </div>

              <Button variant="primary" size="md" type="submit">
                Search
              </Button>

              <Button
                variant={nearMe ? "primary" : "outline"}
                size="md"
                type="button"
                onClick={handleToggleNearMe}
                icon={Crosshair}
                className={nearMe ? "bg-forest-800 text-white" : ""}
              >
                {nearMe ? `Near Me (${nearMeRadius} km)` : "Near Me"}
              </Button>
            </div>
          </form>

          {/* Active Near Me Radius Filter Controls */}
          {nearMe && (
            <div className="p-3 bg-forest-50 border border-forest-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-forest-900">
                <Compass className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Geospatial Filter Active: within <strong className="text-forest-800">{nearMeRadius} km</strong> of{' '}
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-forest-200 font-semibold">
                    [{userCoords[0].toFixed(4)}, {userCoords[1].toFixed(4)}]
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-medium">Radius:</span>
                {[1, 3, 5, 10, 25, 50].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setNearMeRadius(r); setPage(1); }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-colors ${
                      nearMeRadius === r
                        ? 'bg-forest-800 text-white shadow-2xs'
                        : 'bg-white text-stone-700 hover:bg-forest-100 border border-stone-200'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
                <Link
                  to="/map"
                  className="ml-2 inline-flex items-center gap-1 font-bold text-forest-800 hover:text-forest-950 underline"
                >
                  <span>Open Interactive Map</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Category Tabs Row */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  category === cat.id
                    ? 'bg-forest-800 text-white shadow-xs'
                    : 'bg-stone-100 text-charcoal-600 hover:bg-stone-200/70'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Quantity Range & Reset Filters */}
          <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-stone-500 font-medium">Quantity range:</span>
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={minQuantity}
                onChange={(e) => { setMinQuantity(e.target.value); setPage(1); }}
                className="w-20 px-2.5 py-1 rounded-lg border border-stone-200 text-xs"
              />
              <span className="text-stone-400">&mdash;</span>
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={maxQuantity}
                onChange={(e) => { setMaxQuantity(e.target.value); setPage(1); }}
                className="w-20 px-2.5 py-1 rounded-lg border border-stone-200 text-xs"
              />

              {(searchQuery || category !== 'all' || minQuantity || maxQuantity || sortBy !== 'newest') && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex items-center gap-1 text-xs text-forest-800 hover:underline font-semibold ml-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            <div className="text-stone-500">
              Showing <span className="font-bold text-charcoal-900">{totalListings}</span> verified surplus listings in database
            </div>
          </div>

        </div>

        {/* Content Area: Loading Skeletons, Error, Empty State, or Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden p-4 space-y-4 animate-pulse">
                <div className="h-44 bg-stone-200 rounded-xl w-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-200 rounded w-full" />
                  <div className="h-3 bg-stone-200 rounded w-2/3" />
                </div>
                <div className="pt-2 flex justify-between">
                  <div className="h-8 bg-stone-200 rounded w-24" />
                  <div className="h-8 bg-stone-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-200 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">Unable to load food listings</h3>
            <p className="text-xs text-charcoal-500">{error}</p>
            <Button variant="primary" size="sm" onClick={fetchListings}>
              Retry Query
            </Button>
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {listings.map((item) => (
                <FoodCard
                  key={item._id}
                  listing={item}
                  onReserve={(listing) => {
                    setClaimListing(listing);
                    setIsClaimModalOpen(true);
                  }}
                  onSelect={(listing) => {
                    setClaimListing(listing);
                    setIsClaimModalOpen(true);
                  }}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-charcoal-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1 text-xs font-bold text-forest-900">
                  <span className="px-3 py-1.5 rounded-lg bg-forest-800 text-white">
                    {page}
                  </span>
                  <span className="text-stone-400">/</span>
                  <span className="px-2 text-stone-600">{totalPages}</span>
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-charcoal-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-charcoal-900">No surplus food listings found</h3>
              <p className="text-xs text-charcoal-500">
                No active food donations match your current filters. Try resetting filters or checking another category.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Reset Filters
            </Button>
          </div>
        )}

      </div>

      {/* Direct Claim Portion Modal */}
      <ClaimPortionModal
        listing={claimListing}
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimListing(null);
        }}
        onReserveSuccess={() => {
          fetchListings();
        }}
      />
    </div>
  );
}
