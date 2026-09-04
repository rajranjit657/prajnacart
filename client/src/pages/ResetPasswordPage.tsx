import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../store/toastStore';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing password reset token.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      toast.success(res.data.message || 'Password reset successful!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 shadow-card max-w-md w-full p-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-xs text-gray-500 mt-1">
            Choose a strong password with at least 6 characters.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-gray-700 font-semibold block mb-1">New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
              <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="text-gray-700 font-semibold block mb-1">Confirm New Password</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
              />
              <Lock size={15} className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold rounded text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Updating Password...' : 'Reset Password'} <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};
