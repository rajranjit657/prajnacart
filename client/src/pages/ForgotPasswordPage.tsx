import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { toast } from '../store/toastStore';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      if (res.data.demoResetToken) {
        setDemoToken(res.data.demoResetToken);
      }
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to request password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-lg border border-gray-200 shadow-card max-w-md w-full p-8 space-y-6">
        <div>
          <Link to="/login" className="inline-flex items-center gap-1 text-xs text-novaorange-600 font-semibold hover:underline mb-4">
            <ArrowLeft size={13} /> Back to Sign In
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Forgot Your Password?</h1>
          <p className="text-xs text-gray-500 mt-1">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        {isSubmitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 text-center space-y-3">
            <CheckCircle2 size={36} className="text-novagreen-500 mx-auto" />
            <p className="text-xs font-bold text-emerald-900">Password Reset Link Dispatched!</p>
            <p className="text-xs text-emerald-700">
              Check your inbox for further instructions.
            </p>
            {demoToken && (
              <div className="pt-2 border-t border-emerald-200">
                <p className="text-[11px] text-gray-500 mb-2">⚡ Demo Direct Reset Link:</p>
                <Link
                  to={`/reset-password?token=${demoToken}`}
                  className="inline-block bg-novaorange-500 text-white text-xs font-bold px-4 py-1.5 rounded hover:bg-novaorange-600"
                >
                  Proceed to Reset Password
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-gray-700 font-semibold block mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-300 rounded outline-none focus:border-novaorange-500 font-medium"
                />
                <Mail size={15} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-novaorange-500 hover:bg-novaorange-600 text-white font-bold rounded text-xs shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Sending Link...' : 'Send Password Reset Link'} <ArrowRight size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
