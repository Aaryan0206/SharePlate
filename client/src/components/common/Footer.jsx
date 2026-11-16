import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  Heart, 
  Database, 
  MapPin, 
  ShieldCheck, 
  ExternalLink,
  Leaf,
  Globe2
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-forest-950 text-stone-300 pt-16 pb-12 border-t border-forest-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-forest-900/80">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-sage-300 shadow-sm">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Share<span className="text-sage-400">Plate</span>
              </span>
            </div>
            
            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              A modern, hyper-local surplus food sharing platform connecting restaurants, college cafeterias, hostels, and event organizers with people and community organizations.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-forest-900/80 text-sage-300 border border-forest-800">
                <Leaf className="w-3.5 h-3.5 text-sage-400" />
                Zero Food Waste Initiative
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-forest-900/80 text-amber-300 border border-forest-800">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                MongoDB 2dsphere
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/browse" className="hover:text-sage-300 transition-colors">Browse Surplus Food</Link>
              </li>
              <li>
                <Link to="/map" className="hover:text-sage-300 transition-colors">Interactive Radius Map</Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-sage-300 transition-colors">How SharePlate Works</a>
              </li>
              <li>
                <a href="#impact" className="hover:text-sage-300 transition-colors">Live Impact Metrics</a>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-sage-300 transition-colors">Role Dashboards</Link>
              </li>
            </ul>
          </div>

          {/* Donors & Community */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">For Donors</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <Link to="/donate" className="hover:text-sage-300 transition-colors">Post Food Donation</Link>
              </li>
              <li>
                <span className="text-stone-500 cursor-not-allowed">College Cafeterias</span>
              </li>
              <li>
                <span className="text-stone-500 cursor-not-allowed">Bakery & Cafe Surplus</span>
              </li>
              <li>
                <span className="text-stone-500 cursor-not-allowed">Event Organizers</span>
              </li>
              <li>
                <span className="text-stone-500 cursor-not-allowed">Food Safety Guidelines</span>
              </li>
            </ul>
          </div>

          {/* Project & Tech Stack */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Tech Stack</h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>MongoDB & Mongoose</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Express & Node.js</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>React + Vite</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Tailwind CSS</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>JWT Authentication</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p className="flex items-center gap-1">
            <span>SharePlate &copy; {new Date().getFullYear()} — College Placement Project. Designed with</span>
            <Heart className="w-3.5 h-3.5 text-terracotta-400 fill-current inline mx-0.5" />
            <span>for zero hunger & food rescue.</span>
          </p>

          <div className="flex items-center gap-4 text-stone-400">
            <span className="px-2.5 py-1 rounded bg-forest-900 border border-forest-800 text-[11px] text-stone-400">
              Phase 1: UI Foundation & Landing Page
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
