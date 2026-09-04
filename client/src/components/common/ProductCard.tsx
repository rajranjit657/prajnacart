import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ShoppingCart, Zap } from 'lucide-react';
import { Product } from '../../types';
import { useWishlistStore } from '../../store/wishlistStore';
import { useCartStore } from '../../store/cartStore';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'horizontal' | 'compact';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, variant = 'grid' }) => {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const isWishlisted = isInWishlist(product.id);

  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/products/${product.slug}`}
        className="group bg-white rounded-lg border border-gray-200 p-3 hover:shadow-card-hover transition-all flex flex-col items-center text-center relative"
      >
        <div className="w-full h-32 flex items-center justify-center p-2">
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        <h4 className="text-xs font-semibold text-gray-800 group-hover:text-novaorange-600 line-clamp-1 mt-2">
          {product.title}
        </h4>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs font-bold text-gray-900">₹{product.price.toLocaleString('en-IN')}</span>
          {discountPercent > 0 && (
            <span className="text-[11px] font-bold text-novagreen-600">{discountPercent}% off</span>
          )}
        </div>
      </Link>
    );
  }

  return (
    <div className="group bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
      {/* Top Wishlist Heart Icon */}
      <button
        onClick={handleWishlistClick}
        aria-label="Add to Wishlist"
        className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-gray-400 hover:text-rose-500 shadow-xs transition-colors"
      >
        <Heart
          size={18}
          className={`transition-transform duration-200 hover:scale-110 ${
            isWishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none'
          }`}
        />
      </button>

      {/* Product Image & Link */}
      <Link to={`/products/${product.slug}`} className="p-4 flex flex-col items-center">
        <div className="w-full h-44 sm:h-48 flex items-center justify-center relative p-2">
          <img
            src={product.thumbnailUrl}
            alt={product.title}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.isDealOfTheDay && (
            <span className="absolute bottom-1 left-1 bg-novaorange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
              DEAL OF THE DAY
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="w-full mt-3 space-y-1.5">
          {/* Brand */}
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            {product.brandName}
          </span>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-novaorange-600 line-clamp-2 leading-snug">
            {product.title}
          </h3>

          {/* Ratings Pill */}
          <div className="flex items-center gap-2 pt-0.5">
            <span className="inline-flex items-center gap-0.5 bg-novagreen-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
              {product.rating > 0 ? product.rating.toFixed(1) : '4.4'} <Star size={10} className="fill-white" />
            </span>
            <span className="text-[11px] text-gray-500 font-medium">
              ({(product.reviewCount || 128).toLocaleString()})
            </span>
          </div>

          {/* Pricing & Discount */}
          <div className="flex items-baseline flex-wrap gap-2 pt-1">
            <span className="text-base sm:text-lg font-black text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-bold text-novagreen-600">
                  {discountPercent}% off
                </span>
              </>
            )}
          </div>

          {/* Fast Delivery Badge */}
          <p className="text-[11px] text-gray-600 font-medium pt-0.5 flex items-center gap-1">
            <span className="text-novaorange-600 font-bold">Free delivery</span> by Tomorrow
          </p>
        </div>
      </Link>

      {/* Quick Add To Cart Action */}
      <div className="p-3 pt-0 border-t border-transparent">
        <button
          onClick={handleAddToCart}
          className="w-full py-2 px-3 bg-orange-50 hover:bg-novaorange-500 text-novaorange-600 hover:text-white border border-orange-200 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
};
