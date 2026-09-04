import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const { syncGuestCart } = useCartStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register({
      firstName,
      lastName,
      email,
      phone,
      password,
      role: 'customer',
    });

    if (success) {
      await syncGuestCart();
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 shadow-card max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Branding (5 cols) */}
        <div className="md:col-span-5 bg-novaorange-500 p-8 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-3xl font-black italic tracking-tight font-sans text-white">
              PRAJNA<span className="text-[#0066FF]">CART</span>
            </span>
            <h2 className="text-2xl font-extrabold leading-snug">
              Join Millions of Shoppers
            </h2>
            <p className="text-xs text-orange-100 leading-relaxed">
              Sign up today and get an instant ₹100 discount coupon with superfast delivery and verified reviews.
            </p>
          </div>

          <div className="pt-8 space-y-2 text-xs text-orange-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-novayellow-500" />
              <span>Genuine Brands & 7 Days Replacement</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-novayellow-500" />
              <span>Earn SuperCoins on every purchase</span>
            </div>
          </div>
        </div>

        {/* Right Form (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create your Prajnacart Account</h1>
            <p className="text-xs text-gray-500 mt-1">
              Fill in your details below to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">First Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                  />
                  <User size={14} className="absolute left-2.5 top-3 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Last Name</label>
                <input
                  type="text"
                  placeholder="Sharma"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Email Address *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Mail size={14} className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">10-Digit Mobile Number</label>
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Phone size={14} className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Password *</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Lock size={14} className="absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold rounded uppercase tracking-wider text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Continue to Register'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-novaorange-600 font-bold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
