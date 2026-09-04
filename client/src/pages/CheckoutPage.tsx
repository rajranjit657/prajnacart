import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, MapPin, Plus, CheckCircle2, CreditCard, 
  Banknote, ArrowRight, Lock, AlertCircle, ShoppingBag, Truck 
} from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Address } from '../types';
import { toast } from '../store/toastStore';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, summary, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Address, 2: Order Summary, 3: Payment
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Address Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');
  const [addressType, setAddressType] = useState<'home' | 'work'>('home');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        const list = res.data.data || [];
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a: Address) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      } catch (err) {
        console.error('Failed to load addresses', err);
      }
    };

    fetchAddresses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isAuthenticated]);

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !city || !state || !postalCode) {
      toast.error('Please fill in all required address fields.');
      return;
    }

    try {
      const res = await api.post('/addresses', {
        fullName,
        phone,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        addressType,
        isDefault: true,
      });

      const newAddr = res.data.data;
      setAddresses([newAddr, ...addresses]);
      setSelectedAddressId(newAddr.id);
      setShowNewAddressForm(false);
      toast.success('Address saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error('Please select a delivery address to proceed.');
      setStep(1);
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create order on server with server-side pricing validation
      const payload = {
        items: items.map((i: any) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        addressId: selectedAddressId,
        paymentMethod,
      };

      const res = await api.post('/orders', payload);
      const { order, razorpay } = res.data.data;

      // 2. Handle payment flow
      if (paymentMethod === 'cod') {
        await clearCart();
        toast.success('Order placed successfully with Cash on Delivery!');
        navigate(`/payment/success?orderId=${order.id}`);
        return;
      }

      // 3. Handle Razorpay Payment Flow
      if (paymentMethod === 'razorpay') {
        if (typeof window.Razorpay !== 'undefined' && !razorpay?.isDemo) {
          const options = {
            key: razorpay.keyId,
            amount: razorpay.amount,
            currency: razorpay.currency || 'INR',
            name: 'Prajnacart',
            description: `Order #${order.orderNumber}`,
            order_id: razorpay.orderId,
            handler: async (response: any) => {
              try {
                await api.post('/orders/verify-payment', {
                  orderId: order.id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                });
                await clearCart();
                navigate(`/payment/success?orderId=${order.id}`);
              } catch {
                navigate(`/payment/failed?orderId=${order.id}`);
              }
            },
            prefill: {
              name: user?.firstName || 'Customer',
              email: user?.email,
              contact: user?.phone || '9876543210',
            },
            theme: { color: '#FF6B00' },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          // Demo Simulation Mode (Smooth instant payment verification)
          toast.info('Simulating Razorpay payment gateway verification (Demo Mode)...');
          setTimeout(async () => {
            try {
              await api.post('/orders/verify-payment', {
                orderId: order.id,
                razorpayOrderId: razorpay.orderId,
                razorpayPaymentId: `pay_sim_${Date.now()}`,
                razorpaySignature: 'valid_sim_sig',
              });
              await clearCart();
              navigate(`/payment/success?orderId=${order.id}`);
            } catch {
              navigate(`/payment/failed?orderId=${order.id}`);
            }
          }, 1200);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
      setIsProcessing(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-6">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <Lock className="text-novagreen-600" size={20} /> Secure Checkout
        </h1>
        <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
          100% Purchase Protection Guarantee
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Checkout Accordion Steps (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* STEP 1: Login Account */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-novaorange-500 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">LOGIN / ACCOUNT</p>
                <p className="text-sm font-bold text-gray-900">
                  {user?.firstName} {user?.lastName} <span className="font-normal text-gray-500">({user?.email})</span>
                </p>
              </div>
            </div>
            <span className="text-novagreen-600 text-xs font-bold flex items-center gap-1">
              <CheckCircle2 size={15} /> Verified
            </span>
          </div>

          {/* STEP 2: Delivery Address Selection */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <div className="bg-novaorange-500 p-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white text-novaorange-600 font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wider">DELIVERY ADDRESS</span>
              </div>
              {step > 1 && (
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-bold bg-white text-novaorange-600 px-3 py-1 rounded shadow-xs"
                >
                  Change Address
                </button>
              )}
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {step === 1 ? (
                <>
                  {/* Address List */}
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? 'border-novaorange-500 bg-orange-50/50 ring-1 ring-novaorange-500'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="deliveryAddress"
                            checked={selectedAddressId === addr.id}
                            onChange={() => setSelectedAddressId(addr.id)}
                            className="mt-1 text-novaorange-500 focus:ring-novaorange-500"
                          />
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                              <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">
                                {addr.addressType}
                              </span>
                              <span className="font-semibold text-gray-800">{addr.phone}</span>
                            </div>
                            <p className="text-gray-700">
                              {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                              {addr.city}, {addr.state} — <strong className="text-gray-900">{addr.postalCode}</strong>
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Add New Address Accordion */}
                  {showNewAddressForm ? (
                    <form onSubmit={handleAddNewAddress} className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-3 mt-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase">Add New Delivery Address</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="text-gray-600 block mb-1">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 block mb-1">10-digit Mobile Number *</label>
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-gray-600 block mb-1">Flat, House no., Building, Street *</label>
                          <input
                            type="text"
                            required
                            value={addressLine1}
                            onChange={(e) => setAddressLine1(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 block mb-1">City / District *</label>
                          <input
                            type="text"
                            required
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 block mb-1">State *</label>
                          <input
                            type="text"
                            required
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 block mb-1">PIN Code *</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
                          />
                        </div>
                        <div>
                          <label className="text-gray-600 block mb-1">Address Type</label>
                          <div className="flex gap-4 pt-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="newAddrType"
                                checked={addressType === 'home'}
                                onChange={() => setAddressType('home')}
                                className="accent-novaorange-500"
                              />
                              <span>Home</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="newAddrType"
                                checked={addressType === 'work'}
                                onChange={() => setAddressType('work')}
                                className="accent-novaorange-500"
                              />
                              <span>Work / Office</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-novaorange-500 text-white font-bold rounded text-xs hover:bg-novaorange-600"
                        >
                          Save and Deliver Here
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded text-xs hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="flex items-center gap-1 text-xs font-bold text-novaorange-600 hover:text-novaorange-700 py-1"
                    >
                      <Plus size={15} /> Add a new delivery address
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!selectedAddressId) {
                        toast.error('Please select an address.');
                        return;
                      }
                      setStep(2);
                    }}
                    className="w-full sm:w-auto mt-4 px-8 py-2.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold text-xs uppercase rounded shadow-sm"
                  >
                    Deliver Here & Continue
                  </button>
                </>
              ) : (
                <div className="text-xs text-gray-700">
                  <p className="font-bold text-gray-900">{selectedAddress?.fullName} ({selectedAddress?.phone})</p>
                  <p>{selectedAddress?.addressLine1}, {selectedAddress?.city}, {selectedAddress?.state} - {selectedAddress?.postalCode}</p>
                </div>
              )}
            </div>
          </div>

          {/* STEP 3: Order Summary & Review */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <div className="bg-novaorange-500 p-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded bg-white text-novaorange-600 font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-sm font-extrabold uppercase tracking-wider">ORDER SUMMARY</span>
              </div>
              {step > 2 && (
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-bold bg-white text-novaorange-600 px-3 py-1 rounded shadow-xs"
                >
                  Review Items
                </button>
              )}
            </div>

            {step >= 2 && (
              <div className="p-4 sm:p-5 space-y-4">
                <div className="divide-y divide-gray-100">
                  {items.map((item: any) => {
                    if (!item.product) return null;
                    const unitPrice = item.variant ? item.variant.price : item.product.price;
                    return (
                      <div key={item.id} className="py-3 flex items-center gap-3">
                        <img
                          src={item.variant?.imageUrl || item.product.thumbnailUrl}
                          alt={item.product.title}
                          className="w-14 h-14 object-contain rounded bg-white border border-gray-100 p-1"
                        />
                        <div className="flex-1 min-w-0 text-xs">
                          <p className="font-semibold text-gray-900 truncate">{item.product.title}</p>
                          <p className="text-gray-500">Qty: {item.quantity}</p>
                          <p className="font-bold text-gray-900">₹{(unitPrice * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {step === 2 && (
                  <button
                    onClick={() => setStep(3)}
                    className="w-full sm:w-auto px-8 py-2.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold text-xs uppercase rounded shadow-sm"
                  >
                    Continue to Payment
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STEP 4: Payment Options */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
            <div className="bg-novaorange-500 p-3.5 text-white flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-white text-novaorange-600 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <span className="text-sm font-extrabold uppercase tracking-wider">PAYMENT OPTIONS</span>
            </div>

            {step === 3 && (
              <div className="p-4 sm:p-5 space-y-4 animate-fade-in">
                <div className="space-y-3">
                  {/* Razorpay Online */}
                  <label
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-novaorange-500 bg-orange-50/50 ring-1 ring-novaorange-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="mt-1 text-novaorange-500"
                      />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                          <CreditCard size={16} className="text-novaorange-600" />
                          Razorpay Online Payment (Cards, UPI, NetBanking, Wallets)
                        </p>
                        <p className="text-gray-500">
                          Instant confirmation with 256-bit SSL encrypted transaction security.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Cash on Delivery (COD) */}
                  <label
                    className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                      paymentMethod === 'cod'
                        ? 'border-novaorange-500 bg-orange-50/50 ring-1 ring-novaorange-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="payMethod"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="mt-1 text-novaorange-500"
                      />
                      <div className="text-xs space-y-1">
                        <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                          <Banknote size={16} className="text-novagreen-600" />
                          Cash on Delivery (COD)
                        </p>
                        <p className="text-gray-500">
                          Pay in cash or UPI QR at your doorstep upon receiving the shipment.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold text-sm uppercase rounded shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 tracking-wider"
                >
                  {isProcessing
                    ? 'Processing Payment...'
                    : paymentMethod === 'cod'
                    ? `Confirm Order (Pay ₹${summary.grandTotal.toLocaleString('en-IN')})`
                    : `Pay ₹${summary.grandTotal.toLocaleString('en-IN')} via Razorpay`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Price Details Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-card space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2.5">
              PRICE DETAILS
            </h2>

            <div className="space-y-2 text-xs text-gray-700">
              <div className="flex justify-between">
                <span>Price ({summary.itemCount} items)</span>
                <span>₹{summary.totalMrp.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between text-novagreen-600 font-semibold">
                <span>Discount on MRP</span>
                <span>- ₹{summary.totalDiscount.toLocaleString('en-IN')}</span>
              </div>

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
                <span>Packaging Fee</span>
                <span>₹{summary.packagingFee}</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between text-base font-black text-gray-900">
                <span>Total Payable</span>
                <span>₹{summary.grandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-novagreen-50 border border-novagreen-200 rounded p-2.5 text-xs text-novagreen-700 font-bold text-center">
              You will save ₹{summary.totalDiscount.toLocaleString('en-IN')} on this order!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
