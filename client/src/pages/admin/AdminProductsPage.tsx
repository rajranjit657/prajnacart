import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Trash2, Search, Flame, Sparkles, Star } from 'lucide-react';
import api from '../../lib/api';
import { Product } from '../../types';
import { toast } from '../../store/toastStore';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.data.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleFeatured = async (p: Product) => {
    try {
      await api.put(`/products/${p.id}`, { isFeatured: !p.isFeatured });
      toast.success('Featured status updated!');
      fetchProducts();
    } catch {
      toast.error('Failed to update.');
    }
  };

  const handleToggleDeal = async (p: Product) => {
    try {
      await api.put(`/products/${p.id}`, { isDealOfTheDay: !p.isDealOfTheDay });
      toast.success('Deal of the day updated!');
      fetchProducts();
    } catch {
      toast.error('Failed to update.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product from the platform?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.info('Product removed.');
      fetchProducts();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brandName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-purple-600" /> Platform Product Catalog Moderation ({products.length})
          </h1>
          <p className="text-xs text-gray-500">Feature products on the homepage or moderate listings.</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-purple-600 outline-none w-48 sm:w-60"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3">Seller</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">Spotlight</th>
                <th className="p-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <img src={prod.thumbnailUrl} alt={prod.title} className="w-9 h-9 object-contain rounded bg-white p-0.5" />
                      <div className="max-w-xs truncate font-semibold text-gray-900">
                        {prod.title}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{prod.categoryName}</td>
                  <td className="p-3 font-semibold text-gray-800">{prod.sellerStoreName || 'Apex Retail'}</td>
                  <td className="p-3 font-bold text-gray-900">₹{prod.price.toLocaleString('en-IN')}</td>
                  <td className="p-3 font-semibold">{prod.stockQuantity} units</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeatured(prod)}
                        className={`p-1 rounded text-[10px] font-bold ${
                          prod.isFeatured ? 'bg-novaorange-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                        title="Toggle Featured"
                      >
                        <Sparkles size={13} />
                      </button>
                      <button
                        onClick={() => handleToggleDeal(prod)}
                        className={`p-1 rounded text-[10px] font-bold ${
                          prod.isDealOfTheDay ? 'bg-novaorange-500 text-white' : 'bg-gray-100 text-gray-500'
                        }`}
                        title="Toggle Deal of the Day"
                      >
                        <Flame size={13} />
                      </button>
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
