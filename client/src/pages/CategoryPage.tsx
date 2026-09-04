import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layers, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import { Category, Product } from '../types';
import { ProductCard } from '../components/common/ProductCard';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const catRes = await api.get(`/categories/${slug}`);
        const catData = catRes.data.data;
        setCategory(catData);

        const prodRes = await api.get(`/products?category=${catData.id}&limit=12`);
        setProducts(prodRes.data.data.products || []);
      } catch (err) {
        console.error('Failed to load category data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Category Not Found</h2>
        <Link to="/" className="text-novaorange-600 font-bold hover:underline">
          Return to Homepage
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Category Hero Banner */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-card relative">
        <div className="h-44 sm:h-56 w-full relative">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center px-6 sm:px-10">
            <div className="text-white space-y-1.5 max-w-md">
              <span className="text-xs uppercase font-extrabold tracking-wider text-novayellow-500">
                MARKETPLACE DEPARTMENT
              </span>
              <h1 className="text-2xl sm:text-3xl font-black">{category.name}</h1>
              <p className="text-xs sm:text-sm text-gray-200 line-clamp-2">
                {category.description}
              </p>
            </div>
          </div>
        </div>

        {/* Subcategories Pills Navigation */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="font-bold text-gray-500 uppercase text-[11px] shrink-0">Subcategories:</span>
            {category.subcategories.map((sub: any) => (
              <Link
                key={sub.id}
                to={`/products?category=${category.id}&subcategory=${sub.id}`}
                className="px-3 py-1 bg-white border border-gray-300 rounded-full font-semibold text-gray-700 hover:border-novaorange-500 hover:text-novaorange-600 transition-colors shrink-0 shadow-xs"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
            Popular in {category.name} ({products.length})
          </h2>
          <Link
            to={`/products?category=${category.id}`}
            className="text-xs font-bold text-novaorange-600 hover:underline"
          >
            View All in {category.name} →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </div>
  );
};
