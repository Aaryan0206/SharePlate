import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieIcon } from 'lucide-react';

const STATUS_COLORS = {
  reserved: '#1B4332',
  collected: '#10B981',
  cancelled: '#6B7280',
  expired: '#F59E0B',
};

export default function AdminAnalyticsSection({
  analytics,
  days,
  onDaysChange,
  loading,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-stone-200 h-80 animate-pulse">
            <div className="h-4 bg-stone-200 rounded w-1/3 mb-4" />
            <div className="h-56 bg-stone-100 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  // Merge listings, reservations, and collections by date for unified trend chart
  const dateMap = new Map();
  (analytics.listingsOverTime || []).forEach((item) => {
    dateMap.set(item.date, {
      date: item.date,
      listingsCreated: item.listingsCreated,
      reservationsCount: 0,
      collectionsCount: 0,
    });
  });
  (analytics.reservationsOverTime || []).forEach((item) => {
    const existing = dateMap.get(item.date) || {
      date: item.date,
      listingsCreated: 0,
      reservationsCount: 0,
      collectionsCount: 0,
    };
    existing.reservationsCount = item.reservationsCount;
    dateMap.set(item.date, existing);
  });
  (analytics.collectionsOverTime || []).forEach((item) => {
    const existing = dateMap.get(item.date) || {
      date: item.date,
      listingsCreated: 0,
      reservationsCount: 0,
      collectionsCount: 0,
    };
    existing.collectionsCount = item.collectionsCount;
    dateMap.set(item.date, existing);
  });

  const timelineData = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const categoryData = analytics.categoryBreakdown || [];
  const statusData = (analytics.reservationStatusBreakdown || []).map((item) => ({
    ...item,
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    color: STATUS_COLORS[item.status] || '#52B788',
  }));

  return (
    <div className="space-y-6">
      {/* Range Selector Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-forest-800" />
          <div>
            <h2 className="text-base font-bold text-charcoal-900">
              Platform Donation & Collection Analytics
            </h2>
            <p className="text-xs text-stone-500">
              Aggregated directly from MongoDB FoodListing & Reservation records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500 font-medium mr-1">Date Range:</span>
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              onClick={() => onDaysChange(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                days === d
                  ? 'bg-forest-800 text-white shadow-xs'
                  : 'bg-stone-100 text-charcoal-700 hover:bg-stone-200/70'
              }`}
            >
              Last {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Time-Series Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Daily Listings, Reservations & Verified Collections
              </h3>
              <p className="text-xs text-stone-500">Count of records created/collected per day</p>
            </div>
          </div>

          {timelineData.length === 0 ? (
            <div className="h-64 flex items-center justify-center bg-cream-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
              No activity recorded in the selected {days}-day window.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#57534E' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#57534E' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E7E5E4',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area
                    type="monotone"
                    dataKey="listingsCreated"
                    name="Listings Created"
                    stroke="#1B4332"
                    fill="#D8F3DC"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="reservationsCount"
                    name="Reservations"
                    stroke="#E07A5F"
                    fill="#FDE8E1"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="collectionsCount"
                    name="Verified Collections"
                    stroke="#10B981"
                    fill="#A7F3D0"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Reservation Status Breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-forest-800" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Reservation Status Breakdown
              </h3>
              <p className="text-xs text-stone-500">Distribution in selected period</p>
            </div>
          </div>

          {statusData.length === 0 ? (
            <div className="h-64 flex items-center justify-center bg-cream-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
              No reservations in this date range.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Activity Bar Chart */}
        <div className="lg:col-span-12 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-card space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-forest-800" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">
                Most Active Food Categories (Listings Count)
              </h3>
              <p className="text-xs text-stone-500">
                Number of surplus listings published per category
              </p>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="h-56 flex items-center justify-center bg-cream-50 rounded-2xl border border-dashed border-stone-200 text-xs text-stone-500">
              No food listings recorded in this period.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#57534E' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#57534E' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="listingCount"
                    name="Listings Published"
                    fill="#1B4332"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
