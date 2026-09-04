import React, { useState } from 'react';
import { MapPin, CheckCircle2, Truck, RefreshCw } from 'lucide-react';

export const PinCodeChecker: React.FC = () => {
  const [pinCode, setPinCode] = useState('560038'); // Default to Bangalore Indiranagar
  const [checked, setChecked] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length === 6) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setChecked(true);
      }, 300);
    }
  };

  const getEstimatedDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 my-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={16} className="text-novaorange-500" />
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Delivery Options & PIN Code
        </span>
      </div>

      <form onSubmit={handleCheck} className="flex gap-2 mb-2">
        <input
          type="text"
          maxLength={6}
          placeholder="Enter 6-digit PIN code"
          value={pinCode}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '');
            setPinCode(val);
            if (val.length < 6) setChecked(false);
          }}
          className="bg-white border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-900 w-44 focus:outline-none focus:border-novaorange-500"
        />
        <button
          type="submit"
          disabled={pinCode.length !== 6 || loading}
          className="text-xs font-bold text-novaorange-600 hover:text-novaorange-700 px-3 py-1.5 bg-white border border-novaorange-400 hover:border-novaorange-600 rounded disabled:opacity-50 transition-colors"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
      </form>

      {checked && pinCode.length === 6 && (
        <div className="space-y-1.5 text-xs text-gray-700 mt-2 animate-fade-in">
          <div className="flex items-center gap-2 text-novagreen-600 font-bold">
            <CheckCircle2 size={14} />
            <span>Delivery by {getEstimatedDate()} | Free Express Delivery</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Truck size={14} className="text-gray-400" />
            <span>Cash on Delivery available for this location</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <RefreshCw size={14} className="text-gray-400" />
            <span>7 Days Replacement Policy & 1 Year Manufacturer Warranty</span>
          </div>
        </div>
      )}
    </div>
  );
};
