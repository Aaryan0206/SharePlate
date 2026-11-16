import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Search, Sparkles, ArrowRight } from 'lucide-react';
import Button from '../common/Button';

export default function CtaBanner() {
  return (
    <section className="py-16 bg-cream-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-forest-800 rounded-3xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden shadow-2xl">
          
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-sage-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-700/80 text-sage-200 text-xs font-semibold border border-forest-600">
              <Sparkles className="w-3.5 h-3.5 text-sage-300" />
              <span>Join the Movement Today</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to turn excess food into community care?
            </h2>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
              Whether you are a cafeteria manager closing down after lunch or a neighbor seeking fresh meals, every plate shared brings us closer to a zero-waste city.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
              <Link to="/browse" className="w-full sm:w-auto">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  icon={Search}
                  className="w-full sm:w-auto bg-white text-forest-900 hover:bg-cream-50 font-bold"
                >
                  Browse Nearby Food
                </Button>
              </Link>

              <Link to="/donate" className="w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  size="lg" 
                  icon={HeartHandshake}
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10"
                >
                  Post Food Donation
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
