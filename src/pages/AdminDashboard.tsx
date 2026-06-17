import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Activity, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Eye, Trash2, Upload, Zap, AlertCircle, Users, Inbox, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Badge, statusVariant } from '../components/ui/Badge';
import { SkeletonCard, SkeletonTableRows } from '../components/ui/SkeletonLoader';

/* ─── Mock data ────────────────────────────────────────── */
const MOCK_CHART_DATA = [
  { day: 'Mon', success: 98, failure: 2 },
  { day: 'Tue', success: 97, failure: 3 },
  { day: 'Wed', success: 99, failure: 1 },
  { day: 'Thu', success: 95, failure: 5 },
  { day: 'Fri', success: 98, failure: 2 },
  { day: 'Sat', success: 100, failure: 0 },
  { day: 'Sun', success: 98, failure: 2 },
];

const MOCK_NOTES = [
  { id: '1', orderId: 'ORD-042',  timestamp: '2026-05-22 09:45', summary: 'Customer enquired about delivery status and requested expedited shipping for urgent order.',  status: 'Processed' as const },
  { id: '2', orderId: 'ORD-043',  timestamp: '2026-05-22 09:30', summary: 'Billing discrepancy reported; refund of $124 initiated pending approval from finance team.',  status: 'Pending' as const },
  { id: '3', orderId: 'ORD-044',  timestamp: '2026-05-22 09:15', summary: 'Product return request for damaged item; replacement dispatched with priority label.',         status: 'Processed' as const },
  { id: '4', orderId: 'ORD-045',  timestamp: '2026-05-22 08:55', summary: 'Technical issue with online account; password reset email triggered by support agent.',        status: 'Failed' as const },
  { id: '5', orderId: 'ORD-046',  timestamp: '2026-05-22 08:40', summary: 'Subscription upgrade requested; transition to premium tier scheduled for next billing cycle.',  status: 'Processed' as const },
];

const WIDGETS = [
  { label: 'Total Call Notes', value: '12,847', icon: FileText,     accent: '#22C55E', trend: '+3.2%', up: true },
  { label: 'Active Jobs',      value: '3',       icon: Activity,     accent: '#3B82F6', trend: '0',      up: true },
  { label: 'Open Alerts',      value: '2',       icon: AlertTriangle,accent: '#F59E0B', trend: '+1',     up: false },
  { label: 'Job Success Rate', value: '98.4%',   icon: TrendingUp,   accent: '#22C55E', trend: '+0.2%',  up: true },
];

/* ─── Sub-components ───────────────────────────────────── */
function SummaryWidget({ label, value, icon: Icon, accent, trend, up, isLoading }: typeof WIDGETS[0] & { isLoading: boolean }) {
  if (isLoading) return <SkeletonCard />;
  return (
    <article
      role="article"
      aria-label={`${label}: ${value}`}
      className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)] cursor-pointer transition-all duration-[200ms] hover:shadow-lg hover:-translate-y-0.5"
      style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      tabIndex={0}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-[8px] flex items-center justify-center" style={{ background: `${accent}22` }}>
          <Icon size={20} style={{ color: accent }} aria-hidden="true" />
        </div>
        <span className={`flex items-center gap-1 font-sans text-[12px] font-medium ${up ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
          {up ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />}
          {trend}
        </span>
      </div>
      <p className="font-code text-[32px] font-bold text-[#F8FAFC] leading-none mb-1">{value}</p>
      <p className="font-sans text-[13px] text-[rgba(248,250,252,0.55)]">{label}</p>
    </article>
  );
}

/* ─── Presentational ───────────────────────────────────── */
interface AdminDashboardViewProps {
  userName: string;
  isLoading: boolean;
  onDeleteNote: (id: string) => void;
  onNavigate: (path: string) => void;
}

function AdminDashboardView({ userName, isLoading, onDeleteNote, onNavigate }: AdminDashboardViewProps) {
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Dashboard</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">{today}</p>
        </div>
        <button
          onClick={() => onNavigate('/ingestion')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer transition-all duration-[200ms] hover:opacity-90 hover:-translate-y-px focus-visible:outline-[#22C55E] focus-visible:outline-offset-2"
        >
          <Upload size={16} aria-hidden="true" />
          New Ingestion
        </button>
      </div>

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {WIDGETS.map(w => (
          <SummaryWidget key={w.label} {...w} isLoading={isLoading} />
        ))}
      </div>

      {/* Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
        {/* Recent Call Notes */}
        <div
          className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-code text-[16px] font-semibold text-[#F8FAFC]">Recent Call Notes</h2>
            <button
              onClick={() => onNavigate('/call-notes')}
              className="font-sans text-[13px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" role="grid">
              <thead>
                <tr>
                  {['Timestamp', 'Order ID', 'Summary', 'Status', 'Actions'].map(h => (
                    <th
                      key={h}
                      scope="col"
                      className="text-left pb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonTableRows rows={5} cols={5} />
                ) : MOCK_NOTES.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <Inbox size={48} className="text-[rgba(248,250,252,0.2)] mx-auto mb-3" aria-hidden="true" />
                      <p className="font-code text-[16px] text-[rgba(248,250,252,0.4)]">No call notes yet</p>
                      <button
                        onClick={() => onNavigate('/ingestion')}
                        className="mt-3 px-4 py-2 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
                      >
                        + Upload CSV
                      </button>
                    </td>
                  </tr>
                ) : (
                  MOCK_NOTES.map(note => (
                    <tr
                      key={note.id}
                      className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(34,197,94,0.04)] transition-colors duration-[150ms] cursor-pointer"
                    >
                      <td className="py-3 pr-4 font-sans text-[14px] text-[rgba(248,250,252,0.6)] whitespace-nowrap">{note.timestamp}</td>
                      <td className="py-3 pr-4 font-code text-[14px] text-[#22C55E] whitespace-nowrap">{note.orderId}</td>
                      <td className="py-3 pr-4 font-sans text-[14px] text-[#F8FAFC] max-w-[240px] truncate">{note.summary}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        <Badge variant={statusVariant(note.status)}>{note.status}</Badge>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onNavigate(`/call-notes/${note.id}`)}
                            className="text-[rgba(248,250,252,0.5)] hover:text-[#22C55E] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
                            aria-label={`View call note ${note.orderId}`}
                          >
                            <Eye size={16} aria-hidden="true" />
                          </button>
                          <button
                            onClick={() => onDeleteNote(note.id)}
                            className="text-[rgba(248,250,252,0.5)] hover:text-[#EF4444] transition-colors duration-[150ms] cursor-pointer p-1 rounded focus-visible:outline-[#22C55E]"
                            aria-label={`Delete call note ${note.orderId}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.1em] text-[rgba(248,250,252,0.5)] mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-2">
            {[
              { label: '+ Upload CSV',     path: '/ingestion',     icon: Upload },
              { label: 'Run Prediction',   path: '/api-console',   icon: Zap },
              { label: 'View Alerts',      path: '/monitoring',    icon: AlertCircle },
              { label: 'Manage Users',     path: '/admin/users',   icon: Users },
            ].map(({ label, path, icon: Icon }) => (
              <button
                key={label}
                onClick={() => onNavigate(path)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.1)] hover:border-[#22C55E] hover:bg-[rgba(34,197,94,0.06)] transition-all duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E] text-left"
              >
                <Icon size={16} className="text-[rgba(248,250,252,0.5)]" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Job Health Chart */}
      <div
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC] mb-6">
          Job Success Rate — Last 7 Days
        </h2>
        {isLoading ? (
          <div className="skeleton h-48 rounded-[8px]" />
        ) : (
          <div
            role="img"
            aria-label="Bar chart showing job success rates over the past 7 days"
            className="h-48"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_CHART_DATA} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 12, fontFamily: 'Fira Sans' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 12, fontFamily: 'Fira Sans' }} axisLine={false} tickLine={false} domain={[90, 100]} />
                <Tooltip
                  contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontFamily: 'Fira Sans', fontSize: 13, color: '#F8FAFC' }}
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                />
                <Bar dataKey="success" name="Success %" fill="#22C55E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="failure" name="Failure %" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {/* Visually hidden data table for accessibility */}
        <p className="sr-only">
          Data: Mon 98%, Tue 97%, Wed 99%, Thu 95%, Fri 98%, Sat 100%, Sun 98% success rate.
        </p>
      </div>
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading] = useState(false);

  const handleDeleteNote = (id: string) => {
    showToast(`Note ${id} deleted.`, 'success');
  };

  return (
    <AdminDashboardView
      userName={user?.name ?? ''}
      isLoading={isLoading}
      onDeleteNote={handleDeleteNote}
      onNavigate={navigate}
    />
  );
}
