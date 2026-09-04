import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Package } from 'lucide-react';
import api from '../../lib/api';
import { Category, Product } from '../../types';
import { toast } from '../../store/toastStore';

export const AddEditProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [brandName, setBrandName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [imagesText, setImagesText] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [warrantyInfo, setWarrantyInfo] = useState('1 Year Manufacturer Warranty');
  const [returnPolicy, setReturnPolicy] = useState('7 Days Replacement Policy');
  const [deliveryInfo, setDeliveryInfo] = useState('Free Delivery Available');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await api.get('/categories');
        const cats = catRes.data.data || [];
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }

        if (isEditing && id) {
          const prodRes = await api.get(`/products/${id}`);
          const p: Product = prodRes.data.data;
          setTitle(p.title);
          setBrandName(p.brandName);
          setCategoryId(p.categoryId);
          setSubcategoryId(p.subcategoryId || '');
          setSku(p.sku);
          setMrp(String(p.mrp));
          setPrice(String(p.price));
          setStockQuantity(String(p.stockQuantity));
          setThumbnailUrl(p.thumbnailUrl);
          setImagesText(p.images.join('\n'));
          setShortDescription(p.shortDescription || '');
          setDescription(p.description);
          setWarrantyInfo(p.warrantyInfo || '');
          setReturnPolicy(p.returnPolicy || '');
          setDeliveryInfo(p.deliveryInfo || '');
        }
      } catch (err) {
        console.error('Failed to load data', err);
      }
    };
    init();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !mrp || !price || !thumbnailUrl || !description) {
      toast.error('Please fill in all required product fields.');
      return;
    }

    const numMrp = Number(mrp);
    const numPrice = Number(price);
    if (numPrice > numMrp) {
      toast.error('Selling price cannot exceed MRP.');
      return;
    }

    const images = imagesText
      .split('\n')
      .map((url) => url.trim())
      .filter(Boolean);
    if (thumbnailUrl && !images.includes(thumbnailUrl)) {
      images.unshift(thumbnailUrl);
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        brandName: brandName || 'Generic',
        categoryId,
        subcategoryId: subcategoryId || undefined,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        mrp: numMrp,
        price: numPrice,
        stockQuantity: Number(stockQuantity) || 10,
        thumbnailUrl,
        images,
        shortDescription,
        description,
        warrantyInfo,
        returnPolicy,
        deliveryInfo,
      };

      if (isEditing) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        toast.success('Product listed successfully!');
      }

      navigate('/seller/products');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/seller/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-novaorange-600 hover:underline">
          <ArrowLeft size={14} /> Back to Products Catalog
        </Link>
        <h1 className="text-lg font-bold text-gray-900">
          {isEditing ? 'Edit Product Listing' : 'List a New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-6 text-xs">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            1. GENERAL PRODUCT INFORMATION
          </h2>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">Product Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Sony WH-1000XM5 Wireless Noise Cancelling Headphones"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sony"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Subcategory</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium cursor-pointer"
              >
                <option value="">None / General</option>
                {selectedCategoryObj?.subcategories?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            2. PRICING & INVENTORY (INR)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">MRP (Max Retail Price) *</label>
              <input
                type="number"
                required
                placeholder="₹ 34990"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-bold"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Selling Price *</label>
              <input
                type="number"
                required
                placeholder="₹ 26990"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-bold text-novaorange-600"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Stock Quantity *</label>
              <input
                type="number"
                required
                placeholder="50"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-bold"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Product SKU</label>
              <input
                type="text"
                placeholder="e.g. SNY-WH1000XM5"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Media & Images */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            3. PRODUCT IMAGES (URLS)
          </h2>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">Primary Thumbnail Image URL *</label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/photo-..."
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
            />
          </div>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">
              Additional Image URLs (One URL per line)
            </label>
            <textarea
              rows={3}
              placeholder="https://images.unsplash.com/photo-1...&#10;https://images.unsplash.com/photo-2..."
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Section 4: Descriptions & Policies */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
            4. DESCRIPTION & SERVICE POLICIES
          </h2>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">Short Summary (1-2 sentences)</label>
            <input
              type="text"
              placeholder="Key selling points..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
            />
          </div>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">Full Detailed Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Detailed specifications, features, in-box contents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Warranty Info</label>
              <input
                type="text"
                value={warrantyInfo}
                onChange={(e) => setWarrantyInfo(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Return Policy</label>
              <input
                type="text"
                value={returnPolicy}
                onChange={(e) => setReturnPolicy(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Delivery Info</label>
              <input
                type="text"
                value={deliveryInfo}
                onChange={(e) => setDeliveryInfo(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-gray-200 flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold rounded text-xs shadow-sm transition-colors flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
          >
            <Save size={15} /> {isSaving ? 'Publishing...' : isEditing ? 'Update Listing' : 'Publish Product'}
          </button>
          <Link
            to="/seller/products"
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-xs transition-colors flex items-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};
