import React from 'react';
import { Quote, Star, ShieldCheck, Heart } from 'lucide-react';
import { MOCK_TESTIMONIALS } from '../../data/mockListings';
import Badge from '../common/Badge';

export default function Testimonials() {
  return (
    <section className="py-20 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge variant="forest" size="md">
            Community Voices
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            Stories from the Frontlines of Food Rescue
          </h2>
          <p className="text-base text-charcoal-600 leading-relaxed">
            Discover how dining staff, local artisans, and students are building a mutual support network that transforms excess food into nourishment.
          </p>
        </div>

        {/* 3 Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {MOCK_TESTIMONIALS.map((t) => (
            <div 
              key={t.id}
              className="bg-white rounded-3xl p-8 border border-stone-200/90 shadow-subtle hover:shadow-card transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Quote Icon & Stars */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-xl bg-sage-100 flex items-center justify-center text-forest-800">
                    <Quote className="w-5 h-5 fill-current" />
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>

                {/* Quote content */}
                <p className="text-sm text-charcoal-700 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author footer */}
              <div className="mt-8 pt-5 border-t border-stone-100 flex items-center gap-3.5">
                <img 
                  src={t.avatar} 
                  alt={t.author} 
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-forest-100"
                />
                <div>
                  <div className="text-sm font-bold text-charcoal-900 flex items-center gap-1.5">
                    {t.author}
                    {t.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-xs text-charcoal-500 font-medium">
                    {t.role}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Demo data notice */}
        <div className="mt-12 text-center">
          <span className="text-xs text-stone-500 bg-stone-100/80 px-3 py-1 rounded-full border border-stone-200">
            Note: Testimonials are realistic simulated community personas for academic evaluation.
          </span>
        </div>

      </div>
    </section>
  );
}
