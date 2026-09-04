import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Edit2, Trash2, Eye, EyeOff, Search, Star } from 'lucide-react';
import api from '../../lib/api';
import { Product } from '../../types';
import { toast } from '../../store/toastStore';

export const SellerProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/seller/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to load seller products', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.info('Product removed successfully.');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.put(`/products/${product.id}`, {
        isActive: !product.isActive,
      });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}.`);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-novaorange-500" /> My Product Catalog ({products.length})
          </h1>
          <p className="text-xs text-gray-500">Manage your listings, stock counts, and prices.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-novaorange-500 outline-none w-48 sm:w-60"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <Link
            to="/seller/products/new"
            className="inline-flex items-center gap-1.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold text-xs px-4 py-2 rounded shadow-sm transition-colors shrink-0"
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-card">
          <Package size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-bold text-gray-900 mb-1">No products found</h3>
          <p className="text-xs text-gray-500 mb-4">Start by adding your first product to the catalog.</p>
          <Link
            to="/seller/products/new"
            className="bg-novaorange-500 text-white font-bold px-6 py-2 rounded text-xs"
          >
            + Create First Listing
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price / MRP</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.thumbnailUrl}
                          alt={prod.title}
                          className="w-10 h-10 object-contain rounded bg-white border border-gray-200 p-0.5 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <Link
                            to={`/products/${prod.slug}`}
                            className="font-bold text-gray-900 hover:text-novaorange-600 truncate block"
                          >
                            {prod.title}
                          </Link>
                          <span className="text-[11px] text-gray-400">{prod.brandName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-gray-600">{prod.sku}</td>
                    <td className="p-3 text-gray-700 font-medium">{prod.categoryName}</td>

                    <td className="p-3">
                      <div className="font-bold text-gray-900">₹{prod.price.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-gray-400 line-through">₹{prod.mrp.toLocaleString('en-IN')}</div>
                    </td>

                    <td className="p-3">
                      <span className={`font-bold ${prod.stockQuantity <= 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                        {prod.stockQuantity} units
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center gap-0.5 bg-novagreen-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                        {prod.rating > 0 ? prod.rating.toFixed(1) : '4.5'} <Star size={9} className="fill-white" />
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => handleToggleActive(prod)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          prod.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {prod.isActive ? 'Active' : 'Draft'}
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/seller/products/edit/${prod.id}`}
                          className="p-1.5 text-gray-500 hover:text-novaorange-600 rounded"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-gray-500 hover:text-rose-600 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
