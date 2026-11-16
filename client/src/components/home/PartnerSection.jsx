import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Utensils, 
  Apple, 
  HeartHandshake, 
  Store,
  CheckCircle,
  FileText,
  TrendingDown,
  Award
} from 'lucide-react';
import { MOCK_PARTNERS } from '../../data/mockListings';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function PartnerSection() {
  const getPartnerIcon = (logo) => {
    switch (logo) {
      case 'GraduationCap': return GraduationCap;
      case 'Utensils': return Utensils;
      case 'Apple': return Apple;
      case 'HeartHandshake': return HeartHandshake;
      case 'Store': return Store;
      default: return Building2;
    }
  };

  const partnerBenefits = [
    {
      title: 'Zero Disposal & Hauling Costs',
      desc: 'Eliminate heavy municipal dumpster fees by routing edible food directly to vetted local recipients.',
      icon: TrendingDown
    },
    {
      title: 'Automated ESG & Carbon Reporting',
      desc: 'Download audit-ready reports of saved kilograms and offset CO₂ emissions for campus and corporate sustainability compliance.',
      icon: FileText
    },
    {
      title: 'Protected Good Samaritan Shield',
      desc: 'Compliant with institutional food recovery acts that protect honest surplus food donations made in good faith.',
      icon: Award
    }
  ];

  return (
    <section className="py-20 bg-cream-50/70 border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <Badge variant="forest" size="md">
            Institutional Alliances
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            Trusted by Campus Dining Halls, Cafes & Food Banks
          </h2>
          <p className="text-base text-charcoal-600 leading-relaxed">
            From university dining halls preparing 2,000 daily covers to neighborhood bakeries, SharePlate provides the operational tools to eliminate surplus waste effortlessly.
          </p>
        </div>

        {/* Partner Logos Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {MOCK_PARTNERS.map((partner, idx) => {
            const Icon = getPartnerIcon(partner.logo);
            return (
              <div 
                key={idx}
                className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col items-center justify-center text-center gap-2 hover:border-forest-400 hover:shadow-subtle transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-forest-50 text-forest-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-forest-700" />
                </div>
                <div className="font-semibold text-xs text-charcoal-900 leading-tight">
                  {partner.name}
                </div>
                <div className="text-[10px] text-stone-500 font-medium">
                  {partner.type}
                </div>
              </div>
            );
          })}
        </div>

        {/* Benefit Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {partnerBenefits.map((benefit, i) => {
            const Icon = benefit.icon;
            return (
              <div 
                key={i}
                className="bg-white p-7 rounded-3xl border border-stone-200/80 shadow-subtle hover:shadow-card transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-sage-100 text-forest-800 flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6 text-forest-800" />
                </div>
                <h3 className="text-lg font-bold text-charcoal-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-charcoal-600 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
