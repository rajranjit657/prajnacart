import React, { useState, useEffect } from 'react';
import { Ticket, Plus, Trash2, Tag, Check } from 'lucide-react';
import api from '../../lib/api';
import { Coupon } from '../../types';
import { toast } from '../../store/toastStore';

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('flat');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('499');
  const [maxDiscountValue, setMaxDiscountValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.data || []);
    } catch (err) {
      console.error('Failed to load coupons', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    setIsSaving(true);
    try {
      await api.post('/coupons', {
        code,
        description,
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscountValue: maxDiscountValue ? Number(maxDiscountValue) : undefined,
      });
      toast.success('Coupon code created successfully!');
      setShowAddForm(false);
      setCode('');
      setDescription('');
      setDiscountValue('');
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.info('Coupon deleted.');
      fetchCoupons();
    } catch (err: any) {
      toast.error('Failed to delete coupon.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Ticket size={20} className="text-purple-600" /> Promotional Coupon Engine ({coupons.length})
          </h1>
          <p className="text-xs text-gray-500">Configure marketplace promo codes, flat discounts and percentage offers.</p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded shadow-sm transition-colors shrink-0"
          >
            <Plus size={15} /> Create Coupon
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateCoupon} className="bg-white rounded-lg border border-gray-200 p-5 shadow-card space-y-4 text-xs animate-fade-in">
          <h3 className="font-bold text-sm text-gray-900 uppercase">Create New Promo Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. FESTIVE50"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-medium"
              >
                <option value="flat">Flat Discount (INR)</option>
                <option value="percentage">Percentage Discount (%)</option>
              </select>
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">
                Discount Value ({discountType === 'flat' ? '₹' : '%'}) *
              </label>
              <input
                type="number"
                required
                placeholder="100"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600 font-bold"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Min Order Value (₹)</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Max Cap Discount (₹ optional)</label>
              <input
                type="number"
                placeholder="1500"
                value={maxDiscountValue}
                onChange={(e) => setMaxDiscountValue(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-gray-700 font-semibold block mb-1">Description / Terms</label>
              <input
                type="text"
                placeholder="Get flat ₹100 off on all orders above ₹499"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-purple-600"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded"
            >
              {isSaving ? 'Creating...' : 'Create Coupon'}
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
        {coupons.map((c) => (
          <div key={c.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex flex-col justify-between space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <span className="font-mono font-black text-sm bg-purple-50 text-purple-700 px-2.5 py-1 rounded border border-purple-200 inline-block">
                  {c.code}
                </span>
                <p className="text-xs text-gray-600 mt-1">{c.description}</p>
              </div>
              <button
                onClick={() => handleDeleteCoupon(c.id)}
                className="p-1 text-gray-400 hover:text-rose-600 rounded"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between">
              <span>
                Discount: <strong>{c.discountValue}{c.discountType === 'flat' ? ' INR' : '%'}</strong>
              </span>
              <span>Min Order: ₹{c.minOrderValue}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
