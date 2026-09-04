import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, ShoppingCart, Zap, Star, ShieldCheck, 
  RotateCcw, Truck, Award, Tag, Check, Share2, 
  ChevronRight, ThumbsUp, HelpCircle 
} from 'lucide-react';
import api from '../lib/api';
import { Product, ProductVariant, Review } from '../types';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { useAuthStore } from '../store/authStore';
import { ImageZoom } from '../components/common/ImageZoom';
import { PinCodeChecker } from '../components/common/PinCodeChecker';
import { RatingStars } from '../components/common/RatingStars';
import { ProductCard } from '../components/common/ProductCard';
import { toast } from '../store/toastStore';

export const ProductDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { isAuthenticated, user } = useAuthStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form State
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!identifier) return;
      setIsLoading(true);
      try {
        const res = await api.get(`/products/${identifier}`);
        const p: Product = res.data.data;
        setProduct(p);
        setSelectedImage(p.thumbnailUrl || (p.images && p.images[0]) || '');

        if (p.variants && p.variants.length > 0) {
          setSelectedVariant(p.variants[0]);
        } else {
          setSelectedVariant(null);
        }

        // Fetch verified reviews
        try {
          const revRes = await api.get(`/reviews/product/${p.id}`);
          setReviews(revRes.data.data.reviews || []);
        } catch {
          // fallback
        }

        // Fetch related products
        try {
          const relRes = await api.get(`/products?category=${p.categoryId}&limit=5`);
          const relList = (relRes.data.data.products || []).filter((item: Product) => item.id !== p.id);
          setRelatedProducts(relList);
        } catch {
          // fallback
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [identifier]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 h-96 bg-gray-200 rounded-lg animate-pulse" />
          <div className="md:col-span-7 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="bg-novaorange-500 text-white font-bold px-6 py-2.5 rounded text-sm">
          Browse Products
        </Link>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  const currentStock = selectedVariant ? selectedVariant.stockQuantity : product.stockQuantity;
  const discountPercent = Math.round(((currentMrp - currentPrice) / currentMrp) * 100);

  const handleAddToCart = async () => {
    const success = await addItem(product, selectedVariant || undefined, quantity);
    if (success) {
      navigate('/cart');
    }
  };

  const handleBuyNow = async () => {
    await addItem(product, selectedVariant || undefined, quantity);
    navigate('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please sign in to write a product review.');
      navigate('/login');
      return;
    }

    if (!reviewComment) {
      toast.error('Please write a review comment.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        productId: product.id,
        rating: ratingInput,
        title: reviewTitle,
        comment: reviewComment,
      });

      setReviews([res.data.data, ...reviews]);
      setReviewTitle('');
      setReviewComment('');
      toast.success('Thank you! Your verified review has been posted.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb Bar */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 overflow-x-auto no-scrollbar">
        <Link to="/" className="hover:text-novaorange-600 shrink-0">Home</Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link to={`/category/${product.categoryId}`} className="hover:text-novaorange-600 shrink-0 font-medium">
          {product.categoryName}
        </Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="text-gray-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Main Product Stage: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery & Sticky Action Bar (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex flex-col sm:flex-row gap-4 relative">
            {/* Wishlist Floating Button */}
            <button
              onClick={() => toggleWishlist(product)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-gray-200 shadow-xs flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors"
            >
              <Heart size={20} className={isWishlisted ? 'fill-rose-500 text-rose-500' : 'fill-none'} />
            </button>

            {/* Thumbnail Strip */}
            {product.images && product.images.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto no-scrollbar sm:max-h-96 order-2 sm:order-1">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded border p-1 shrink-0 bg-white transition-all ${
                      selectedImage === img ? 'border-novaorange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`${product.title} view ${idx}`} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Zoom Lens View */}
            <div className="flex-1 flex items-center justify-center p-2 min-h-[320px] sm:min-h-[380px] order-1 sm:order-2">
              <ImageZoom src={selectedImage || product.thumbnailUrl} alt={product.title} />
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAddToCart}
              className="py-3.5 px-4 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold text-xs sm:text-sm uppercase rounded shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>

            <button
              onClick={handleBuyNow}
              className="py-3.5 px-4 bg-novaorange-600 hover:bg-novaorange-700 text-white font-extrabold text-xs sm:text-sm uppercase rounded shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 tracking-wide"
            >
              <Zap size={18} /> Buy Now
            </button>
          </div>
        </div>

        {/* Right Product Specifications & Offers (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-gray-200 p-5 sm:p-7 shadow-card space-y-6">
          {/* Title & Brand */}
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{product.brandName}</span>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 leading-snug">{product.title}</h1>
          </div>

          {/* Rating Pill & SuperCoin Tag */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1 bg-novagreen-500 text-white text-xs font-bold px-2 py-0.5 rounded">
              <span>{product.rating > 0 ? product.rating.toFixed(1) : '4.5'}</span>
              <Star size={11} className="fill-white" />
            </div>
            <span className="text-xs text-gray-500 font-medium">
              {(product.reviewCount || 128).toLocaleString()} Ratings & {reviews.length} Verified Reviews
            </span>
          </div>

          {/* Pricing Box */}
          <div className="space-y-1 border-t border-b border-gray-100 py-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black text-gray-900">
                ₹{currentPrice.toLocaleString('en-IN')}
              </span>
              {currentMrp > currentPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ₹{currentMrp.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-bold text-novagreen-600">
                    {discountPercent}% off
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-gray-500 font-medium">Inclusive of all taxes</p>
          </div>

          {/* Available Bank Offers Strip */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-novagreen-600" /> Available Offers & Discounts
            </h3>
            <div className="space-y-1.5 text-xs text-gray-700">
              <div className="flex items-start gap-2">
                <span className="font-bold text-novagreen-600 shrink-0">Bank Offer</span>
                <span>5% Unlimited Cashback on Flipkart Axis Bank / HDFC Credit Card.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-novagreen-600 shrink-0">Special Price</span>
                <span>Get extra ₹2,000 off on exchange of old devices.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-novagreen-600 shrink-0">Partner Offer</span>
                <span>Sign up for Prajnacart Pay Later & get free ₹250 voucher.</span>
              </div>
            </div>
          </div>

          {/* Product Variants (Colors / Sizes / Storage) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Select Option / Variant
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setSelectedVariant(v);
                      if (v.imageUrl) setSelectedImage(v.imageUrl);
                    }}
                    className={`px-3 py-2 rounded border text-xs font-bold transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-novaorange-500 bg-orange-50 text-novaorange-700 ring-1 ring-novaorange-500'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div>{v.name}</div>
                    <div className="text-[10px] text-gray-500 font-normal">₹{v.price.toLocaleString('en-IN')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery PIN Code Checker */}
          <div className="border-t border-gray-100 pt-4">
            <PinCodeChecker />
          </div>

          {/* Highlight Key Highlights */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Highlights</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700 list-disc list-inside">
                {Object.entries(product.specifications).slice(0, 6).map(([key, val]) => (
                  <li key={key}>
                    <span className="font-semibold text-gray-800">{key}:</span> {String(val)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seller / Warranty / Return Service Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-100 pt-4 text-xs">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <RotateCcw size={16} className="text-novaorange-500 shrink-0" />
              <span>{product.returnPolicy || '7 Days Replacement Policy'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <ShieldCheck size={16} className="text-novagreen-500 shrink-0" />
              <span>{product.warrantyInfo || '1 Year Brand Warranty'}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
              <Truck size={16} className="text-purple-500 shrink-0" />
              <span>{product.deliveryInfo || 'Free Express Delivery'}</span>
            </div>
          </div>

          {/* Product Description */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Product Description</h3>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          {/* Specifications Table */}
          {product.specificationsStructured && product.specificationsStructured.length > 0 && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Technical Specifications</h3>
              <div className="border border-gray-200 rounded divide-y divide-gray-200 text-xs">
                {product.specificationsStructured.map((group: any, gIdx: number) => (
                  <div key={gIdx} className="p-3">
                    <h4 className="font-bold text-gray-800 uppercase text-[11px] mb-2">{group.groupName}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {group.specs.map((spec: any, sIdx: number) => (
                        <div key={sIdx} className="flex justify-between border-b border-gray-100 py-1">
                          <span className="text-gray-500">{spec.name}</span>
                          <span className="font-semibold text-gray-900">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ratings & Verified Reviews Section */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900">Ratings & Customer Reviews</h2>
            <p className="text-xs text-gray-500">Verified buyer ratings and authentic user feedback</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-3xl font-black text-gray-900 flex items-center gap-1">
              <span>{product.rating > 0 ? product.rating.toFixed(1) : '4.5'}</span>
              <Star className="text-novayellow-500 fill-novayellow-500" size={26} />
            </div>
            <div className="text-xs text-gray-500 font-medium">
              <p>Overall Marketplace Rating</p>
              <p>{reviews.length} Verified Reviews</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmitReview} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-xs">
          <h3 className="font-bold text-gray-800 uppercase">Write a Customer Review</h3>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium">Your Rating:</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingInput(star)}
                  className="p-0.5 text-gray-300 hover:text-novayellow-500"
                >
                  <Star
                    size={20}
                    className={star <= ratingInput ? 'fill-novayellow-500 text-novayellow-500' : ''}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              placeholder="Headline / Title (e.g. Excellent sound quality & battery life)"
              value={reviewTitle}
              onChange={(e) => setReviewTitle(e.target.value)}
              className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 text-xs"
            />
          </div>

          <div>
            <textarea
              rows={3}
              placeholder="Write your honest review here..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingReview}
            className="px-6 py-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold rounded text-xs transition-colors disabled:opacity-50"
          >
            {isSubmittingReview ? 'Submitting...' : 'Submit Verified Review'}
          </button>
        </form>

        {/* Review List */}
        <div className="space-y-4 divide-y divide-gray-100">
          {reviews.map((r: any) => (
            <div key={r.id} className="pt-4 first:pt-0 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-0.5 bg-novagreen-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                  {r.rating} <Star size={9} className="fill-white" />
                </span>
                <span className="font-bold text-gray-900">{r.title || 'Verified Purchase'}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{r.comment}</p>
              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-600">{r.userName || 'Verified Buyer'}</span>
                <span>•</span>
                <span className="text-novagreen-600 font-semibold flex items-center gap-0.5">
                  <Check size={11} /> Certified Buyer
                </span>
                <span>•</span>
                <span>{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Related Products Carousel Strip */}
      {relatedProducts.length > 0 && (
        <section className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4">
          <h2 className="text-base font-extrabold text-gray-900">Similar Products You May Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
