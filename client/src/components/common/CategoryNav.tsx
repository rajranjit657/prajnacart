import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { Category } from '../../types';

// Curated high quality circular imagery matching reference screenshot
const CATEGORY_CUSTOM_IMAGES: Record<string, string> = {
  'mobiles': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=80',
  'electronics': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&auto=format&fit=crop&q=80',
  'men-fashion': 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=200&auto=format&fit=crop&q=80',
  'women-fashion': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=200&auto=format&fit=crop&q=80',
  'home-kitchen': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=200&auto=format&fit=crop&q=80',
  'appliances': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=200&auto=format&fit=crop&q=80',
  'beauty': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200&auto=format&fit=crop&q=80',
  'grocery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&auto=format&fit=crop&q=80',
  'sports': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=80',
};

export const CategoryNav: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-[#E8F5EE] border-b border-[#d2ebe0] shadow-xs relative z-30 py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Horizontal scroll navigation */}
        <div
          ref={scrollContainerRef}
          className="flex items-center justify-between overflow-x-auto no-scrollbar gap-5 sm:gap-7 scroll-smooth py-1"
        >
          {categories.map((cat) => {
            const imgUrl = CATEGORY_CUSTOM_IMAGES[cat.slug] || cat.imageUrl;
            const hasSubcategories = cat.subcategories && cat.subcategories.length > 0;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setActiveDropdown(cat.id)}
                onMouseLeave={() => setActiveDropdown(null)}
                className="relative group shrink-0 flex flex-col items-center cursor-pointer"
              >
                <Link
                  to={`/category/${cat.slug}`}
                  className="flex flex-col items-center text-center group"
                >
                  {/* Clean 88px Circular Image Container with Subtle Shadow */}
                  <div className="w-[78px] h-[78px] sm:w-[88px] sm:h-[88px] rounded-full overflow-hidden bg-white p-1 shadow-sm border border-white group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>

                  {/* Category Name with Down Chevron */}
                  <div className="flex items-center gap-1 mt-2.5">
                    <span className="text-xs sm:text-[13px] font-bold text-[#102A43] group-hover:text-[#0066FF] tracking-tight whitespace-nowrap transition-colors">
                      {cat.name}
                    </span>
                    <ChevronDown
                      size={13}
                      className="text-[#102A43] group-hover:text-[#0066FF] transition-transform duration-200 group-hover:rotate-180"
                    />
                  </div>
                </Link>

                {/* Subcategories Dropdown */}
                {activeDropdown === cat.id && hasSubcategories && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-52 bg-white rounded-lg shadow-floating py-2 border border-gray-100 z-50 animate-fade-in">
                    <div className="px-3.5 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      Popular in {cat.name}
                    </div>
                    {cat.subcategories!.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/products?category=${cat.id}&subcategory=${sub.id}`}
                        className="block px-3.5 py-2 text-xs font-semibold text-[#102A43] hover:bg-[#E8F5EE] hover:text-[#0066FF] transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Circular Right Navigation Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-[#102A43] hover:bg-gray-50 hover:text-[#0066FF] hover:scale-105 transition-all z-20"
          title="Scroll Right"
        >
          <ChevronRight size={18} />
        </button>

        {/* Circular Left Navigation Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 items-center justify-center text-[#102A43] hover:bg-gray-50 hover:text-[#0066FF] hover:scale-105 transition-all z-20 opacity-0 hover:opacity-100 transition-opacity"
          title="Scroll Left"
        >
          <ChevronLeft size={18} />
        </button>
      </div>
    </nav>
  );
};
