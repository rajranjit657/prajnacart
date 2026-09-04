import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Edit2 } from 'lucide-react';
import api from '../../lib/api';
import { Category } from '../../types';
import { toast } from '../../store/toastStore';

export const AdminCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [iconName, setIconName] = useState('ShoppingBag');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setIsSaving(true);
    try {
      await api.post('/categories', {
        name,
        description,
        imageUrl,
        iconName,
      });
      toast.success('Category added successfully!');
      setShowAddForm(false);
      setName('');
      setDescription('');
      setImageUrl('');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add category.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.info('Category deleted.');
      fetchCategories();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Layers size={20} className="text-purple-600" /> Category Hierarchy Manager ({categories.length})
          </h1>
          <p className="text-xs text-gray-500">Configure marketplace departments and subcategories.</p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded shadow-sm transition-colors shrink-0"
          >
            <Plus size={15} /> Add Category
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateCategory} className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4 text-xs animate-fade-in">
          <h3 className="font-bold text-sm text-gray-900 uppercase">Create New Marketplace Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Category Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Gaming & VR"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Image URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-700 font-semibold block mb-1">Description</label>
              <input
                type="text"
                placeholder="Short description for SEO and category page..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded"
            >
              {isSaving ? 'Saving...' : 'Save Category'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 bg-gray-200 text-gray-700 font-semibold rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 p-0.5 shrink-0">
                <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-gray-900">{cat.name}</p>
                <p className="text-gray-500 font-mono text-[11px]">/{cat.slug}</p>
                <span className="text-purple-600 font-semibold text-[10px]">
                  {cat.subcategories?.length || 0} Subcategories
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDeleteCategory(cat.id)}
              className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
              title="Delete Category"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
