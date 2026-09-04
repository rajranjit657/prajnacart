import React, { useState, useEffect } from 'react';
import { Settings, Store, Building, CreditCard, Save } from 'lucide-react';
import api from '../../lib/api';
import { toast } from '../../store/toastStore';

export const SellerSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/seller/dashboard');
        const seller = res.data.data.seller;
        if (seller) {
          setStoreName(seller.storeName || '');
          setBusinessPhone(seller.businessPhone || '');
          setGstin(seller.gstin || '');
          setPan(seller.pan || '');
          setBankAccountName(seller.bankAccountName || '');
          setBankAccountNumber(seller.bankAccountNumber || '');
          setBankIfsc(seller.bankIfsc || '');
          setBankName(seller.bankName || '');
          setDescription(seller.description || '');
        }
      } catch (err) {
        console.error('Failed to load store settings', err);
      }
    };
    fetchSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put('/seller/settings', {
        storeName,
        businessPhone,
        gstin,
        pan,
        bankAccountName,
        bankAccountNumber,
        bankIfsc,
        bankName,
        description,
      });
      toast.success('Store settings saved successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update store settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card">
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Settings size={20} className="text-novaorange-500" /> Store Settings & Payout Configuration
        </h1>
        <p className="text-xs text-gray-500">Manage your business information, GST details, and bank account for weekly payouts.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-6 text-xs">
        {/* Store Information */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Store size={14} className="text-novaorange-500" /> STORE PROFILE
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Store Display Name</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Support Contact Phone</label>
              <input
                type="tel"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-700 font-semibold block mb-1">Store Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500"
              />
            </div>
          </div>
        </div>

        {/* Tax & Legal */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <Building size={14} className="text-novaorange-500" /> TAX & REGULATORY DETAILS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">PAN Card Number</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono font-medium"
              />
            </div>
          </div>
        </div>

        {/* Bank Account for Payouts */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <CreditCard size={14} className="text-novaorange-500" /> BANK ACCOUNT FOR WEEKLY PAYOUTS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Beneficiary Account Name</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Bank Account Number</label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-mono font-medium"
              />
            </div>
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-8 py-3 bg-novaorange-500 hover:bg-novaorange-600 text-white font-extrabold rounded text-xs shadow-sm transition-colors flex items-center gap-2 uppercase tracking-wide disabled:opacity-50"
        >
          <Save size={15} /> {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};
