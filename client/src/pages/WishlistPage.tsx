import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { ProductCard } from '../components/common/ProductCard';

export const WishlistPage: React.FC = () => {
  const { items } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center shadow-card max-w-lg mx-auto space-y-4">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
            <Heart size={36} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900">Empty Wishlist</h2>
          <p className="text-xs text-gray-500">
            You have no items in your wishlist. Start adding items you love to keep track of price drops and availability!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs px-6 py-3 rounded shadow-sm transition-all"
          >
            Explore Catalog <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-card flex items-center justify-between">
        <h1 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <Heart className="fill-rose-500 text-rose-500" size={20} /> My Wishlist ({items.length} Items)
        </h1>
        <Link to="/cart" className="text-xs font-bold text-novaorange-600 hover:underline">
          Go to Cart →
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          item.product && <ProductCard key={item.id} product={item.product} />
        ))}
      </div>
    </div>
  );
};
