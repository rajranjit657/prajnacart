import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Flame, Clock, ArrowRight, 
  ShieldCheck, Truck, RotateCcw, Headset, Sparkles, Star, 
  Zap, ShoppingCart, Award 
} from 'lucide-react';
import { ProductCard } from '../components/common/ProductCard';
import api from '../lib/api';
import { Product, Banner } from '../types';

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide_1',
    badge: 'LIMITED TIME DEAL',
    title: 'Grand Super Electronic\nFestival',
    subtitle: 'Up to 50% OFF on Flagship Smartphones,\nLaptops & Premium Audio',
    ctaText: 'Explore Tech Deals',
    ctaLink: '/products?category=cat_electronics',
    imageUrl: '/banners/hero_electronics_festival.jpg',
  },
  {
    id: 'slide_2',
    badge: 'MEGA FASHION CARNIVAL',
    title: 'Trending Styles &\nLuxury Essentials',
    subtitle: 'Min 60% OFF on Top Designer Brands,\nFootwear & Smartwatches',
    ctaText: 'Shop Fashion Deals',
    ctaLink: '/products?category=cat_fashion_men',
    imageUrl: '/banners/hero_fashion_carnival.jpg',
  },
  {
    id: 'slide_3',
    badge: 'SMART LIVING DEALS',
    title: 'Smart Home & Kitchen\nSuper Sale',
    subtitle: 'Upgrade to Modern Appliances with Instant\nBank Discounts & No-Cost EMI',
    ctaText: 'Explore Home Deals',
    ctaLink: '/products?category=cat_home_kitchen',
    imageUrl: '/banners/hero_home_appliances.jpg',
  },
];

export const HomePage: React.FC = () => {
  const [deals, setDeals] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [mobiles, setMobiles] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });
  const touchStartX = useRef<number | null>(null);

  // Load products
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dealsRes, featuredRes, mobilesRes] = await Promise.all([
          api.get('/products?dealOfTheDay=true&limit=6'),
          api.get('/products?isFeatured=true&limit=6'),
          api.get('/products?category=cat_mobiles&limit=6'),
        ]);

        setDeals(dealsRes.data.data.products || []);
        setFeaturedProducts(featuredRes.data.data.products || []);
        setMobiles(mobilesRes.data.data.products || []);
      } catch (err) {
        console.error('Failed to load homepage data', err);
      }
    };
    fetchData();
  }, []);

  // Hero carousel auto-play
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Deal countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
      } else {
        setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
      }
    }
    touchStartX.current = null;
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 pt-4 sm:pt-6">
      {/* 1. LARGE ROYAL BLUE HERO CAROUSEL */}
      <section 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-[380px] sm:h-[460px] lg:h-[500px] w-full rounded-2xl overflow-hidden shadow-lg bg-[#0057B8]">
          {HERO_SLIDES.map((slide, index) => {
            const isCurrent = index === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image showing products on the right */}
                <img
                  src={slide.imageUrl}
                  alt={slide.title}
                  className="w-full h-full object-cover object-right sm:object-center"
                />

                {/* Left Side Content Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#0057B8]/95 via-[#0057B8]/75 to-transparent sm:w-3/5 flex flex-col justify-center px-6 sm:px-12 md:px-16 z-20">
                  <div className="max-w-lg space-y-3 sm:space-y-4">
                    {/* Badge */}
                    <div>
                      <span className="inline-block bg-[#0066FF] text-white font-extrabold text-[11px] sm:text-xs uppercase px-3 py-1 rounded shadow-xs tracking-wider">
                        {slide.badge}
                      </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-2xl sm:text-4xl lg:text-[44px] font-black text-white leading-[1.15] tracking-tight whitespace-pre-line drop-shadow-xs">
                      {slide.title}
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xs sm:text-sm md:text-[15px] text-blue-100/95 font-medium leading-relaxed whitespace-pre-line">
                      {slide.subtitle}
                    </p>

                    {/* CTA Button */}
                    <div className="pt-2 sm:pt-3">
                      <Link
                        to={slide.ctaLink}
                        className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e85d00] text-white font-extrabold text-xs sm:text-sm md:text-base px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg shadow-md transition-all hover:scale-105 active:scale-95 tracking-wide"
                      >
                        <span>{slide.ctaText}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Left Arrow Navigation Button */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1))}
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg text-[#0047AB] hover:text-[#0066FF] hover:scale-110 flex items-center justify-center transition-all"
            title="Previous Slide"
          >
            <ChevronLeft size={22} className="stroke-[2.5]" />
          </button>

          {/* Right Arrow Navigation Button */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg text-[#0047AB] hover:text-[#0066FF] hover:scale-110 flex items-center justify-center transition-all"
            title="Next Slide"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
          </button>

          {/* Bottom Pagination Dots / Pills */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 ${
                  idx === currentSlide
                    ? 'w-6 h-2 bg-[#0066FF] rounded-full shadow-xs'
                    : 'w-2 h-2 bg-white/80 hover:bg-white rounded-full'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. FOUR HORIZONTAL FEATURE / SERVICE CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: 100% Original Products */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#d2ebe0]/60 flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <ShieldCheck size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#102A43]">100% Original Products</h3>
              <p className="text-xs text-gray-500 font-medium">Genuine & Quality Assured</p>
            </div>
          </div>

          {/* Card 2: Fast Delivery */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#d2ebe0]/60 flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Truck size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#102A43]">Fast Delivery</h3>
              <p className="text-xs text-gray-500 font-medium">Quick & Safe Delivery</p>
            </div>
          </div>

          {/* Card 3: Easy Returns */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#d2ebe0]/60 flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <RotateCcw size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#102A43]">Easy Returns</h3>
              <p className="text-xs text-gray-500 font-medium">7 Days Return Policy</p>
            </div>
          </div>

          {/* Card 4: 24/7 Support */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-[#d2ebe0]/60 flex items-center gap-3.5 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
              <Headset size={28} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[#102A43]">24/7 Support</h3>
              <p className="text-xs text-gray-500 font-medium">We're Always Here</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DEALS OF THE DAY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-[#d2ebe0]/70 p-4 sm:p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[#FF6B00] font-extrabold text-base sm:text-lg">
                <Flame className="fill-[#FF6B00]" size={22} />
                <span>Deals of the Day</span>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1 bg-[#E8F5EE] border border-[#a3d9b8] text-[#17211B] px-2.5 py-1 rounded text-xs font-mono font-bold">
                <Clock size={13} className="text-[#2E8B57]" />
                <span>
                  {String(timeLeft.hours).padStart(2, '0')}:
                  {String(timeLeft.minutes).padStart(2, '0')}:
                  {String(timeLeft.seconds).padStart(2, '0')} Left
                </span>
              </div>
            </div>

            <Link
              to="/products?dealOfTheDay=true"
              className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              View All Deals <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {deals.map((prod) => (
              <ProductCard key={prod.id} product={prod} variant="compact" />
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS SHOWCASE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-[#d2ebe0]/70 p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-[#FF6B00]" size={20} />
              <h2 className="text-base sm:text-lg font-extrabold text-[#102A43]">
                Top Trending & Best Sellers
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {featuredProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. SMARTPHONES & WEARABLES SPOTLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl border border-[#d2ebe0]/70 p-4 sm:p-5 shadow-card">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Zap className="text-[#FF6B00]" size={20} />
              <h2 className="text-base sm:text-lg font-extrabold text-[#102A43]">
                Flagship Mobiles & Smart Gadgets
              </h2>
            </div>
            <Link
              to="/category/mobiles"
              className="text-xs sm:text-sm font-bold text-[#0066FF] hover:underline flex items-center gap-1"
            >
              Explore Mobiles <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {mobiles.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
