import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let bg = 'bg-gray-900 text-white';
        let icon = <Info size={18} className="text-novaorange-400 shrink-0" />;

        if (t.type === 'success') {
          bg = 'bg-emerald-900 text-white border border-emerald-700';
          icon = <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;
        } else if (t.type === 'error') {
          bg = 'bg-rose-950 text-white border border-rose-800';
          icon = <AlertCircle size={18} className="text-rose-400 shrink-0" />;
        } else if (t.type === 'warning') {
          bg = 'bg-amber-950 text-white border border-amber-800';
          icon = <AlertTriangle size={18} className="text-amber-400 shrink-0" />;
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg shadow-floating text-xs font-medium ${bg} animate-slide-up transition-all`}
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
