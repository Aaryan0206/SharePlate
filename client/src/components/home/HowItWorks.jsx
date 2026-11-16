import React from 'react';
import { 
  UploadCloud, 
  MapPin, 
  HeartHandshake, 
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '../../data/mockListings';
import Badge from '../common/Badge';

export default function HowItWorks() {
  const getStepIcon = (iconName) => {
    switch (iconName) {
      case 'UploadCloud': return UploadCloud;
      case 'MapPin': return MapPin;
      case 'HeartHandshake': return HeartHandshake;
      default: return CheckCircle2;
    }
  };

  return (
    <section id="how-it-works" className="py-20 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <Badge variant="forest" size="md">
            Simple 3-Step Lifecycle
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            How SharePlate Turns Surplus into Sustenance
          </h2>
          <p className="text-base text-charcoal-600 leading-relaxed">
            Eliminating food waste shouldn't require complex logistics. We designed a rapid, dignified digital exchange that takes under two minutes.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          
          {HOW_IT_WORKS_STEPS.map((step, index) => {
            const Icon = getStepIcon(step.icon);
            return (
              <div 
                key={step.step}
                className="relative bg-white rounded-3xl p-8 border border-stone-200/90 shadow-subtle hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
              >
                {/* Step indicator watermark */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-black text-sage-200 group-hover:text-forest-700 transition-colors">
                    {step.step}
                  </span>
                  <Badge variant="sage" size="sm">
                    {step.badge}
                  </Badge>
                </div>

                {/* Main Icon */}
                <div className="w-14 h-14 rounded-2xl bg-forest-800 text-white flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-sm">
                  <Icon className="w-7 h-7 text-sage-300" />
                </div>

                {/* Content */}
                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold text-charcoal-900 group-hover:text-forest-900 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-charcoal-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Micro checklist */}
                <div className="mt-6 pt-4 border-t border-stone-100 text-xs text-charcoal-500 space-y-1.5 font-medium">
                  {index === 0 && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Specify portions & expiry time</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Designate specific pickup counter</span>
                      </div>
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Filter by distance (1 km, 3 km, 5 km)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>One-click instant reservation claim</span>
                      </div>
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Show digital pickup code on arrival</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
                        <span>Automatic ESG impact logging</span>
                      </div>
                    </>
                  )}
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}
