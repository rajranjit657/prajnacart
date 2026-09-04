import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import { Banner } from '../../types';
import { toast } from '../../store/toastStore';

export const AdminBannersPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ctaText, setCtaText] = useState('Shop Now');
  const [ctaLink, setCtaLink] = useState('/products');
  const [badgeText, setBadgeText] = useState('SPECIAL DEAL');
  const [isSaving, setIsSaving] = useState(false);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/categories/banners');
      setBanners(res.data.data || []);
    } catch (err) {
      console.error('Failed to load banners', err);
    }
  };

  useEffect(() => {
    fetchBanners();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl) return;
    setIsSaving(true);
    try {
      await api.post('/admin/banners', {
        title,
        subtitle,
        imageUrl,
        ctaText,
        ctaLink,
        badgeText,
      });
      toast.success('Banner slide published successfully!');
      setShowAddForm(false);
      setTitle('');
      setSubtitle('');
      setImageUrl('');
      fetchBanners();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add banner.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete this banner from homepage?')) return;
    try {
      await api.delete(`/admin/banners/${id}`);
      toast.info('Banner removed.');
      fetchBanners();
    } catch (err: any) {
      toast.error('Failed to delete banner.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon size={20} className="text-purple-600" /> Homepage Hero Carousel Manager ({banners.length})
          </h1>
          <p className="text-xs text-gray-500">Configure promotional slides, links and marketing badges.</p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded shadow-sm transition-colors shrink-0"
          >
            <Plus size={15} /> Add Hero Slide
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateBanner} className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4 text-xs animate-fade-in">
          <h3 className="font-bold text-sm text-gray-900 uppercase">Create New Hero Slide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Banner Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Mega Summer Electronics Fest"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Badge Tag</label>
              <input
                type="text"
                placeholder="e.g. 50% OFF"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-700 font-semibold block mb-1">Image URL *</label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">CTA Button Text</label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">CTA Redirect Link</label>
              <input
                type="text"
                value={ctaLink}
                onChange={(e) => setCtaLink(e.target.value)}
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
              {isSaving ? 'Publishing...' : 'Publish Banner'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden flex flex-col justify-between">
            <div className="relative h-40 bg-gray-100">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              {banner.badgeText && (
                <span className="absolute top-2 left-2 bg-novayellow-500 text-novadark-900 font-extrabold text-[10px] px-2 py-0.5 rounded">
                  {banner.badgeText}
                </span>
              )}
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-gray-900">{banner.title}</p>
                <p className="text-gray-500">Link: {banner.ctaLink}</p>
              </div>
              <button
                onClick={() => handleDeleteBanner(banner.id)}
                className="p-1.5 text-gray-400 hover:text-rose-600 rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
