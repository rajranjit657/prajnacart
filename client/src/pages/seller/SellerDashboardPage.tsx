import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, DollarSign, Package, ShoppingBag, 
  AlertTriangle, CheckCircle2, ArrowRight, Store 
} from 'lucide-react';
import api from '../../lib/api';

export const SellerDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/seller/dashboard');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load seller dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
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

  const { metrics, recentOrders, lowStockProducts, seller } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Banner / Store Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-orange-50 text-novaorange-600 flex items-center justify-center font-bold">
            <Store size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{seller?.storeName || 'My Store'}</h1>
            <p className="text-xs text-gray-500">
              Seller Status:{' '}
              <span className="font-bold text-emerald-600 uppercase tracking-wide">
                {seller?.status || 'Active'}
              </span>{' '}
              • Commission Rate: {seller?.commissionRate || 8}%
            </p>
          </div>
        </div>

        <Link
          to="/seller/products/new"
          className="inline-flex items-center justify-center gap-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs px-4 py-2.5 rounded shadow-sm transition-colors"
        >
          + Add New Product
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Sales</p>
            <p className="text-xl font-black text-gray-900 mt-1">
              ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] text-novagreen-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp size={12} /> Net: ₹{(metrics?.netEarnings || 0).toLocaleString('en-IN')}
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
            <p className="text-xl font-black text-gray-900 mt-1">{metrics?.totalOrdersCount || 0}</p>
            <span className="text-[11px] text-novaorange-600 font-semibold mt-1 block">
              {metrics?.totalUnitsSold || 0} Units Dispatched
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-50 text-novaorange-600 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* Pending Shipments */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Orders</p>
            <p className="text-xl font-black text-novaorange-600 mt-1">{metrics?.pendingOrdersCount || 0}</p>
            <span className="text-[11px] text-gray-500 font-semibold mt-1 block">
              Requires fulfillment
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-novaorange-50 text-novaorange-600 flex items-center justify-center">
            <Package size={20} />
          </div>
        </div>

        {/* Active Listings / Low Stock */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Catalog</p>
            <p className="text-xl font-black text-gray-900 mt-1">{metrics?.activeProductsCount || 0}</p>
            <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <AlertTriangle size={12} /> {metrics?.lowStockCount || 0} Low Stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Store size={20} />
          </div>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold">
            <AlertTriangle size={16} />
            <span>Low Stock Alert ({lowStockProducts.length} items)</span>
          </div>
          <p className="text-amber-700">
            The following products have 5 or fewer items remaining in inventory. Please restock to avoid listing deactivation.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {lowStockProducts.map((p: any) => (
              <span key={p.id} className="bg-white px-2.5 py-1 rounded border border-amber-300 font-semibold text-gray-800">
                {p.title.slice(0, 30)}... ({p.stockQuantity} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
            Recent Customer Orders
          </h2>
          <Link to="/seller/orders" className="text-xs font-bold text-novaorange-600 hover:underline flex items-center gap-1">
            View All Orders <ArrowRight size={13} />
          </Link>
        </div>

        {recentOrders && recentOrders.length === 0 ? (
          <p className="text-xs text-gray-500 py-4">No recent orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="p-3">Order Number</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders?.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-bold text-gray-900">{ord.orderNumber}</td>
                    <td className="p-3 text-gray-600">
                      {new Date(ord.placedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 font-semibold text-gray-800">{ord.customerName}</td>
                    <td className="p-3 text-gray-600">{ord.items.length} items</td>
                    <td className="p-3 font-bold text-gray-900">₹{ord.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-100 text-novaorange-700">
                        {ord.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        to="/seller/orders"
                        className="text-novaorange-600 font-bold hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
