import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  Filter, 
  Soup, 
  Croissant, 
  Carrot, 
  Package, 
  ShoppingBag, 
  Coffee,
  CheckCircle2,
  Database
} from 'lucide-react';
import { MOCK_CATEGORIES, MOCK_LISTINGS } from '../../data/mockListings';
import FoodCard from '../listings/FoodCard';
import FoodDetailModal from '../listings/FoodDetailModal';
import ClaimPortionModal from '../listings/ClaimPortionModal';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function FeaturedListings() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [claimListing, setClaimListing] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Live database listings state
  const [dbListings, setDbListings] = useState([]);
  const [isLive, setIsLive] = useState(false);

  // Fetch real listings from MongoDB
  useEffect(() => {
    const fetchLiveListings = async () => {
      try {
        const res = await fetch('/api/food?limit=6&sort=newest');
        const data = await res.json();
        if (res.ok && data.success && data.listings?.length > 0) {
          setDbListings(data.listings);
          setIsLive(true);
        } else {
          setDbListings(MOCK_LISTINGS);
          setIsLive(false);
        }
      } catch (err) {
        setDbListings(MOCK_LISTINGS);
        setIsLive(false);
      }
    };

    fetchLiveListings();
  }, []);

  const activeSource = dbListings.length > 0 ? dbListings : MOCK_LISTINGS;

  // Filter listings based on active category
  const filteredListings = activeCategory === 'all'
    ? activeSource
    : activeSource.filter((item) => {
        const itemCat = (item.category || '').toLowerCase().replace(/-/g, ' ');
        const activeCat = activeCategory.toLowerCase().replace(/-/g, ' ');
        return itemCat === activeCat;
      });

  const handleSelectListing = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const handleReserveSuccess = (listing, quantity) => {
    setIsModalOpen(false);
    setToastMessage(`Reserved ${quantity} ${listing.unit} of "${listing.title}" successfully!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Soup': return Soup;
      case 'Croissant': return Croissant;
      case 'Carrot': return Carrot;
      case 'Package': return Package;
      case 'ShoppingBag': return ShoppingBag;
      case 'Coffee': return Coffee;
      default: return Sparkles;
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-forest-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-forest-700 animate-in slide-in-from-bottom duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-forest-700" />
              <span>Available Right Now</span>
              {isLive && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  MongoDB Live
                </span>
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
              Featured Surplus Ready for Collection
            </h2>
            <p className="text-sm sm:text-base text-charcoal-600 mt-1 max-w-xl">
              Freshly posted by university cafeterias, artisan cafes, and local grocers. Free to reserve for immediate pickup.
            </p>
          </div>

          <Link to="/browse">
            <Button variant="outline" size="md" icon={ArrowRight} iconPosition="right">
              View Full Food Directory
            </Button>
          </Link>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
          {MOCK_CATEGORIES.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  isSelected
                    ? 'bg-forest-800 text-white shadow-sm ring-2 ring-forest-800/20'
                    : 'bg-cream-50 text-charcoal-700 hover:bg-cream-100 hover:text-forest-900 border border-stone-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sage-300' : 'text-stone-500'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Food Listings Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredListings.map((listing) => (
            <FoodCard
              key={listing._id || listing.id}
              listing={listing}
              onSelect={handleSelectListing}
              onReserve={(item) => {
                setClaimListing(item);
                setIsClaimModalOpen(true);
              }}
            />
          ))}
        </div>

        {/* Bottom Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-cream-50 border border-cream-200/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-800 text-white flex items-center justify-center flex-shrink-0">
              <Filter className="w-5 h-5 text-sage-300" />
            </div>
            <div>
              <div className="text-sm font-bold text-forest-900">Looking for a specific dietary category or location?</div>
              <div className="text-xs text-charcoal-600">Explore listings filtered by exact food categories, quantity, and pickup windows.</div>
            </div>
          </div>
          <Link to="/browse">
            <Button variant="secondary" size="sm">
              Open Advanced Search
            </Button>
          </Link>
        </div>

      </div>

      {/* Food Detail Modal */}
      <FoodDetailModal
        listing={selectedListing}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReserveSuccess={handleReserveSuccess}
      />

      {/* Direct Claim Portion Modal */}
      <ClaimPortionModal
        listing={claimListing}
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setClaimListing(null);
        }}
        onReserveSuccess={(listing, quantity, reservation) => {
          handleReserveSuccess(listing, quantity);
        }}
      />
    </section>
  );
}
