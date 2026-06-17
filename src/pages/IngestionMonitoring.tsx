import { useState } from 'react';
import {
  CheckCircle, Clock, XCircle, RefreshCw, Filter, RotateCcw,
  ExternalLink, AlertTriangle, Check, ArrowUpDown,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { SkeletonTableRows } from '../components/ui/SkeletonLoader';

/* ─── Types ─────────────────────────────────────────────── */
type AlertStatus = 'failed' | 'retried';
type RetryState = 'idle' | 'loading' | 'success' | 'failed';

interface IngestionAlert {
  id: string;
  fileName: string;
  status: AlertStatus;
  timestamp: string;
  errorSummary: string;
  retryCount: number;
  maxRetries: number;
}

interface HistoryRow {
  id: string;
  fileName: string;
  uploadTime: string;
  totalRows: number;
  validRows: number;
  failedRows: number;
  status: string;
  retryCount: number;
}

/* ─── Mock data ─────────────────────────────────────────── */
const MOCK_ALERTS: IngestionAlert[] = [
  { id: 'a1', fileName: 'call_notes_0522.csv', status: 'failed',  timestamp: '2026-05-22 09:45:12', errorSummary: 'Row 42: missing required field: order_ids', retryCount: 1, maxRetries: 3 },
  { id: 'a2', fileName: 'call_notes_0521.csv', status: 'retried', timestamp: '2026-05-22 08:30:00', errorSummary: 'Persistent parse error — CSV encoding issue', retryCount: 3, maxRetries: 3 },
];

const MOCK_HISTORY: HistoryRow[] = [
  { id: 'h1', fileName: 'call_notes_0520.csv', uploadTime: '2026-05-20 14:00', totalRows: 1500, validRows: 1498, failedRows: 2, status: 'Failed',     retryCount: 1 },
  { id: 'h2', fileName: 'call_notes_0519.csv', uploadTime: '2026-05-19 09:00', totalRows: 2000, validRows: 2000, failedRows: 0, status: 'Successful', retryCount: 0 },
  { id: 'h3', fileName: 'call_notes_0518.csv', uploadTime: '2026-05-18 10:30', totalRows: 800,  validRows: 800,  failedRows: 0, status: 'Successful', retryCount: 0 },
];

/* ─── Status summary card ────────────────────────────────── */
function StatusCard({ count, label, icon: Icon, color, active, onClick }: {
  count: number; label: string; icon: typeof CheckCircle; color: string;
  active: boolean; onClick: () => void;
}) {
  return (
    <button
      role="button"
      aria-pressed={active}
      onClick={onClick}
      className="rounded-[12px] p-5 text-left transition-all duration-[200ms] cursor-pointer focus-visible:outline-[#22C55E] hover:shadow-md"
      style={{
        background: 'var(--color-secondary)',
        boxShadow: active ? `0 0 0 2px ${color}` : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} style={{ color }} aria-hidden="true" />
        <span className="font-code text-[28px] font-bold" style={{ color }}>{count}</span>
      </div>
      <p className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.5)]">{label}</p>
    </button>
  );
}

/* ─── Alert Card ─────────────────────────────────────────── */
function AlertCard({ alert, retryState, onRetry, onEscalate }: {
  alert: IngestionAlert;
  retryState: RetryState;
  onRetry: () => void;
  onEscalate: () => void;
}) {
  const isMaxed  = alert.retryCount >= alert.maxRetries;
  const isFailed = alert.status === 'failed';
  const borderColor = isFailed ? '#EF4444' : '#F59E0B';
  const bgColor     = isFailed ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)';
  const statusColor = isFailed ? '#EF4444' : '#F59E0B';

  return (
    <article
      role="article"
      aria-label={`Alert: ${alert.fileName} — ${alert.status}`}
      className="rounded-[8px] p-4 mb-2 border-l-[3px] transition-all duration-[200ms]"
      style={{ background: bgColor, borderLeftColor: borderColor, boxShadow: isMaxed ? `0 0 0 2px #F59E0B33` : undefined }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-code text-[11px] font-bold uppercase tracking-wide" style={{ color: statusColor }}>
              {alert.status === 'retried' ? `Retried ×${alert.retryCount}` : 'Failed'}
            </span>
            <span className="font-code text-[14px] font-semibold text-[#F8FAFC] truncate">{alert.fileName}</span>
          </div>
          <p className="font-sans text-[12px] text-[rgba(248,250,252,0.45)] mb-1">{alert.timestamp}</p>
          <p className="font-sans text-[13px] text-[rgba(248,250,252,0.7)]">{alert.errorSummary}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="font-sans text-[13px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded flex items-center gap-1"
            aria-label={`View details for ${alert.fileName}`}
          >
            <ExternalLink size={14} aria-hidden="true" /> View Details
          </button>

          {isMaxed && (
            <button
              onClick={onEscalate}
              className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-medium text-[#F59E0B] border border-[rgba(245,158,11,0.4)] hover:bg-[rgba(245,158,11,0.1)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
              aria-label={`Escalate alert for ${alert.fileName} after ${alert.retryCount} failures`}
            >
              <AlertTriangle size={14} aria-hidden="true" /> Escalate ↑
            </button>
          )}

          <button
            onClick={onRetry}
            disabled={retryState === 'loading'}
            aria-label={`Retry ingestion for ${alert.fileName}`}
            aria-busy={retryState === 'loading'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-semibold text-white cursor-pointer transition-all duration-[200ms] disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-[#22C55E]"
            style={{ background: retryState === 'success' ? '#22C55E' : retryState === 'failed' ? '#EF4444' : '#22C55E' }}
          >
            {retryState === 'loading' && <div className="w-3 h-3 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" />}
            {retryState === 'success' && <Check size={14} aria-hidden="true" />}
            {retryState === 'failed'  && <XCircle size={14} aria-hidden="true" />}
            {retryState === 'idle'    && <RotateCcw size={14} aria-hidden="true" />}
            {retryState === 'loading' ? 'Retrying…' : retryState === 'success' ? 'Queued!' : retryState === 'failed' ? 'Failed again' : '↻ Retry Ingestion'}
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function IngestionMonitoring() {
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [retryStates, setRetryStates] = useState<Record<string, RetryState>>({});
  const [isLoading] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsRefreshing(false);
    showToast('Ingestion data refreshed.', 'success');
  };

  const handleRetry = async (alertId: string, fileName: string) => {
    setRetryStates(p => ({ ...p, [alertId]: 'loading' }));
    try {
      await new Promise(r => setTimeout(r, 1500));
      setRetryStates(p => ({ ...p, [alertId]: 'success' }));
      showToast(`Retry queued for ${fileName}.`, 'success');
      setTimeout(() => setRetryStates(p => ({ ...p, [alertId]: 'idle' })), 2000);
    } catch {
      setRetryStates(p => ({ ...p, [alertId]: 'failed' }));
      showToast('Retry request failed. Check your connection.', 'error');
    }
  };

  const handleEscalate = (fileName: string) => {
    showToast(`Alert for ${fileName} escalated to your team.`, 'info');
  };

  const filteredAlerts = activeFilter
    ? MOCK_ALERTS.filter(a => a.status === activeFilter.toLowerCase() || (activeFilter === 'Failed' && a.status === 'failed'))
    : MOCK_ALERTS;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Ingestion Monitoring</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">Real-time ingestion pipeline status</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
          >
            <RefreshCw size={16} className={isRefreshing ? 'spin' : ''} aria-hidden="true" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]">
            <Filter size={16} aria-hidden="true" /> Filter
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatusCard count={24} label="Successful" icon={CheckCircle} color="#22C55E" active={activeFilter === 'Successful'} onClick={() => setActiveFilter(p => p === 'Successful' ? null : 'Successful')} />
        <StatusCard count={3}  label="Pending"    icon={Clock}        color="#F59E0B" active={activeFilter === 'Pending'}    onClick={() => setActiveFilter(p => p === 'Pending' ? null : 'Pending')} />
        <StatusCard count={5}  label="Failed"     icon={XCircle}      color="#EF4444" active={activeFilter === 'Failed'}     onClick={() => setActiveFilter(p => p === 'Failed' ? null : 'Failed')} />
      </div>

      {/* Alert Feed */}
      <div
        className="rounded-[12px] p-4 mb-6 border border-[rgba(255,255,255,0.06)]"
        role="feed"
        aria-label="Ingestion failure alerts"
        aria-live="polite"
        style={{ background: 'var(--color-secondary)', maxHeight: '480px', overflowY: 'auto', boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC] mb-3 px-1">Active Alerts</h2>
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle size={48} className="text-[#22C55E] mb-3" aria-hidden="true" />
            <p className="font-code text-[18px] text-[rgba(248,250,252,0.5)]">All ingestion jobs healthy</p>
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              retryState={retryStates[alert.id] ?? 'idle'}
              onRetry={() => handleRetry(alert.id, alert.fileName)}
              onEscalate={() => handleEscalate(alert.fileName)}
            />
          ))
        )}
      </div>

      {/* History Table */}
      <div
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC] mb-4">Ingestion History</h2>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr>
                {['File Name', 'Upload Time', 'Total Rows', 'Valid', 'Failed', 'Status', 'Retries', 'Actions'].map(h => (
                  <th key={h} scope="col" className="text-left pb-3 pr-4 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-[#F8FAFC] transition-colors duration-[150ms]">
                      {h} <ArrowUpDown size={10} aria-hidden="true" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTableRows rows={5} cols={8} />
              ) : (
                MOCK_HISTORY.map(row => (
                  <tr key={row.id} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                    <td className="py-3 pr-4 font-code text-[13px] text-[#F8FAFC]">{row.fileName}</td>
                    <td className="py-3 pr-4 font-sans text-[14px] text-[rgba(248,250,252,0.6)] whitespace-nowrap">{row.uploadTime}</td>
                    <td className="py-3 pr-4 font-code text-[14px] text-[#F8FAFC]">{row.totalRows.toLocaleString()}</td>
                    <td className="py-3 pr-4 font-code text-[14px] text-[#22C55E]">{row.validRows.toLocaleString()}</td>
                    <td className="py-3 pr-4 font-code text-[14px] text-[#EF4444]">{row.failedRows}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <Badge variant={row.status === 'Successful' ? 'success' : 'error'}>{row.status}</Badge>
                    </td>
                    <td className="py-3 pr-4 font-code text-[14px] text-[rgba(248,250,252,0.6)]">{row.retryCount}</td>
                    <td className="py-3">
                      {row.status !== 'Successful' && (
                        <button
                          className="flex items-center gap-1 font-sans text-[13px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded"
                          aria-label={`Retry ${row.fileName}`}
                        >
                          <RotateCcw size={12} aria-hidden="true" /> Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <p className="font-sans text-[13px] text-[rgba(248,250,252,0.4)]">Showing 1–3 of 347</p>
          <div className="flex gap-2">
            {['Previous', 'Next'].map(l => (
              <button key={l} className="px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]">{l}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
