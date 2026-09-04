import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, DollarSign, ShoppingBag, Users, Store, 
  Package, ShieldCheck, ArrowRight, TrendingUp, AlertCircle 
} from 'lucide-react';
import api from '../../lib/api';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/admin/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load admin analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { metrics, salesChartData, categoryStats, recentOrders, recentUsers } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-600" /> Platform Executive Analytics
          </h1>
          <p className="text-xs text-gray-500">Live platform performance, GMV, orders and seller ecosystem health.</p>
        </div>

        <div className="flex items-center gap-2">
          {metrics?.pendingSellers > 0 && (
            <Link
              to="/admin/sellers"
              className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 hover:bg-amber-200 transition-colors"
            >
              <AlertCircle size={14} /> {metrics.pendingSellers} Pending Seller Applications
            </Link>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Platform Revenue */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Platform GMV</p>
            <p className="text-xl font-black text-gray-900 mt-1">
              ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-novagreen-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> +18.4% this month
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-xl font-black text-gray-900 mt-1">{metrics?.totalOrders || 0}</p>
            <span className="text-[11px] text-novaorange-600 font-semibold mt-1 block">
              {metrics?.pendingOrders || 0} Pending Fulfillment
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 text-novaorange-600 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Total Sellers */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Sellers</p>
            <p className="text-xl font-black text-purple-600 mt-1">{metrics?.totalSellers || 0}</p>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 block">
              {metrics?.pendingSellers || 0} Pending Approval
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
            <Store size={20} />
          </div>
        </div>

        {/* Total Registered Users */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customers Registered</p>
            <p className="text-xl font-black text-gray-900 mt-1">{metrics?.totalUsers || 0}</p>
            <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
              {metrics?.totalProducts || 0} Products in Catalog
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>
      </div>

      {/* Monthly Sales Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4">
        <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
          Platform Revenue & Sales Trend (2026)
        </h2>

        <div className="grid grid-cols-8 gap-2 items-end h-44 pt-6 pb-2 px-2 border-b border-gray-200">
          {salesChartData?.map((item: any) => {
            const heightPercent = Math.min(100, Math.max(15, Math.round((item.revenue / 1500000) * 100)));
            return (
              <div key={item.month} className="flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                  ₹{(item.revenue / 1000).toFixed(0)}k
                </div>
                <div
                  className="w-full max-w-[36px] bg-purple-600 group-hover:bg-purple-700 rounded-t transition-all shadow-xs"
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[11px] font-bold text-gray-600">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Breakdown & Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-3">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
            Catalog by Category
          </h2>
          <div className="space-y-2 text-xs">
            {categoryStats?.map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                <span className="font-semibold text-gray-800">{cat.category}</span>
                <span className="font-bold text-novaorange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {cat.count} listings
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Platform Orders */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
              Recent Platform Orders
            </h2>
            <span className="text-[11px] text-gray-400">Live feed</span>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            {recentOrders?.slice(0, 5).map((ord: any) => (
              <div key={ord.id} className="py-2 flex items-center justify-between">
                <div>
                  <p className="font-mono font-bold text-gray-900">{ord.orderNumber}</p>
                  <p className="text-gray-500">{ord.customerName} • {ord.paymentMethod.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{ord.grandTotal.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] font-bold uppercase text-novaorange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                    {ord.orderStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
