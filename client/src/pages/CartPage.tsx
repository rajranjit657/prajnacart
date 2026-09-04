import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Trash2, Plus, Minus, ShieldCheck, Tag, ArrowRight, 
  ShoppingBag, CheckCircle2, AlertCircle, Heart 
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { toast } from '../store/toastStore';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, summary, updateQuantity, removeItem } = useCartStore();
  const { toggleWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsApplyingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        orderTotal: summary.totalSellingPrice,
      });

      const data = res.data.data;
      setAppliedCoupon(data.coupon);
      setCouponDiscount(data.discountAmount);
      toast.success(res.data.message || `Coupon "${couponCode.toUpperCase()}" applied!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid or expired coupon code.');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed.');
  };

  const handleSaveForLater = async (item: any) => {
    if (item.product) {
      await toggleWishlist(item.product);
      await removeItem(item.id);
    }
  };

  const grandTotalPayable = Math.max(0, summary.grandTotal - couponDiscount);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center shadow-card max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 bg-orange-50 text-novaorange-500 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag size={36} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Your Cart is Empty!</h2>
          <p className="text-xs text-gray-500">
            Explore our vast catalog and discover deals across Electronics, Fashion, Mobiles and more.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs px-6 py-3 rounded shadow-sm transition-all"
          >
            Shop Now <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cart Items List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-lg border border-gray-200 shadow-card divide-y divide-gray-200">
          {/* Cart Header */}
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
              Shopping Cart ({summary.itemCount} Items)
            </h1>
            <span className="text-xs text-gray-500 font-semibold">
              Delivering to: <strong className="text-gray-900">Bengaluru - 560038</strong>
            </span>
          </div>

          {/* Cart Items List */}
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              if (!item.product) return null;
              const unitPrice = item.variant ? item.variant.price : item.product.price;
              const unitMrp = item.variant ? item.variant.mrp : item.product.mrp;
              const itemDiscount = Math.round(((unitMrp - unitPrice) / unitMrp) * 100);

              return (
                <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Thumbnail & Quantity Stepper */}
                  <div className="flex sm:flex-col items-center gap-3 shrink-0">
                    <img
                      src={item.variant?.imageUrl || item.product.thumbnailUrl}
                      alt={item.product.title}
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded bg-white border border-gray-100 p-1"
                    />

                    {/* Quantity Controls */}
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                      <div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="font-semibold text-sm text-gray-900 hover:text-novaorange-600 line-clamp-2"
                        >
                          {item.product.title}
                        </Link>
                        {item.variant && (
                          <span className="text-[11px] text-gray-500 font-medium">
                            Option: {item.variant.name}
                          </span>
                        )}
                        <p className="text-[11px] text-gray-400">Seller: Apex Retail Pvt Ltd</p>
                      </div>

                      <div className="text-right sm:text-right shrink-0">
                        <div className="text-base font-black text-gray-900">
                          ₹{(unitPrice * item.quantity).toLocaleString('en-IN')}
                        </div>
                        {unitMrp > unitPrice && (
                          <div className="flex items-center gap-1 sm:justify-end text-[11px]">
                            <span className="text-gray-400 line-through">
                              ₹{(unitMrp * item.quantity).toLocaleString('en-IN')}
                            </span>
                            <span className="font-bold text-novagreen-600">{itemDiscount}% off</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Fast Delivery Text */}
                    <p className="text-[11px] text-gray-600">
                      Delivery by <strong className="text-gray-900">Tomorrow</strong> |{' '}
                      <span className="text-novagreen-600 font-bold">FREE</span>
                    </p>

                    {/* Bottom Action Links */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                      <button
                        onClick={() => handleSaveForLater(item)}
                        className="font-bold text-gray-700 hover:text-novaorange-600 uppercase text-[11px] transition-colors"
                      >
                        Save For Later
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="font-bold text-rose-600 hover:text-rose-700 uppercase text-[11px] transition-colors flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Place Order Sticky Row */}
          <div className="p-4 sm:p-5 bg-white flex items-center justify-end">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full sm:w-auto px-8 py-3.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold text-xs sm:text-sm uppercase rounded shadow-sm transition-all tracking-wider"
            >
              Place Order
            </button>
          </div>
        </div>

        {/* Right Column: Price Details & Coupons (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coupon Code Box */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-novaorange-500" /> Apply Promo Coupon
            </h3>

            {appliedCoupon ? (
              <div className="bg-novagreen-50 border border-novagreen-200 rounded p-3 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-novagreen-800 font-mono">
                    {appliedCoupon.code} APPLIED
                  </p>
                  <p className="text-novagreen-700 text-[11px]">
                    Savings: ₹{couponDiscount.toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Code (e.g. FESTIVE50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 text-xs px-3 py-2 border border-gray-300 rounded outline-none focus:border-novaorange-500 uppercase font-mono font-bold"
                />
                <button
                  type="submit"
                  disabled={isApplyingCoupon}
                  className="px-4 py-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs rounded transition-colors disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Price Breakdown Sidebar */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-card space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5">
              Price Details
            </h2>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Price ({summary.itemCount} items)</span>
                <span>₹{summary.totalMrp.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-novagreen-600 font-semibold">
                <span>Discount on MRP</span>
                <span>- ₹{summary.totalDiscount.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-novagreen-600 font-semibold">
                  <span>Coupon Discount</span>
                  <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span>
                  {summary.deliveryFee === 0 ? (
                    <span className="text-novagreen-600 font-bold">FREE</span>
                  ) : (
                    `₹${summary.deliveryFee}`
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Secured Packaging Fee</span>
                <span>₹{summary.packagingFee}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between text-sm sm:text-base font-black text-gray-900">
                <span>Total Amount</span>
                <span>₹{grandTotalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-novagreen-50 border border-novagreen-200 rounded p-2.5 text-xs text-novagreen-700 font-bold text-center">
              You will save ₹{(summary.totalDiscount + couponDiscount).toLocaleString('en-IN')} on this order!
            </div>
          </div>

          {/* Trust Guarantee */}
          <div className="flex items-center gap-2 p-3 text-xs text-gray-500">
            <ShieldCheck size={20} className="text-gray-400 shrink-0" />
            <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
