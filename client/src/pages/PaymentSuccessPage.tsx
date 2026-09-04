import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, ArrowRight, Home, Download, Truck } from 'lucide-react';
import api from '../lib/api';
import { Order } from '../types';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error('Failed to fetch order', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-10 shadow-card text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm animate-fade-in">
          <CheckCircle2 size={48} className="text-novagreen-500" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Order Placed Successfully!
          </h1>
          <p className="text-sm text-gray-600">
            Thank you for shopping with Prajnacart. Your order has been registered and is being processed.
          </p>
        </div>

        {order && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 text-left text-xs space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div>
                <p className="text-gray-400 font-bold uppercase">ORDER NUMBER</p>
                <p className="text-sm font-black text-gray-900">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 font-bold uppercase">TOTAL AMOUNT</p>
                <p className="text-sm font-black text-novagreen-600">
                  ₹{order.grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-gray-700 uppercase mb-1">Shipping Address</p>
                <p className="text-gray-800 font-semibold">{order.shippingAddress.fullName}</p>
                <p className="text-gray-600">
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                </p>
                <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
              </div>

              <div>
                <p className="font-bold text-gray-700 uppercase mb-1">Payment & Delivery</p>
                <p className="text-gray-600">
                  Payment Method: <span className="font-bold uppercase text-gray-900">{order.paymentMethod}</span>
                </p>
                <p className="text-gray-600">
                  Payment Status: <span className="font-bold uppercase text-novagreen-600">{order.paymentStatus}</span>
                </p>
                <p className="text-gray-600">
                  Estimated Delivery: <strong className="text-gray-900">Within 2-3 Business Days</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {order && (
            <Link
              to={`/track-order/${order.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold px-6 py-2.5 rounded text-sm shadow-sm transition-all"
            >
              <Truck size={16} /> Track Order Progress
            </Link>
          )}

          <Link
            to="/profile/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-2.5 rounded text-sm transition-all"
          >
            <Package size={16} /> View Order History
          </Link>

          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-novaorange-600 font-bold px-4 py-2.5 text-sm hover:underline"
          >
            <Home size={16} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};
