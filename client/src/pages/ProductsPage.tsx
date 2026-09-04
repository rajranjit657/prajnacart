import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Filter, ChevronDown, Star, X, SlidersHorizontal, 
  ArrowUpDown, Grid, List, Check, RotateCcw 
} from 'lucide-react';
import api from '../lib/api';
import { Product, Category } from '../types';
import { ProductCard } from '../components/common/ProductCard';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Active Filter state derived from searchParams
  const q = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || '';
  const selectedSubcategory = searchParams.get('subcategory') || '';
  const selectedBrand = searchParams.get('brand') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';
  const minDiscount = searchParams.get('minDiscount') || '';
  const sortBy = searchParams.get('sort') || 'popularity';
  const page = Number(searchParams.get('page')) || 1;

  // Local draft filter state for slider
  const [priceRange, setPriceRange] = useState<number>(Number(maxPrice) || 200000);

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

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        const res = await api.get(`/products?${params.toString()}`);
        const data = res.data.data;
        setProducts(data.products || []);
        setPagination(data.pagination);
        setAvailableBrands(data.facets?.brands || []);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset page to 1 when changing filters
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    if (q) newParams.set('q', q);
    setSearchParams(newParams);
    setPriceRange(200000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Search Query Header */}
      {q && (
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
            Showing results for <span className="text-novaorange-600">"{q}"</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {pagination.totalItems} matching products found
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Filters Sidebar (3 cols desktop, Drawer mobile) */}
        <aside
          className={`lg:col-span-3 bg-white rounded-lg border border-gray-200 p-4 sm:p-5 shadow-card space-y-6 lg:block ${
            isMobileFilterOpen
              ? 'fixed inset-0 z-50 overflow-y-auto m-0 rounded-none'
              : 'hidden'
          }`}
        >
          {/* Filter Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-novaorange-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
                Filters
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-novaorange-600 hover:underline"
              >
                Clear All
              </button>
              {isMobileFilterOpen && (
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="lg:hidden p-1 text-gray-500"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* 1. Category Filter */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Category
            </h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={!selectedCategory}
                  onChange={() => updateParam('category', null)}
                  className="text-novaorange-500 focus:ring-novaorange-500"
                />
                <span className="text-gray-700">All Categories</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.id || selectedCategory === cat.slug}
                    onChange={() => updateParam('category', cat.id)}
                    className="text-novaorange-500 focus:ring-novaorange-500"
                  />
                  <span className="text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Price Range Slider */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center text-xs">
              <h3 className="font-bold text-gray-700 uppercase tracking-wider">Price</h3>
              <span className="font-bold text-novaorange-600">
                Up to ₹{priceRange.toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="200000"
              step="1000"
              value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              onMouseUp={() => updateParam('maxPrice', String(priceRange))}
              onTouchEnd={() => updateParam('maxPrice', String(priceRange))}
              className="w-full accent-novaorange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>₹500</span>
              <span>₹2,00,000+</span>
            </div>
          </div>

          {/* 3. Brands */}
          {availableBrands.length > 0 && (
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Brand
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={!selectedBrand}
                    onChange={() => updateParam('brand', null)}
                    className="text-novaorange-500"
                  />
                  <span className="text-gray-700">All Brands</span>
                </label>
                {availableBrands.map((b) => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === b}
                      onChange={() => updateParam('brand', b)}
                      className="text-novaorange-500"
                    />
                    <span className="text-gray-700">{b}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 4. Customer Rating */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Customer Ratings
            </h3>
            <div className="space-y-1.5 text-xs">
              {[4, 3, 2].map((stars) => (
                <label key={stars} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === String(stars)}
                    onChange={() => updateParam('minRating', String(stars))}
                    className="text-novaorange-500"
                  />
                  <div className="flex items-center gap-1 text-gray-700">
                    <span>{stars}★ & above</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 5. Discount */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Discount
            </h3>
            <div className="space-y-1.5 text-xs">
              {['10', '20', '30', '40', '50'].map((disc) => (
                <label key={disc} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="discount"
                    checked={minDiscount === disc}
                    onChange={() => updateParam('minDiscount', disc)}
                    className="text-novaorange-500"
                  />
                  <span className="text-gray-700">{disc}% or more</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Main Content (9 cols) */}
        <main className="lg:col-span-9 space-y-4">
          {/* Top Sort & Filter Trigger Bar */}
          <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-card flex flex-wrap items-center justify-between gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-bold text-gray-800 bg-gray-100 px-3 py-1.5 rounded"
            >
              <Filter size={14} /> Filters
            </button>

            {/* Sort Options */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs">
              <span className="font-bold text-gray-400 uppercase tracking-wider shrink-0">
                Sort By:
              </span>
              {[
                { id: 'popularity', label: 'Popularity' },
                { id: 'price_asc', label: 'Price -- Low to High' },
                { id: 'price_desc', label: 'Price -- High to Low' },
                { id: 'newest', label: 'Newest First' },
                { id: 'rating', label: 'Customer Rating' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => updateParam('sort', s.id)}
                  className={`px-2.5 py-1 rounded transition-colors shrink-0 font-medium ${
                    sortBy === s.id
                      ? 'bg-novaorange-500 text-white font-bold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-card space-y-3">
              <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <Filter size={28} />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Products Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                We couldn't find any products matching your selected filters. Try clearing some filters.
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-novaorange-500 text-white text-xs font-bold rounded shadow-sm hover:bg-novaorange-600 transition-colors"
              >
                <RotateCcw size={13} /> Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Page <strong className="text-gray-900">{pagination.currentPage}</strong> of{' '}
                <strong className="text-gray-900">{pagination.totalPages}</strong>
              </span>

              <div className="flex gap-2">
                <button
                  disabled={pagination.currentPage <= 1}
                  onClick={() => updateParam('page', String(pagination.currentPage - 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => updateParam('page', String(pagination.currentPage + 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
