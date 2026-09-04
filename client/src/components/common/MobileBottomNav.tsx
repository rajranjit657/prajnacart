import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Layers, Heart, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { summary } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-floating px-2 py-1 flex items-center justify-around text-[10px]">
      <Link
        to="/"
        className={`flex flex-col items-center py-1 px-3 ${
          isActive('/') ? 'text-novaorange-600 font-bold' : 'text-gray-600'
        }`}
      >
        <Home size={20} />
        <span className="mt-0.5">Home</span>
      </Link>

      <Link
        to="/products"
        className={`flex flex-col items-center py-1 px-3 ${
          isActive('/products') ? 'text-novaorange-600 font-bold' : 'text-gray-600'
        }`}
      >
        <Layers size={20} />
        <span className="mt-0.5">Categories</span>
      </Link>

      <Link
        to="/wishlist"
        className={`flex flex-col items-center py-1 px-3 relative ${
          isActive('/wishlist') ? 'text-novaorange-600 font-bold' : 'text-gray-600'
        }`}
      >
        <div className="relative">
          <Heart size={20} />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {wishlistItems.length}
            </span>
          )}
        </div>
        <span className="mt-0.5">Wishlist</span>
      </Link>

      <Link
        to="/cart"
        className={`flex flex-col items-center py-1 px-3 relative ${
          isActive('/cart') ? 'text-novaorange-600 font-bold' : 'text-gray-600'
        }`}
      >
        <div className="relative">
          <ShoppingCart size={20} />
          {summary.itemCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-novaorange-500 text-white text-[9px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {summary.itemCount}
            </span>
          )}
        </div>
        <span className="mt-0.5">Cart</span>
      </Link>

      <Link
        to={isAuthenticated ? '/profile' : '/login'}
        className={`flex flex-col items-center py-1 px-3 ${
          isActive('/profile') || isActive('/login') ? 'text-novaorange-600 font-bold' : 'text-gray-600'
        }`}
      >
        <User size={20} />
        <span className="mt-0.5">{isAuthenticated ? 'Account' : 'Login'}</span>
      </Link>
    </div>
  );
};
