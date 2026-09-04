import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, ArrowRight, ChevronRight, Search, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api';
import { Order } from '../types';

export const OrdersHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/orders/my-orders');
        setOrders(res.data.data || []);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const filteredOrders = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.items.some((i: any) => i.productTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Package className="text-novaorange-500" size={22} /> My Orders ({orders.length})
        </h1>

        {/* Search Orders */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search in orders by ID or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-white border border-gray-300 rounded shadow-xs focus:border-novaorange-500 outline-none"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-card max-w-lg mx-auto">
          <Package size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Orders Placed Yet</h3>
          <p className="text-xs text-gray-500 mb-6">Looks like you haven't made any purchases yet.</p>
          <Link to="/products" className="bg-novaorange-500 text-white font-bold px-6 py-2 rounded text-xs">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isDelivered = order.orderStatus === 'delivered';
            const isCancelled = order.orderStatus === 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 shadow-card hover:border-gray-300 transition-all overflow-hidden"
              >
                {/* Top Order Strip */}
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-gray-400 font-bold uppercase">ORDER PLACED</p>
                      <p className="font-semibold text-gray-800">
                        {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">TOTAL</p>
                      <p className="font-bold text-gray-900">₹{order.grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 font-bold uppercase">SHIP TO</p>
                      <p className="font-semibold text-gray-800 truncate max-w-[120px]">
                        {order.shippingAddress.fullName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-500">#{order.orderNumber}</span>
                    <Link
                      to={`/track-order/${order.id}`}
                      className="inline-flex items-center gap-1 font-bold text-novaorange-600 hover:text-novaorange-700 bg-white border border-orange-300 px-3 py-1 rounded"
                    >
                      <Truck size={13} /> Track Order
                    </Link>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="p-4 sm:p-5 divide-y divide-gray-100">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.thumbnailUrl}
                          alt={item.productTitle}
                          className="w-16 h-16 object-contain rounded bg-white border border-gray-100 p-1 shrink-0"
                        />
                        <div className="text-xs space-y-1">
                          <Link
                            to={`/products/${item.productId}`}
                            className="font-bold text-gray-900 hover:text-novaorange-600 line-clamp-2"
                          >
                            {item.productTitle}
                          </Link>
                          {item.variantName && (
                            <p className="text-gray-500">Variant: {item.variantName}</p>
                          )}
                          <p className="font-bold text-gray-900">
                            ₹{item.unitPrice.toLocaleString('en-IN')} x {item.quantity} = ₹{item.totalPrice.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Status Tag */}
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-700'
                              : isDelivered
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-orange-100 text-novaorange-700'
                          }`}
                        >
                          {isCancelled ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
