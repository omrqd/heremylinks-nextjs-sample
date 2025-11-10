'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = 'daily' | 'monthly' | 'yearly';

export default function RevenueChart() {
  const [period, setPeriod] = useState<Period>('monthly');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    loadRevenueData();
  }, [period]);

  const loadRevenueData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/revenue-chart?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        
        // Calculate total for this period
        const total = result.data.reduce((sum: number, item: any) => sum + item.revenue, 0);
        setTotalRevenue(total);
      }
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'daily': return 'Last 30 Days';
      case 'monthly': return 'Last 12 Months';
      case 'yearly': return 'All Years';
      default: return '';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-lg p-3 shadow-xl">
          <p className="text-slate-300 text-sm mb-1">{payload[0].payload.displayDate || payload[0].payload.date}</p>
          <p className="text-white font-bold text-lg">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/20">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white text-xl font-bold flex items-center gap-2">
            <i className="fas fa-chart-line text-green-400"></i>
            Revenue Overview
          </h3>
          <p className="text-slate-400 text-sm mt-1">{getPeriodLabel()}</p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === 'daily'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === 'monthly'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setPeriod('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === 'yearly'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Total Revenue Badge */}
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-sm">Total Revenue:</span>
          <span className="text-green-400 text-2xl font-bold">${totalRevenue.toFixed(2)}</span>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
              <span className="text-slate-400">Revenue Trend</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <p className="text-slate-400">Loading chart data...</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <i className="fas fa-chart-line text-4xl mb-2 opacity-50"></i>
            <p>No revenue data available for this period</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="displayDate" 
              stroke="#94a3b8" 
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Chart Legend/Stats */}
      {!loading && data.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-1">Highest</p>
            <p className="text-white font-bold">
              ${Math.max(...data.map(d => d.revenue)).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-1">Average</p>
            <p className="text-white font-bold">
              ${(data.reduce((sum, d) => sum + d.revenue, 0) / data.length).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-xs mb-1">Lowest</p>
            <p className="text-white font-bold">
              ${Math.min(...data.map(d => d.revenue)).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

