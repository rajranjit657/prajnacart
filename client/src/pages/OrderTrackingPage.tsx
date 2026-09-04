import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Package, CheckCircle2, Clock, Truck, Home, 
  MapPin, AlertCircle, ArrowLeft, ShieldCheck, XCircle 
} from 'lucide-react';
import api from '../lib/api';
import { Order } from '../types';
import { toast } from '../store/toastStore';

const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', desc: 'Order received by marketplace' },
  { key: 'confirmed', label: 'Order Confirmed', desc: 'Payment verified & order approved' },
  { key: 'processing', label: 'Processing', desc: 'Item verified by seller' },
  { key: 'packed', label: 'Packed', desc: 'Sealed with tamper-proof security' },
  { key: 'shipped', label: 'Shipped', desc: 'Handed to express logistics hub' },
  { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Courier executive is on the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Package delivered to recipient' },
];

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const confirmCancel = window.confirm('Are you sure you want to cancel this order?');
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      const res = await api.post(`/orders/${order.id}/cancel`, {
        reason: 'Cancelled by customer from tracking dashboard',
      });
      setOrder(res.data.data);
      toast.success('Order cancelled successfully.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">Could not find tracking information for the requested order.</p>
        <Link to="/profile/orders" className="bg-novaorange-500 text-white font-bold px-6 py-2 rounded text-sm">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIndex = TRACKING_STEPS.findIndex((s) => s.key === order.orderStatus);
  const isCancelled = order.orderStatus === 'cancelled';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link to="/profile/orders" className="text-xs font-bold text-novaorange-600 hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to My Orders
        </Link>
        <span className="text-xs text-gray-500">
          Tracking ID: <strong className="text-gray-900 font-mono">{order.trackingId}</strong>
        </span>
      </div>

      {/* Main Tracking Stepper Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-8">
        {/* Order Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">ORDER NUMBER</span>
            <h1 className="text-lg sm:text-xl font-black text-gray-900">{order.orderNumber}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.placedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCancelled
                ? 'bg-rose-100 text-rose-700'
                : order.orderStatus === 'delivered'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-orange-100 text-novaorange-700'
            }`}>
              {order.orderStatus.replace(/_/g, ' ')}
            </span>

            {!isCancelled && ['placed', 'confirmed', 'processing'].includes(order.orderStatus) && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 border border-rose-200 px-3 py-1 rounded hover:bg-rose-50 transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {/* Visual Timeline Stepper */}
        {isCancelled ? (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center text-rose-700 space-y-2">
            <XCircle size={36} className="mx-auto text-rose-600" />
            <h3 className="text-base font-bold">This Order Has Been Cancelled</h3>
            <p className="text-xs text-rose-600">
              Stock reservation has been restored and any paid amount is queued for refund.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
            {TRACKING_STEPS.map((stepItem, idx) => {
              const isPast = currentStepIndex >= idx;
              const isCurrent = currentStepIndex === idx;

              const historyEntry = order.statusHistory?.find((h: any) => h.status === stepItem.key);

              return (
                <div key={stepItem.key} className="relative flex items-start gap-4">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isPast
                        ? 'bg-novagreen-500 border-novagreen-500 text-white'
                        : 'bg-white border-gray-300 text-gray-300'
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-bold ${isCurrent ? 'text-novaorange-600' : isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stepItem.label}
                      </p>
                      {historyEntry && (
                        <span className="text-[11px] text-gray-400 font-semibold">
                          {new Date(historyEntry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })},{' '}
                          {new Date(historyEntry.timestamp).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {historyEntry?.comment || stepItem.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delivery Address & Items Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100 text-xs">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-novaorange-500" /> Delivery Address
            </h4>
            <p className="font-bold text-gray-800">{order.shippingAddress.fullName}</p>
            <p className="text-gray-600">{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}</p>
            <p className="text-gray-600">Contact: {order.shippingAddress.phone}</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} className="text-novaorange-500" /> Items in this Order ({order.items.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded">
                  <img src={item.thumbnailUrl} alt={item.productTitle} className="w-10 h-10 object-contain rounded bg-white p-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.productTitle}</p>
                    <p className="text-gray-500">Qty: {item.quantity} • ₹{item.totalPrice.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
