import React from 'react';
import { 
  Leaf, 
  Wind, 
  Globe2, 
  Clock, 
  ArrowUpRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Badge from '../common/Badge';

export default function SustainabilitySection() {
  return (
    <section className="py-20 bg-forest-900 text-white relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-sage-500/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Context */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-800 text-sage-300 border border-forest-700 text-xs font-semibold">
              <Leaf className="w-3.5 h-3.5 text-sage-400" />
              <span>UN Sustainable Development Goals 2 & 12</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Food waste is an avoidable <br className="hidden sm:inline" />
              <span className="text-sage-400">climate tragedy.</span>
            </h2>

            <p className="text-stone-300 text-base sm:text-lg leading-relaxed">
              When edible food decomposes in landfills, it releases methane — a greenhouse gas up to 28 times more potent than carbon dioxide. Traditional charity food pickups often take 24 to 48 hours to coordinate, by which point prepared hot meals and fresh bakery items must be thrown away.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3 bg-forest-800/60 p-4 rounded-2xl border border-forest-700/60">
                <div className="p-2 rounded-xl bg-forest-700 text-sage-300 flex-shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 text-sage-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Under 60-Minute Hyperlocal Matching</h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    By leveraging MongoDB geospatial indexing (`2dsphere`), nearby recipients claim food within meters of where it was prepared while it is steaming fresh.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-forest-800/60 p-4 rounded-2xl border border-forest-700/60">
                <div className="p-2 rounded-xl bg-forest-700 text-sage-300 flex-shrink-0 mt-0.5">
                  <TrendingDown className="w-5 h-5 text-sage-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Direct Methane & Carbon Mitigation</h4>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    Every 1 kg of rescued cooked food saves approximately 2.5 kg of greenhouse emissions and 1,000 liters of embedded agricultural water.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Comparative Card */}
          <div className="lg:col-span-5">
            <div className="bg-forest-950/80 rounded-3xl p-8 border border-forest-800 shadow-2xl space-y-6">
              
              <h3 className="text-lg font-bold text-white flex items-center justify-between">
                <span>Surplus Routing Comparison</span>
                <span className="text-xs font-normal text-stone-400">Lifecycle audit</span>
              </h3>

              {/* Status quo row */}
              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-300">
                  <span className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Traditional Disposal (Landfill)
                  </span>
                  <span className="text-rose-400 font-mono">+2.5 kg CO₂e / kg</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Food decomposes anaerobically into methane, incurring high municipal hauling and incineration fees with zero social utility.
                </p>
              </div>

              {/* SharePlate row */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    SharePlate Redistribution
                  </span>
                  <span className="text-emerald-300 font-mono">-100% Waste</span>
                </div>
                <p className="text-xs text-stone-300 leading-relaxed">
                  Food immediately nourishes students and local families, preserving the nutritional energy and water invested in culinary preparation.
                </p>
              </div>

              {/* Stat footer */}
              <div className="pt-4 border-t border-forest-800/80 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-extrabold text-sage-300">18.5 Tons</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">CO₂ Offset to Date</div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-amber-300">6.2M L</div>
                  <div className="text-[11px] text-stone-400 mt-0.5">Embedded Water Conserved</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
