import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import type { ToastVariant } from '../../types';

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: typeof CheckCircle; iconClass: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   icon: CheckCircle,   iconClass: 'text-[#22C55E]' },
  error:   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   icon: AlertCircle,   iconClass: 'text-[#EF4444]' },
  warning: { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: AlertTriangle, iconClass: 'text-[#F59E0B]' },
  info:    { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  icon: Info,          iconClass: 'text-[#3B82F6]' },
};

export function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]"
    >
      {toasts.map(toast => {
        const cfg   = VARIANT_STYLES[toast.variant];
        const Icon  = cfg.icon;
        const isErr = toast.variant === 'error';

        return (
          <div
            key={toast.id}
            role={isErr ? 'alert' : 'status'}
            aria-live={isErr ? 'assertive' : 'polite'}
            className="animate-slide-down flex items-start gap-3 p-4 rounded-[8px] border"
            style={{ background: cfg.bg, borderColor: cfg.border, boxShadow: 'var(--shadow-lg)' }}
          >
            <Icon size={16} className={`${cfg.iconClass} flex-shrink-0 mt-0.5`} aria-hidden="true" />
            <p className="flex-1 font-sans text-[13px] leading-snug text-[rgba(248,250,252,0.9)]">
              {toast.message}
            </p>
            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-[rgba(248,250,252,0.5)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
              aria-label="Dismiss notification"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
