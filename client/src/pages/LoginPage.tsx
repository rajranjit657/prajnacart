import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login, isLoading } = useAuthStore();
  const { syncGuestCart } = useCartStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      await syncGuestCart();
      navigate(redirect);
    }
  };


  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 shadow-card max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Visual Branding Panel (5 cols) */}
        <div className="md:col-span-5 bg-novaorange-500 p-8 text-white flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-3xl font-black italic tracking-tight font-sans text-white">
              PRAJNA<span className="text-[#0066FF]">CART</span>
            </span>
            <h2 className="text-2xl font-extrabold leading-snug">
              India's Premier Online Marketplace
            </h2>
            <p className="text-xs text-orange-100 leading-relaxed">
              Get access to your Orders, Wishlist, Recommendations, and exclusive SuperCoin benefits.
            </p>
          </div>

          <div className="pt-8 space-y-2 text-xs text-orange-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-novayellow-500" />
              <span>100% Secure & Verified Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-novayellow-500" />
              <span>Millions of Authentic Products</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
            <p className="text-xs text-gray-500 mt-1">
              Enter your credentials to sign in to your account.
            </p>
          </div>


          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-gray-700 font-semibold">Password</label>
                <Link to="/forgot-password" className="text-novaorange-600 hover:underline text-[11px] font-semibold">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold rounded uppercase tracking-wider text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Signing In...' : 'Sign In'} <ArrowRight size={14} />
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center text-xs text-gray-600 space-y-2">
            <p>
              New to Prajnacart?{' '}
              <Link to="/register" className="text-novaorange-600 font-bold hover:underline">
                Create an Account
              </Link>
            </p>
            <p>
              Want to sell products?{' '}
              <Link to="/seller/register" className="text-novaorange-600 font-bold hover:underline">
                Register as a Seller
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

