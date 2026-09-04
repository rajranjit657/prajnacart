import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';

export const PaymentFailedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-card text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle size={36} />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-gray-900">Payment Unsuccessful</h1>
          <p className="text-xs text-gray-500">
            We couldn't process your payment transaction. If any amount was debited, it will be automatically refunded within 3-5 business days.
          </p>
        </div>

        {orderId && (
          <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-700">
            Order Reference: <strong className="text-gray-900">{orderId}</strong>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/checkout"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold px-6 py-2.5 rounded text-xs shadow-sm transition-all"
          >
            <RefreshCw size={14} /> Retry Payment
          </Link>

          <Link
            to="/cart"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-2.5 rounded text-xs transition-all"
          >
            <ShoppingCart size={14} /> Return to Cart
          </Link>
        </div>
      </div>
    </div>
  );
};
