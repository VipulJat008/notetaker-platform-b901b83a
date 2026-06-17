import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileText, Activity, AlertTriangle, TrendingUp, Info, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Badge, statusVariant } from '../components/ui/Badge';
import { SkeletonCard, SkeletonTableRows } from '../components/ui/SkeletonLoader';

/* ─── Mock data ────────────────────────────────────────── */
const MOCK_NOTES = [
  { id: '1', orderId: 'ORD-042', timestamp: '2026-05-22 09:45', summary: 'Customer enquired about delivery status and requested expedited shipping.', status: 'Processed' as const },
  { id: '2', orderId: 'ORD-043', timestamp: '2026-05-22 09:30', summary: 'Billing discrepancy reported; refund of $124 initiated pending approval.', status: 'Pending' as const },
  { id: '3', orderId: 'ORD-044', timestamp: '2026-05-22 09:15', summary: 'Product return request for damaged item; replacement dispatched.', status: 'Processed' as const },
  { id: '4', orderId: 'ORD-045', timestamp: '2026-05-22 08:55', summary: 'Technical issue with online account; password reset email triggered.', status: 'Failed' as const },
  { id: '5', orderId: 'ORD-046', timestamp: '2026-05-22 08:40', summary: 'Subscription upgrade requested; transition scheduled for next billing cycle.', status: 'Processed' as const },
];

const WIDGETS = [
  { label: 'Total Call Notes', value: '12,847', icon: FileText,      accent: '#22C55E' },
  { label: 'Active Jobs',      value: '3',       icon: Activity,      accent: '#3B82F6' },
  { label: 'Open Alerts',      value: '2',       icon: AlertTriangle, accent: '#F59E0B' },
  { label: 'Job Success Rate', value: '98.4%',   icon: TrendingUp,    accent: '#22C55E' },
];

/* ─── Presentational ───────────────────────────────────── */
interface AgentDashboardViewProps {
  isLoading: boolean;
  showBanner: boolean;
  onDismissBanner: () => void;
  onViewNote: (id: string) => void;
}

function AgentDashboardView({ isLoading, showBanner, onDismissBanner, onViewNote }: AgentDashboardViewProps) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Dashboard</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">{today}</p>
        </div>
        <div
          role="status"
          aria-label="View-only access mode active"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(59,130,246,0.25)] cursor-default"
          style={{ background: 'rgba(59,130,246,0.12)' }}
          title="Your account has view-only access. Contact an administrator to request changes."
          aria-live="polite"
        >
          <Eye size={14} className="text-[#3B82F6]" aria-hidden="true" />
          <span className="font-sans text-[12px] font-medium text-[#3B82F6] hidden sm:block">Read-Only Access</span>
        </div>
      </div>

      {/* Read-Only Notice Banner */}
      {showBanner && (
        <div
          role="region"
          aria-label="Access level notice"
          className="flex items-start gap-3 p-4 rounded-[8px] border border-[rgba(59,130,246,0.2)] mb-6 animate-fade-in"
          style={{ background: 'rgba(59,130,246,0.08)' }}
        >
          <Info size={16} className="text-[#3B82F6] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1 font-sans text-[13px] text-[rgba(248,250,252,0.75)]">
            You have read-only access. To request changes or uploads, contact your administrator.
          </p>
          <button
            onClick={onDismissBanner}
            className="text-[rgba(248,250,252,0.5)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
            aria-label="Dismiss read-only notice"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Summary Widgets — Read-Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {WIDGETS.map(w => {
          const Icon = w.icon;
          if (isLoading) return <SkeletonCard key={w.label} />;
          return (
            <article
              key={w.label}
              role="article"
              aria-label={`${w.label}: ${w.value}`}
              className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)] cursor-default transition-shadow duration-[200ms] hover:shadow-sm"
              style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-sm)' }}
              title="View only — click disabled for your access level"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ background: `${w.accent}22` }}>
                  <Icon size={20} style={{ color: w.accent }} aria-hidden="true" />
                </div>
              </div>
              <p className="font-code text-[32px] font-bold text-[#F8FAFC] leading-none mb-1">{w.value}</p>
              <p className="font-sans text-[13px] text-[rgba(248,250,252,0.55)]">{w.label}</p>
            </article>
          );
        })}
      </div>

      {/* Call Notes Table — Read-Only */}
      <div
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-code text-[16px] font-semibold text-[#F8FAFC] mb-4">Recent Call Notes</h2>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr>
                {['Timestamp', 'Order ID', 'Summary', 'Status', 'Actions'].map(h => (
                  <th key={h} scope="col" className="text-left pb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={5} />
              ) : (
                MOCK_NOTES.map(note => (
                  <tr
                    key={note.id}
                    className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(34,197,94,0.03)] transition-colors duration-[150ms] cursor-pointer"
                    onClick={() => onViewNote(note.id)}
                  >
                    <td className="py-3 pr-4 font-sans text-[14px] text-[rgba(248,250,252,0.6)] whitespace-nowrap">{note.timestamp}</td>
                    <td className="py-3 pr-4 font-code text-[14px] text-[#22C55E] whitespace-nowrap">{note.orderId}</td>
                    <td className="py-3 pr-4 font-sans text-[14px] text-[#F8FAFC] max-w-[240px] truncate">{note.summary}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <Badge variant={statusVariant(note.status)}>{note.status}</Badge>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={e => { e.stopPropagation(); onViewNote(note.id); }}
                        className="text-[rgba(248,250,252,0.5)] hover:text-[#22C55E] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
                        aria-label={`View call note for Order ID ${note.orderId}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Screen reader announcement on load */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        Read-only access mode. Navigation and viewing are available. Modifications are disabled.
      </div>
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function AgentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('readonly-banner-dismissed');
    if (dismissed) setShowBanner(false);
  }, []);

  const handleDismissBanner = () => {
    sessionStorage.setItem('readonly-banner-dismissed', '1');
    setShowBanner(false);
  };

  // Suppress unused warning — user context used for role gating upstream
  void user;

  return (
    <AgentDashboardView
      isLoading={isLoading}
      showBanner={showBanner}
      onDismissBanner={handleDismissBanner}
      onViewNote={id => navigate(`/call-notes/${id}`)}
    />
  );
}
