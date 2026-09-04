import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, CheckCircle2, XCircle, Search, ChevronDown } from 'lucide-react';
import api from '../../lib/api';
import { toast } from '../../store/toastStore';

export const SellerOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/seller/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error('Failed to load seller orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, {
        status: newStatus,
        comment: `Order status updated to ${newStatus} by seller`,
      });
      toast.success(`Order #${orderId} status changed to '${newStatus}'`);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((ord) => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ord.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} className="text-novaorange-500" /> Customer Orders Fulfillment ({orders.length})
          </h1>
          <p className="text-xs text-gray-500">Track and dispatch customer orders assigned to your store.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded px-3 py-2 outline-none focus:border-novaorange-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="packed">Packed</option>
            <option value="shipped">Shipped</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="Search by order# or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-novaorange-500 outline-none w-48 sm:w-60"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-card">
          <ShoppingBag size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-xs text-gray-500">There are no orders matching the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden"
            >
              {/* Order Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-400 font-bold uppercase">ORDER #</span>
                    <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase">CUSTOMER</span>
                    <p className="font-bold text-gray-800">{order.customerName} ({order.shippingAddress.phone})</p>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold uppercase">PAYMENT</span>
                    <p className="font-bold uppercase text-gray-900">{order.paymentMethod} ({order.paymentStatus})</p>
                  </div>
                </div>

                {/* Status Changer Select */}
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold">Change Status:</span>
                  <select
                    disabled={updatingId === order.id}
                    value={order.orderStatus}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                    className="bg-white border border-gray-300 text-gray-900 font-bold rounded px-2.5 py-1 text-xs focus:border-novaorange-500 outline-none cursor-pointer"
                  >
                    <option value="placed">Placed</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="packed">Packed</option>
                    <option value="shipped">Shipped</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="p-4 sm:p-5 text-xs divide-y divide-gray-100">
                {order.items.map((item: any) => (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productTitle}
                        className="w-12 h-12 object-contain rounded bg-white border border-gray-100 p-0.5 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-gray-900">{item.productTitle}</p>
                        {item.variantName && <p className="text-gray-500">Variant: {item.variantName}</p>}
                        <p className="text-gray-600">
                          Qty: <strong className="text-gray-900">{item.quantity}</strong> • Unit: ₹{item.unitPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-sm text-gray-900">
                        ₹{item.totalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Footer */}
              <div className="bg-gray-50/70 px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-600 flex justify-between items-center">
                <span>
                  Shipping to: {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </span>
                <span className="font-semibold text-gray-700">Tracking: {order.trackingId}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
