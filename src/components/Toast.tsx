import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  action?: ToastAction;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.action ? 5500 : 2600;
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const icon =
    toast.type === 'success' ? (
      <CheckCircle2 className="w-4 h-4 text-[#198038] shrink-0 mt-0.5" />
    ) : toast.type === 'error' ? (
      <AlertCircle className="w-4 h-4 text-[#DA1E28] shrink-0 mt-0.5" />
    ) : toast.type === 'warning' ? (
      <AlertCircle className="w-4 h-4 text-[#B28600] shrink-0 mt-0.5" />
    ) : (
      <Info className="w-4 h-4 text-[#0043CE] shrink-0 mt-0.5" />
    );

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-[#CBD5E1] rounded shadow-lg p-3.5 flex items-start gap-3"
    >
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1E293B]">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick();
              onDismiss();
            }}
            className="mt-2 inline-flex items-center px-2.5 py-1 text-xs font-semibold text-[#0F62FE] bg-[#EFF5FF] hover:bg-[#DCE9FF] rounded transition-colors cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fechar notificação"
        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
