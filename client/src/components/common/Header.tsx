import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, Heart, User as UserIcon, LogOut, 
  Store, ShieldCheck, Sparkles, ChevronDown, Package, MapPin, 
  Menu, X, ArrowRight, Shield 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import api from '../../lib/api';
import { Product } from '../../types';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, quickLogin } = useAuthStore();
  const { summary } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDemoBarOpen, setIsDemoBarOpen] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Debounced auto-complete search query
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const res = await api.get(`/products?q=${encodeURIComponent(searchQuery)}&limit=5`);
          setSuggestions(res.data.data.products || []);
        } catch (err) {
          console.error('Search suggestion error', err);
        }
      } else {
        setSuggestions([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (slug: string) => {
    setShowSuggestions(false);
    setSearchQuery('');
    navigate(`/products/${slug}`);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#affcff] border-b border-[#9eeef2] shadow-xs transition-all">
      {/* 2. MAIN LIGHT CYAN HEADER (#affcff) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Hamburger Menu & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#102A43] hover:text-[#0066FF] p-1 flex items-center justify-center focus:outline-none transition-colors"
              title="Toggle Menu"
            >
              <Menu size={28} />
            </button>

            <Link to="/" className="flex items-center shrink-0" title="Prajnacart Home">
              <img
                src="/logo.png"
                alt="PRAJNA CART - Explore Plus+"
                className="h-11 sm:h-14 w-auto max-h-14 object-contain select-none"
              />
            </Link>
          </div>

          {/* Large Center Search Bar */}
          <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search for Products, Brands and More..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full h-11 pl-4 pr-12 text-sm text-gray-900 bg-white rounded-lg shadow-sm border border-[#8ce8ec]/80 focus:outline-none focus:ring-2 focus:ring-[#0066FF] placeholder-[#64748B]"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-3.5 text-[#0066FF] hover:text-[#0052cc] flex items-center justify-center transition-colors"
                title="Search"
              >
                <Search size={20} />
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-lg shadow-floating border border-gray-100 overflow-hidden z-50 animate-fade-in">
                <div className="p-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b">
                  Matching Products
                </div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.slug)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-orange-50 border-b border-gray-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-8 h-8 object-contain rounded bg-white"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 group-hover:text-[#FF6B00] line-clamp-1">
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          in <span className="font-semibold text-gray-700">{item.categoryName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        â‚¹{item.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={handleSearchSubmit}
                  className="w-full p-2.5 bg-gray-50 text-xs font-semibold text-[#FF6B00] hover:bg-orange-50 flex items-center justify-center gap-1 transition-colors"
                >
                  See all results for "{searchQuery}" <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Right Header Navigation Items: Account, Wishlist, Cart */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Account Link / Dropdown */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-1.5 text-[#102A43] hover:text-[#0066FF] font-bold text-sm px-2 py-1.5 rounded hover:bg-black/5 transition-colors"
              >
                <UserIcon size={19} className="text-[#102A43]" />
                <span className="hidden sm:inline">
                  {isAuthenticated ? user?.firstName || 'Prajna Cart' : 'Prajna Cart'}
                </span>
                <ChevronDown size={14} className={`text-[#102A43] transition-transform duration-200 ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Account Dropdown Menu */}
              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-floating py-1.5 text-gray-800 text-sm border border-gray-100 z-50 animate-fade-in">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                        <p className="font-bold text-gray-900 truncate">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-orange-100 text-[#FF6B00] rounded">
                          Role: {user?.role}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium"
                      >
                        <UserIcon size={16} className="text-[#FF6B00]" />
                        My Profile
                      </Link>

                      <Link
                        to="/profile/orders"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium"
                      >
                        <Package size={16} className="text-[#FF6B00]" />
                        Orders & Tracking
                      </Link>

                      <Link
                        to="/wishlist"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium"
                      >
                        <Heart size={16} className="text-rose-500" />
                        Wishlist ({wishlistItems.length})
                      </Link>

                      <Link
                        to="/profile/addresses"
                        onClick={() => setIsAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-medium"
                      >
                        <MapPin size={16} className="text-[#FF6B00]" />
                        Saved Addresses
                      </Link>

                      {user?.role === 'seller' && (
                        <Link
                          to="/seller"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-[#FF6B00] font-semibold border-t border-gray-100"
                        >
                          <Store size={16} />
                          Seller Dashboard
                        </Link>
                      )}

                      {user?.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-purple-50 text-purple-600 font-semibold border-t border-gray-100"
                        >
                          <ShieldCheck size={16} />
                          Admin Control Center
                        </Link>
                      )}

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setIsAccountOpen(false);
                            logout();
                          }}
                          className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 text-rose-600 font-medium"
                        >
                          <LogOut size={16} />
                          Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-xs text-gray-700">New customer?</span>
                        <Link
                          to="/register"
                          onClick={() => setIsAccountOpen(false)}
                          className="text-xs font-bold text-[#FF6B00] hover:underline"
                        >
                          Sign Up
                        </Link>
                      </div>
                      <Link
                        to="/login"
                        onClick={() => setIsAccountOpen(false)}
                        className="block w-full py-2 bg-[#FF6B00] hover:bg-[#e85d00] text-white font-bold text-xs text-center rounded transition-colors"
                      >
                        Login
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist Link */}
            <Link
              to="/wishlist"
              className="flex items-center gap-1.5 text-[#102A43] hover:text-[#0066FF] font-bold text-sm transition-colors"
            >
              <div className="relative">
                <Heart size={20} className="text-[#102A43]" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Wishlist</span>
            </Link>

            {/* Cart Link */}
            <Link
              to="/cart"
              className="flex items-center gap-1.5 text-[#102A43] hover:text-[#0066FF] font-bold text-sm transition-colors"
            >
              <div className="relative">
                <ShoppingCart size={22} className="text-[#102A43]" />
                <span className="absolute -top-2 -right-2.5 bg-[#0066FF] text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs border border-white/40">
                  {summary.itemCount || 1}
                </span>
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search Bar (Separate Row on Mobile) */}
        <div className="pt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search for Products, Brands and More..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-4 pr-10 text-xs text-gray-900 bg-white rounded-lg shadow-sm border border-[#8ce8ec]/80 focus:outline-none placeholder-[#64748B]"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 bottom-0 px-3 text-[#0066FF] flex items-center justify-center"
            >
              <Search size={17} />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};


