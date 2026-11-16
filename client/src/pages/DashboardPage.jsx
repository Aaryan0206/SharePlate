import React, { useState } from 'react';
import { 
  Building2, 
  HeartHandshake, 
  ShieldAlert, 
  Utensils, 
  Clock, 
  CheckCircle2, 
  Package, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { MOCK_LISTINGS, MOCK_IMPACT_STATS } from '../data/mockListings';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('donor'); // donor, recipient, admin

  return (
    <div className="py-10 bg-cream-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header & Role Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="forest" size="sm">Phase 6 Architecture</Badge>
              <span className="text-xs text-stone-500 font-medium">Interactive Multi-Role View</span>
            </div>
            <h1 className="text-3xl font-extrabold text-charcoal-900 tracking-tight">
              Platform Analytics & Activity
            </h1>
            <p className="text-sm text-charcoal-600">
              Switch role tabs to view the specialized donor, recipient, and administrative interfaces.
            </p>
          </div>

          {/* Role Pill Switcher */}
          <div className="flex items-center p-1.5 bg-stone-200/80 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('donor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'donor' 
                  ? 'bg-forest-800 text-white shadow-sm' 
                  : 'text-charcoal-700 hover:text-forest-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Donor View</span>
            </button>

            <button
              onClick={() => setActiveTab('recipient')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'recipient' 
                  ? 'bg-forest-800 text-white shadow-sm' 
                  : 'text-charcoal-700 hover:text-forest-900'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Recipient View</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'admin' 
                  ? 'bg-forest-800 text-white shadow-sm' 
                  : 'text-charcoal-700 hover:text-forest-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Admin View</span>
            </button>
          </div>
        </div>

        {/* 1. DONOR DASHBOARD VIEW */}
        {activeTab === 'donor' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Donor Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Active Donations</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">4</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Live on map right now</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Total Quantity Rescued</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">1,240 kg</div>
                <div className="text-xs text-stone-500 mt-1">142 total completed runs</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Pending Pickup Claims</div>
                <div className="text-3xl font-extrabold text-terracotta-500 mt-1">8</div>
                <div className="text-xs text-amber-600 font-semibold mt-1">Awaiting recipient arrival</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">CO₂ Emissions Offset</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">3.1 Tons</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Audit-ready ESG credit</div>
              </div>
            </div>

            {/* Donor Active Listings Table */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-charcoal-900">Your Current Active Surplus Listings</h3>
                <span className="text-xs text-stone-500">Live MongoDB records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-y border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Item & Category</th>
                      <th className="py-3 px-4">Remaining Qty</th>
                      <th className="py-3 px-4">Pickup Window</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-charcoal-800">
                    {MOCK_LISTINGS.slice(0, 3).map((item) => (
                      <tr key={item.id} className="hover:bg-cream-50/50">
                        <td className="py-3.5 px-4 font-semibold text-charcoal-900">
                          <div>{item.title}</div>
                          <span className="text-[10px] text-stone-500 font-normal">{item.category}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-forest-900">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {item.pickupWindow.start} - {item.pickupWindow.end}
                        </td>
                        <td className="py-3.5 px-4 text-amber-700 font-medium">
                          Today
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant="success" size="sm">Available</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1">
                          <button className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. RECIPIENT DASHBOARD VIEW */}
        {activeTab === 'recipient' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Recipient Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Active Reservations</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">2</div>
                <div className="text-xs text-forest-700 font-semibold mt-1">Ready for pickup today</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Completed Pickups</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">19</div>
                <div className="text-xs text-stone-500 mt-1">Saved ~48 meals this month</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Food Expense Rescued</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">~$210</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Estimated grocery savings</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Local Trust Score</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">100%</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Punctual pickup rating</div>
              </div>
            </div>

            {/* Reservations Table */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-card space-y-4">
              <h3 className="text-lg font-bold text-charcoal-900">Your Reserved Surplus Meals</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-y border-stone-200">
                    <tr>
                      <th className="py-3 px-4">Food Item</th>
                      <th className="py-3 px-4">Donor / Location</th>
                      <th className="py-3 px-4">Claimed Portions</th>
                      <th className="py-3 px-4">Pickup Code</th>
                      <th className="py-3 px-4">Pickup Window</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-charcoal-800">
                    <tr className="hover:bg-cream-50/50">
                      <td className="py-3.5 px-4 font-bold text-charcoal-900">
                        {MOCK_LISTINGS[0].title}
                      </td>
                      <td className="py-3.5 px-4 text-stone-600">
                        {MOCK_LISTINGS[0].donor.name} &bull; {MOCK_LISTINGS[0].pickupAddress.facility}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-forest-900">
                        2 boxes
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono bg-stone-100 px-2 py-0.5 rounded font-bold text-terracotta-500 border border-stone-200">
                          SP-RESERVE-4491
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-forest-800 font-semibold">
                        14:30 - 16:30 Today
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Badge variant="warning" size="sm">Awaiting Pickup</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. ADMIN DASHBOARD VIEW */}
        {activeTab === 'admin' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Admin Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Total Registered Users</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">842</div>
                <div className="text-xs text-stone-500 mt-1">140 Donors &bull; 702 Claimants</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Live Active Listings</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">24</div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">Available across 6 zones</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Completed Collections</div>
                <div className="text-3xl font-extrabold text-forest-900 mt-1">1,940</div>
                <div className="text-xs text-stone-500 mt-1">98.4% collection success rate</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-subtle">
                <div className="text-xs text-stone-500 font-medium">Expired Unclaimed Food</div>
                <div className="text-3xl font-extrabold text-rose-700 mt-1">1.6%</div>
                <div className="text-xs text-stone-500 mt-1">Safely logged for waste audit</div>
              </div>
            </div>

            {/* Aggregation Pipeline Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-charcoal-900">MongoDB Aggregation Breakdown by Food Category</h3>
                  <p className="text-xs text-stone-500">Real-time `$group` and `$sum` analytics for Phase 6</p>
                </div>
                <Badge variant="sage" size="sm">Audit Complete</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-1">
                  <div className="text-xs text-stone-500">Cooked Buffet Meals</div>
                  <div className="text-xl font-bold text-forest-900">4,820 kg (46%)</div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-forest-800 h-full w-[46%]" />
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-1">
                  <div className="text-xs text-stone-500">Bakery & Breads</div>
                  <div className="text-xl font-bold text-forest-900">2,910 kg (28%)</div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-forest-600 h-full w-[28%]" />
                  </div>
                </div>

                <div className="p-4 bg-cream-50 rounded-2xl border border-cream-200 space-y-1">
                  <div className="text-xs text-stone-500">Fresh Produce & Fruits</div>
                  <div className="text-xl font-bold text-forest-900">2,680 kg (26%)</div>
                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden mt-2">
                    <div className="bg-emerald-500 h-full w-[26%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
