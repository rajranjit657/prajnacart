import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Shield, Save, Package, Heart, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { toast } from '../store/toastStore';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const data = res.data.data;
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phone || '');
        setGender(data.gender || 'Male');
        setDateOfBirth(data.dateOfBirth || '');
      } catch (err) {
        console.error('Failed to load profile', err);
      }
    };
    fetchProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/auth/profile', {
        firstName,
        lastName,
        phone,
        gender,
        dateOfBirth,
      });
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <h1 className="text-xl font-extrabold text-gray-900">My Account</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar (4 cols) */}
        <div className="md:col-span-4 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-card flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-novaorange-500 text-white font-black text-lg flex items-center justify-center">
              {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Hello,</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-2 shadow-card space-y-1 text-sm">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-novaorange-600 bg-orange-50 font-bold"
            >
              <User size={18} /> Personal Information
            </Link>
            <Link
              to="/profile/orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              <Package size={18} /> My Orders
            </Link>
            <Link
              to="/profile/addresses"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              <MapPin size={18} /> Manage Addresses
            </Link>
            <Link
              to="/wishlist"
              className="flex items-center gap-3 px-3 py-2.5 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              <Heart size={18} /> My Wishlist
            </Link>
          </div>
        </div>

        {/* Profile Details Form (8 cols) */}
        <div className="md:col-span-8 bg-white rounded-lg border border-gray-200 p-6 shadow-card space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
            <p className="text-xs text-gray-500">Manage your basic profile details and preferences.</p>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-700 font-semibold block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full p-2.5 bg-gray-100 text-gray-500 border border-gray-300 rounded cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
              </div>

              <div>
                <label className="text-gray-700 font-semibold block mb-1">Gender</label>
                <div className="flex gap-4 pt-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === g}
                        onChange={() => setGender(g)}
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold rounded text-xs shadow-sm transition-colors disabled:opacity-50"
            >
              <Save size={14} /> {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
