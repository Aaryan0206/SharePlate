import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  MapPin, 
  Search, 
  HeartHandshake, 
  ShieldCheck, 
  Leaf, 
  Sparkles,
  Users
} from 'lucide-react';
import Button from '../common/Button';
import Badge from '../common/Badge';

export default function HeroSection({ onSearchClick }) {
  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-gradient-to-b from-cream-50 via-cream-100/50 to-cream-50">
      {/* Background soft ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-sage-200/20 blur-3xl pointer-events-none rounded-full" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline and Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-200 text-forest-800 text-xs sm:text-sm font-medium shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hyperlocal Surplus Food Sharing Platform</span>
              <span className="text-forest-400">&bull;</span>
              <span className="text-forest-700 font-semibold">Zero Waste</span>
            </div>

            {/* Headline */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal-900 tracking-tight leading-[1.12]">
                Good food deserves <br className="hidden sm:inline" />
                <span className="text-forest-800 underline decoration-sage-400 decoration-wavy decoration-2 underline-offset-8">
                  another chance.
                </span>
              </h1>
              <p className="text-lg sm:text-xl font-medium text-forest-900/80 pt-1">
                Share more. Waste less.
              </p>
            </div>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-charcoal-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Every day, wholesome meals from campus cafeterias, artisan bakeries, banquet halls, and local kitchens go to waste. SharePlate unites food donors with students, families, and community shelters in minutes.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link to="/browse" className="w-full sm:w-auto">
                <Button 
                  variant="primary" 
                  size="lg" 
                  icon={Search} 
                  iconPosition="left"
                  className="w-full sm:w-auto shadow-md hover:shadow-lg"
                >
                  Find Food Nearby
                </Button>
              </Link>

              <Link to="/donate" className="w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  icon={HeartHandshake}
                  iconPosition="left"
                  className="w-full sm:w-auto"
                >
                  Share Surplus Food
                </Button>
              </Link>
            </div>

            {/* Trust points */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs text-charcoal-600 font-medium">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest-700" />
                <span>Verified Clean Food Donors</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-forest-700" />
                <span>Real-Time Geo Radius (2dsphere)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Leaf className="w-4 h-4 text-forest-700" />
                <span>100% Free Community Redistribution</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Composition */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Visual Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80"
                  alt="Community members sharing wholesome surplus food"
                  className="w-full h-80 sm:h-96 object-cover hover:scale-105 transition-transform duration-700"
                />
                
                {/* Subtle gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/70 via-transparent to-transparent" />

                {/* Bottom caption overlay */}
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-white/90 backdrop-blur-md border border-white/40 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-semibold text-charcoal-900">
                    <span className="flex items-center gap-1.5 text-forest-800">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Live Community Rescues Today
                    </span>
                    <span className="text-terracotta-500 font-mono font-bold">24 Active Listings</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1 - Top Left */}
              <div className="absolute -top-4 -left-4 sm:-left-6 bg-white rounded-2xl p-3.5 shadow-xl border border-stone-200/80 flex items-center gap-3 animate-bounce-subtle">
                <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white">
                  <Leaf className="w-5 h-5 text-sage-300" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 font-medium">Food Rescued</div>
                  <div className="text-base font-bold text-forest-900">7,120+ kg</div>
                </div>
              </div>

              {/* Floating Badge 2 - Bottom Right */}
              <div className="absolute -bottom-5 -right-4 sm:-right-6 bg-white rounded-2xl p-3.5 shadow-xl border border-stone-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-800">
                  <Users className="w-5 h-5 text-forest-800" />
                </div>
                <div>
                  <div className="text-xs text-stone-500 font-medium">Meals Redistributed</div>
                  <div className="text-base font-bold text-forest-900">16,450+ meals</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
