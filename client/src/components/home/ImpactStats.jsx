import React from 'react';
import { 
  Utensils, 
  Scale, 
  Activity, 
  Leaf, 
  Building2, 
  HeartHandshake,
  TrendingUp,
  Info
} from 'lucide-react';
import { MOCK_IMPACT_STATS } from '../../data/mockListings';

export default function ImpactStats() {
  const stats = [
    {
      label: 'Meals Redistributed',
      value: MOCK_IMPACT_STATS.mealsRedistributed,
      subtext: 'Provided to students & shelters',
      icon: Utensils,
      color: 'forest'
    },
    {
      label: 'Food Rescued in Weight',
      value: MOCK_IMPACT_STATS.foodSavedKg,
      subtext: 'Diverted from municipal landfills',
      icon: Scale,
      color: 'sage'
    },
    {
      label: 'CO₂e Emissions Prevented',
      value: MOCK_IMPACT_STATS.co2PreventedKg,
      subtext: 'Greenhouse gases mitigated',
      icon: Leaf,
      color: 'emerald'
    },
    {
      label: 'Active Donors & Partners',
      value: MOCK_IMPACT_STATS.activeDonors,
      subtext: 'Hostels, cafes & event organizers',
      icon: Building2,
      color: 'terracotta'
    }
  ];

  return (
    <section id="impact" className="py-14 bg-white border-y border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-800 bg-forest-50 px-3 py-1 rounded-full mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-forest-700" />
              Community Environmental Ledger
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">
              Measuring real change across campus & city
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 max-w-fit">
            <Info className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
            <span>Updated in real-time via MongoDB aggregation pipeline</span>
          </div>
        </div>

        {/* 4-Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="bg-cream-50/70 rounded-2xl p-6 border border-stone-200/80 hover:border-forest-300 hover:bg-cream-50 transition-all duration-300 shadow-subtle group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-forest-800 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-sage-300" />
                  </div>
                  <span className="text-[11px] font-semibold text-forest-700 bg-forest-100/60 px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-forest-900 tracking-tight font-sans">
                  {item.value}
                </div>

                <div className="text-sm font-semibold text-charcoal-900 mt-1">
                  {item.label}
                </div>

                <p className="text-xs text-charcoal-500 mt-1.5 leading-relaxed">
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
