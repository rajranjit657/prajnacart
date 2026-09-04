import React, { useState, useEffect } from 'react';
import { Store, CheckCircle2, XCircle, AlertTriangle, Search, ShieldCheck } from 'lucide-react';
import api from '../../lib/api';
import { toast } from '../../store/toastStore';

export const AdminSellersPage: React.FC = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSellers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/sellers');
      setSellers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load sellers', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateStatus = async (sellerId: string, status: string) => {
    setUpdatingId(sellerId);
    try {
      await api.patch(`/admin/sellers/${sellerId}/status`, { status });
      toast.success(`Seller status updated to '${status}'.`);
      fetchSellers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update seller.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = sellers.filter((s) =>
    s.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.businessEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Store size={20} className="text-purple-600" /> Seller Verification & Governance ({sellers.length})
          </h1>
          <p className="text-xs text-gray-500">Approve new vendor applications or manage platform seller accounts.</p>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs pl-8 pr-3 py-2 bg-gray-50 border border-gray-300 rounded focus:border-purple-600 outline-none w-48 sm:w-60"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-card">
          <p className="text-xs text-gray-500">No sellers found matching search.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-200">
                <tr>
                  <th className="p-3">Store Name</th>
                  <th className="p-3">Contact Email</th>
                  <th className="p-3">GSTIN / PAN</th>
                  <th className="p-3">Commission</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-bold text-gray-900">{s.storeName}</div>
                      <span className="text-[11px] text-gray-500">{s.businessPhone}</span>
                    </td>

                    <td className="p-3 text-gray-600 font-mono">{s.businessEmail}</td>

                    <td className="p-3">
                      <p className="font-mono font-semibold text-gray-800">GST: {s.gstin || 'N/A'}</p>
                      <p className="font-mono text-gray-500">PAN: {s.pan || 'N/A'}</p>
                    </td>

                    <td className="p-3 font-bold text-gray-900">{s.commissionRate}%</td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : s.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {s.status !== 'approved' && (
                          <button
                            disabled={updatingId === s.id}
                            onClick={() => handleUpdateStatus(s.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded text-[11px] disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {s.status !== 'rejected' && s.status === 'pending' && (
                          <button
                            disabled={updatingId === s.id}
                            onClick={() => handleUpdateStatus(s.id, 'rejected')}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded text-[11px] disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                        {s.status === 'approved' && (
                          <button
                            disabled={updatingId === s.id}
                            onClick={() => handleUpdateStatus(s.id, 'suspended')}
                            className="bg-gray-200 hover:bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded text-[11px] disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        )}
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
