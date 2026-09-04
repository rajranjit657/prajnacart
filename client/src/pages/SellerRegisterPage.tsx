import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, User, Mail, Phone, Lock, Building, CreditCard, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toast } from '../store/toastStore';

export const SellerRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();

  const [storeName, setStoreName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !firstName || !email || !password) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const success = await register({
      firstName,
      email,
      phone,
      password,
      role: 'seller',
      storeName,
    });

    if (success) {
      toast.success('Seller registration submitted! Redirecting to seller portal...');
      navigate('/seller');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 shadow-card max-w-5xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Branding Panel (5 cols) */}
        <div className="md:col-span-5 bg-novadark-900 p-8 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-3xl font-black italic tracking-tight font-sans text-white">
              PRAJNA<span className="text-[#0066FF]">CART</span>
            </span>
            <div className="inline-block bg-novaorange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
              SELLER ONBOARDING
            </div>
            <h2 className="text-2xl font-extrabold leading-snug">
              Sell to 50M+ Shoppers Across India
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Grow your business with India's lowest marketplace commission rates, 7-day express payouts, and comprehensive logistics support.
            </p>
          </div>

          <div className="pt-8 space-y-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-novagreen-500" />
              <span>Lowest 8% Flat Marketplace Commission</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-novagreen-500" />
              <span>Timely 7-Day Bank Payouts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-novagreen-500" />
              <span>Full Logistics & Courier Pickup</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Register Your Store on Prajnacart</h1>
            <p className="text-xs text-gray-500 mt-1">
              Provide your business and store details to list your catalog.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">Store / Business Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Apex Electronics"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                  />
                  <Store size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Primary Owner Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Vikram Singh"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                  />
                  <User size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">Business Email *</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="business@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                  />
                  <Mail size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Business Phone Number</label>
                <div className="relative">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                  />
                  <Phone size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">GSTIN Number (Optional)</label>
                <input
                  type="text"
                  placeholder="29ABCDE1234F1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">PAN Card Number (Optional)</label>
                <input
                  type="text"
                  placeholder="ABCDE1234F"
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Account Password *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Lock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Store Description & Categories Sold</label>
              <textarea
                rows={2}
                placeholder="Describe the items you plan to list on Prajnacart..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold rounded uppercase tracking-wider text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Submitting Application...' : 'Register as a Seller'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
            Already registered as a seller?{' '}
            <Link to="/login" className="text-novaorange-600 font-bold hover:underline">
              Sign In to Seller Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
