import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Home, Briefcase } from 'lucide-react';
import api from '../lib/api';
import { Address } from '../types';
import { toast } from '../store/toastStore';

export const AddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [postalCode, setPostalCode] = useState('560038');
  const [addressType, setAddressType] = useState<'home' | 'work'>('home');
  const [isSaving, setIsSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data || []);
    } catch (err) {
      console.error('Failed to load addresses', err);
    }
  };

  useEffect(() => {
    fetchAddresses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          addressType,
        });
        toast.success('Address updated successfully!');
      } else {
        await api.post('/addresses', {
          fullName,
          phone,
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          addressType,
          isDefault: addresses.length === 0,
        });
        toast.success('Address added successfully!');
      }

      setShowAddForm(false);
      setEditingId(null);
      resetForm();
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (addr: Address) => {
    setEditingId(addr.id);
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setAddressType(addr.addressType);
    setShowAddForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.info('Address removed.');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success('Default address updated!');
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update default address.');
    }
  };

  const resetForm = () => {
    setFullName('');
    setPhone('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('Bengaluru');
    setState('Karnataka');
    setPostalCode('560038');
    setAddressType('home');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
          <MapPin className="text-novaorange-500" size={22} /> Manage Addresses ({addresses.length})
        </h1>

        {!showAddForm && (
          <button
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold rounded text-xs shadow-sm transition-colors"
          >
            <Plus size={15} /> Add New Address
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSaveAddress} className="bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-4 text-xs animate-fade-in">
          <h3 className="font-bold text-sm text-gray-900 uppercase">
            {editingId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">10-Digit Phone *</label>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-gray-700 font-semibold block mb-1">Flat, House no., Building, Street *</label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">City / District *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">State *</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">PIN Code *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
            </div>

            <div>
              <label className="text-gray-700 font-semibold block mb-1">Address Type</label>
              <div className="flex gap-4 pt-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="addressType"
                    checked={addressType === 'home'}
                    onChange={() => setAddressType('home')}
                  />
                  <span>Home</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="addressType"
                    checked={addressType === 'work'}
                    onChange={() => setAddressType('work')}
                  />
                  <span>Work</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-novaorange-500 text-white font-bold rounded hover:bg-novaorange-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Address'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingId(null);
              }}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 font-semibold rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Address Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`bg-white rounded-lg border p-5 shadow-card relative flex flex-col justify-between ${
              addr.isDefault ? 'border-novaorange-500 ring-1 ring-novaorange-500' : 'border-gray-200'
            }`}
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">{addr.fullName}</span>
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                    {addr.addressType}
                  </span>
                </div>
                {addr.isDefault && (
                  <span className="text-[11px] font-bold text-novagreen-600 bg-novagreen-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 size={12} /> Default
                  </span>
                )}
              </div>

              <p className="text-gray-700 leading-relaxed">
                {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                {addr.city}, {addr.state} — <strong className="text-gray-900">{addr.postalCode}</strong>
              </p>
              <p className="text-gray-600 font-semibold">Phone: {addr.phone}</p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-xs">
              {!addr.isDefault ? (
                <button
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-novaorange-600 font-bold hover:underline"
                >
                  Set as Default
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditClick(addr)}
                  className="text-gray-600 hover:text-novaorange-600 font-semibold flex items-center gap-1"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(addr.id)}
                  className="text-rose-500 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
