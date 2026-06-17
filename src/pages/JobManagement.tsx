import { useState, useRef, useEffect, useCallback, useId } from 'react';
import {
  XCircle, Clock, CheckCircle2, RotateCcw, AlertTriangle,
  AlertOctagon, Check, X, Download, Search, ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';

/* ─── Types ─────────────────────────────────────────────── */
type RetryState = 'idle' | 'loading' | 'queued' | 'failed';
type JobStatus = 'failed' | 'max-retries';
type EscalateState = 'idle' | 'escalated';

interface FailedJob {
  id: string;
  jobType: string;
  jobId: string;
  failedAt: string;
  attempt: number;
  maxAttempts: number;
  reason: string;
  status: JobStatus;
  env: string;
  errorTrace: string;
}

type OutcomeStatus = 'Success' | 'Failed Again' | 'In Progress';

interface HistoryEntry {
  jobId: string;
  jobType: string;
  retryTime: string;
  initiatedBy: string;
  attempt: number;
  outcome: OutcomeStatus;
}

/* ─── Mock data ─────────────────────────────────────────── */
const INITIAL_JOBS: FailedJob[] = [
  {
    id: 'j1', jobType: 'CSV Ingestion', jobId: '#JOB-2026-0522-001',
    failedAt: '09:45:12', attempt: 1, maxAttempts: 3, status: 'failed',
    reason: 'Parse error: missing order_ids column',
    env: 'production', errorTrace: 'Error: ValidationError at row 42\n  at parseCSV (csv.ts:88)\n  at ingest (pipeline.ts:34)',
  },
  {
    id: 'j2', jobType: 'AI Summarisation', jobId: '#JOB-2026-0522-003',
    failedAt: '09:40:05', attempt: 3, maxAttempts: 3, status: 'max-retries',
    reason: 'OpenAI API timeout after 30s',
    env: 'production', errorTrace: 'Error: RequestTimeout\n  at callOpenAI (llm.ts:55)\n  at summarise (agent.ts:21)',
  },
  {
    id: 'j3', jobType: 'Status Prediction', jobId: '#JOB-2026-0522-007',
    failedAt: '09:38:44', attempt: 2, maxAttempts: 3, status: 'failed',
    reason: 'Model endpoint returned 503 Service Unavailable',
    env: 'production', errorTrace: 'Error: ServiceUnavailable (503)\n  at callPredict (predict.ts:40)',
  },
  {
    id: 'j4', jobType: 'CSV Ingestion', jobId: '#JOB-2026-0522-011',
    failedAt: '09:30:00', attempt: 1, maxAttempts: 3, status: 'failed',
    reason: 'File corrupted — unexpected EOF at byte 10240',
    env: 'production', errorTrace: 'Error: UnexpectedEOF\n  at readStream (fs.ts:22)',
  },
];

const HISTORY_ENTRIES: HistoryEntry[] = [
  { jobId: '#JOB-2026-0522-005', jobType: 'AI Summarisation', retryTime: '09:51:00', initiatedBy: 'operator@acme.co', attempt: 2, outcome: 'Success' },
  { jobId: '#JOB-2026-0522-004', jobType: 'CSV Ingestion', retryTime: '09:48:30', initiatedBy: 'operator@acme.co', attempt: 1, outcome: 'Success' },
  { jobId: '#JOB-2026-0522-002', jobType: 'Status Prediction', retryTime: '09:45:10', initiatedBy: 'admin@acme.co', attempt: 3, outcome: 'In Progress' },
  { jobId: '#JOB-2026-0521-099', jobType: 'AI Summarisation', retryTime: '08:22:00', initiatedBy: 'operator@acme.co', attempt: 2, outcome: 'Failed Again' },
];

/* ─── Confirmation Modal ─────────────────────────────────── */
function BulkRetryModal({
  failedCount, onCancel, onConfirm, isBulkLoading,
}: {
  failedCount: number; onCancel: () => void; onConfirm: () => void; isBulkLoading: boolean;
}) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)' }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
    >
      <div
        className="rounded-[16px] p-6 w-full max-w-[420px] border border-[rgba(255,255,255,0.1)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw size={28} className="text-[#22C55E] flex-shrink-0" aria-hidden="true" />
          <h2 id={titleId} className="font-code text-[20px] font-semibold text-[#F8FAFC]">Retry All Failed Jobs?</h2>
        </div>
        <p id={bodyId} className="font-sans text-[14px] text-[rgba(248,250,252,0.7)] leading-[1.6] mb-6">
          This will queue <strong className="text-[#F8FAFC]">{failedCount}</strong> failed jobs for re-execution. Monitor progress in this console.
        </p>
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isBulkLoading}
            aria-busy={isBulkLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
          >
            {isBulkLoading
              ? <><div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" /> Queuing…</>
              : <><RotateCcw size={14} aria-hidden="true" /> Retry All</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Job Detail Drawer ──────────────────────────────────── */
function JobDetailDrawer({
  job, retryState, onClose, onRetry,
}: {
  job: FailedJob; retryState: RetryState; onClose: () => void; onRetry: () => void;
}) {
  const [showTrace, setShowTrace] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isMaxRetries = job.status === 'max-retries';

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-job-title"
    >
      <div
        className="w-full max-w-[440px] h-full flex flex-col border-l border-[rgba(255,255,255,0.08)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[rgba(255,255,255,0.07)] flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={isMaxRetries ? 'warning' : 'error'}>{isMaxRetries ? 'MAX RETRIES' : 'FAILED'}</Badge>
            </div>
            <h2 id="drawer-job-title" className="font-code text-[15px] font-bold text-[#F8FAFC]">{job.jobId}</h2>
            <p className="font-sans text-[13px] text-[rgba(248,250,252,0.55)] mt-0.5">{job.jobType}</p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close job detail drawer"
            className="p-2 rounded text-[rgba(248,250,252,0.4)] hover:text-[#F8FAFC] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <section aria-label="Job metadata">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Job Details</h3>
            <dl className="space-y-2">
              {[
                { label: 'Failed At', value: job.failedAt },
                { label: 'Attempt', value: `${job.attempt} / ${job.maxAttempts}` },
                { label: 'Environment', value: job.env },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <dt className="font-sans text-[13px] text-[rgba(248,250,252,0.5)]">{label}</dt>
                  <dd className="font-code text-[13px] text-[rgba(248,250,252,0.8)]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-label="Failure reason">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-2">Failure Reason</h3>
            <p className="font-sans text-[13px] text-[rgba(248,250,252,0.7)] leading-[1.5]">{job.reason}</p>
          </section>

          <section aria-label="Error stack trace">
            <button
              onClick={() => setShowTrace(p => !p)}
              aria-expanded={showTrace}
              className="flex items-center gap-2 font-sans text-[13px] text-[rgba(248,250,252,0.5)] hover:text-[#22C55E] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded mb-2"
            >
              <span>{showTrace ? '▾' : '▸'}</span> Error Stack Trace
            </button>
            {showTrace && (
              <pre className="font-code text-[12px] text-[rgba(248,250,252,0.6)] bg-[#020617] rounded-[8px] p-4 overflow-x-auto whitespace-pre-wrap">
                {job.errorTrace}
              </pre>
            )}
          </section>

          <section aria-label="Previous retry attempts">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Retry History</h3>
            {Array.from({ length: job.attempt }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t border-[rgba(255,255,255,0.04)] first:border-t-0">
                <span className="font-code text-[12px] text-[rgba(248,250,252,0.5)]">Attempt {i + 1}</span>
                <Badge variant="error">Failed</Badge>
              </div>
            ))}
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[rgba(255,255,255,0.07)] flex-shrink-0">
          {isMaxRetries ? (
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] font-sans text-[14px] font-semibold cursor-not-allowed opacity-50 border border-[rgba(245,158,11,0.3)] text-[#F59E0B]"
              disabled
              aria-disabled="true"
            >
              <AlertOctagon size={14} aria-hidden="true" /> Retry Limit Reached
            </button>
          ) : (
            <button
              onClick={onRetry}
              disabled={retryState === 'loading' || retryState === 'queued'}
              aria-label={`Retry job ${job.jobId}`}
              aria-busy={retryState === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
            >
              {retryState === 'loading' && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" />}
              {retryState === 'queued' && <Check size={14} aria-hidden="true" />}
              {retryState === 'idle' && <RotateCcw size={14} aria-hidden="true" />}
              {retryState === 'loading' ? 'Retrying…' : retryState === 'queued' ? 'Queued!' : 'Retry This Job'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Job Card ───────────────────────────────────────────── */
function JobCard({
  job, retryState, escalateState, onRetry, onEscalate, onViewDetails,
}: {
  job: FailedJob;
  retryState: RetryState;
  escalateState: EscalateState;
  onRetry: () => void;
  onEscalate: () => void;
  onViewDetails: () => void;
}) {
  const isMax = job.status === 'max-retries';
  const accentColor = isMax ? '#F59E0B' : '#EF4444';
  const bgColor = isMax ? 'rgba(245,158,11,0.04)' : 'rgba(239,68,68,0.04)';

  return (
    <li
      role="listitem"
      aria-label={`${job.jobType} job ${job.jobId}, failed at ${job.failedAt}, attempt ${job.attempt} of ${job.maxAttempts}`}
      className="border-b border-[rgba(255,255,255,0.04)] last:border-b-0"
      style={{ borderLeft: `3px solid ${accentColor}`, background: bgColor }}
    >
      {/* Row 1: header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isMax
            ? <AlertTriangle size={16} className="text-[#F59E0B]" aria-hidden="true" />
            : <XCircle size={16} className="text-[#EF4444]" aria-hidden="true" />
          }
          <span
            className="font-code text-[11px] font-bold uppercase tracking-wide"
            style={{ color: accentColor }}
          >
            {isMax ? 'MAX RETRIES REACHED' : 'FAILED'}
          </span>
          <span className="font-sans text-[14px] font-semibold text-[#F8FAFC]">{job.jobType}</span>
          <span className="font-code text-[12px] text-[rgba(248,250,252,0.4)]">{job.jobId}</span>
        </div>

        {/* Retry button */}
        <div aria-live="polite">
          {isMax ? (
            <button
              disabled
              aria-disabled="true"
              aria-label={`Retry limit reached for ${job.jobId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-medium cursor-not-allowed opacity-50 border border-[rgba(245,158,11,0.3)] text-[#F59E0B]"
            >
              <AlertOctagon size={13} aria-hidden="true" /> Retry Limit
            </button>
          ) : retryState === 'queued' ? (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-semibold bg-[#22C55E] text-white cursor-default"
            >
              <Check size={13} aria-hidden="true" /> Queued!
            </button>
          ) : (
            <button
              onClick={onRetry}
              disabled={retryState === 'loading'}
              aria-label={`Retry job ${job.jobId}`}
              aria-busy={retryState === 'loading'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-semibold bg-[#22C55E] text-white cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
            >
              {retryState === 'loading'
                ? <div className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" />
                : <RotateCcw size={13} aria-hidden="true" />
              }
              {retryState === 'loading' ? 'Retrying…' : 'Retry'}
            </button>
          )}
        </div>
      </div>

      {/* Row 2: metadata */}
      <div className="flex items-center gap-4 px-6 pb-2 flex-wrap">
        <span className="font-sans text-[12px] text-[rgba(248,250,252,0.4)]">Failed: {job.failedAt}</span>
        <span
          className="font-code text-[12px] font-semibold"
          style={{ color: isMax ? '#EF4444' : '#22C55E' }}
        >
          Attempt: {job.attempt}/{job.maxAttempts}{isMax ? ' ← LIMIT' : ''}
        </span>
        <span className="font-sans text-[13px] text-[rgba(248,250,252,0.65)]">{job.reason}</span>
      </div>

      {/* Row 3: actions */}
      <div className="flex items-center gap-4 px-6 pb-3">
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1 font-sans text-[13px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded transition-colors duration-[150ms]"
        >
          <ExternalLink size={12} aria-hidden="true" /> View Details
        </button>
        {escalateState === 'escalated' ? (
          <span className="flex items-center gap-1 font-sans text-[13px] text-[rgba(248,250,252,0.4)]">
            <CheckCircle size={12} aria-hidden="true" /> Escalated ✓
          </span>
        ) : isMax ? (
          <button
            onClick={onEscalate}
            aria-label={`Escalate job ${job.jobId} — maximum retries reached`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-sans text-[13px] font-medium text-[#F59E0B] border border-[rgba(245,158,11,0.3)] hover:bg-[rgba(245,158,11,0.08)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <AlertTriangle size={12} aria-hidden="true" /> Escalate ↑
          </button>
        ) : (
          <button
            onClick={onEscalate}
            aria-label={`Escalate job ${job.jobId}`}
            className="flex items-center gap-1 font-sans text-[13px] text-[#F59E0B] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded transition-colors duration-[150ms]"
          >
            <AlertTriangle size={12} aria-hidden="true" /> Escalate ↑
          </button>
        )}
      </div>
    </li>
  );
}

/* ─── Presentational ───────────────────────────────────── */
interface JobManagementViewProps {
  jobs: FailedJob[];
  history: HistoryEntry[];
  search: string;
  jobTypeFilter: string;
  retryStates: Record<string, RetryState>;
  escalateStates: Record<string, EscalateState>;
  showBulkModal: boolean;
  isBulkLoading: boolean;
  drawerJob: FailedJob | null;
  recoveredCount: number;
  onSearch: (v: string) => void;
  onJobTypeFilter: (v: string) => void;
  onRetry: (jobId: string) => void;
  onEscalate: (jobId: string) => void;
  onViewDetails: (job: FailedJob) => void;
  onCloseDrawer: () => void;
  onBulkRetry: () => void;
  onBulkConfirm: () => void;
  onBulkCancel: () => void;
}

function JobManagementView({
  jobs, history, search, jobTypeFilter, retryStates, escalateStates,
  showBulkModal, isBulkLoading, drawerJob, recoveredCount,
  onSearch, onJobTypeFilter, onRetry, onEscalate, onViewDetails,
  onCloseDrawer, onBulkRetry, onBulkConfirm, onBulkCancel,
}: JobManagementViewProps) {
  const searchId = useId();
  const failedJobs = jobs.filter(j => j.status === 'failed');
  const pendingRetry = jobs.filter(j => retryStates[j.id] === 'loading' || retryStates[j.id] === 'queued');
  const filteredJobs = jobs.filter(j => {
    const matchSearch = !search || j.jobId.toLowerCase().includes(search.toLowerCase()) || j.jobType.toLowerCase().includes(search.toLowerCase());
    const matchType = !jobTypeFilter || j.jobType === jobTypeFilter;
    return matchSearch && matchType;
  });
  const jobTypes = Array.from(new Set(jobs.map(j => j.jobType)));

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)] flex-wrap gap-4">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Job Management Console</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">Monitor and retry failed background jobs</p>
        </div>
        <button
          onClick={onBulkRetry}
          disabled={failedJobs.length === 0}
          aria-label={`Retry all ${failedJobs.length} failed jobs`}
          aria-disabled={failedJobs.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw size={16} aria-hidden="true" /> Retry All Failed ▸
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Failed Jobs', value: failedJobs.length, icon: XCircle, color: '#EF4444', alert: failedJobs.length > 0 },
          { label: 'Pending Retry', value: pendingRetry.length, icon: Clock, color: '#F59E0B', alert: false },
          { label: 'Recovered Today', value: recoveredCount, icon: CheckCircle2, color: '#22C55E', alert: false },
        ].map(({ label, value, icon: Icon, color, alert }) => (
          <div
            key={label}
            role="status"
            aria-label={`${label}: ${value}`}
            className="rounded-[12px] p-5 border transition-all duration-[200ms]"
            style={{
              background: alert ? 'rgba(239,68,68,0.06)' : 'var(--color-secondary)',
              borderColor: alert ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color }} aria-hidden="true" />
              <span className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)]">{label}</span>
            </div>
            <p className="font-code text-[28px] font-bold leading-none" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Failed Jobs List */}
      <div
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[rgba(255,255,255,0.06)] flex-wrap">
          <select
            value={jobTypeFilter}
            onChange={e => onJobTypeFilter(e.target.value)}
            aria-label="Filter by job type"
            className="rounded-[6px] px-2 py-1.5 font-sans text-[13px] text-[rgba(248,250,252,0.7)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]"
          >
            <option value="" style={{ background: '#0F172A' }}>All Types ▾</option>
            {jobTypes.map(t => <option key={t} value={t} style={{ background: '#0F172A' }}>{t}</option>)}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,250,252,0.3)]" aria-hidden="true" />
            <label htmlFor={searchId} className="sr-only">Search by Job ID or type</label>
            <input
              id={searchId}
              type="search"
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search by Job ID or type…"
              className="w-full pl-9 pr-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[#F8FAFC] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E] placeholder:text-[rgba(248,250,252,0.25)]"
            />
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div
            role="status"
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
            aria-label="All jobs running normally"
          >
            <CheckCircle size={56} className="text-[#22C55E] mb-4" aria-hidden="true" />
            <p className="font-code text-[16px] font-medium text-[rgba(248,250,252,0.5)]">All jobs running normally</p>
            <p className="font-sans text-[13px] text-[rgba(248,250,252,0.35)] mt-1">No failed jobs match your current filter.</p>
          </div>
        ) : (
          <ul role="list" aria-label="Failed background jobs awaiting retry">
            {filteredJobs.map(job => (
              <JobCard
                key={job.id}
                job={job}
                retryState={retryStates[job.id] ?? 'idle'}
                escalateState={escalateStates[job.id] ?? 'idle'}
                onRetry={() => onRetry(job.id)}
                onEscalate={() => onEscalate(job.id)}
                onViewDetails={() => onViewDetails(job)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Retry History Log */}
      <div
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Retry History</h2>
          <button
            aria-label="Export retry history log"
            className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <Download size={14} aria-hidden="true" /> Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid" aria-label="Retry history log">
            <thead>
              <tr>
                {[
                  { label: 'Job ID', sort: false },
                  { label: 'Job Type', sort: false },
                  { label: 'Retry Time', sort: true },
                  { label: 'Initiated By', sort: false },
                  { label: 'Attempt #', sort: true },
                  { label: 'Outcome', sort: false },
                ].map(({ label, sort }) => (
                  <th
                    key={label}
                    scope="col"
                    aria-sort={sort ? 'descending' : undefined}
                    className="text-left px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((entry, i) => (
                <tr key={i} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                  <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{entry.jobId}</td>
                  <td className="px-6 py-3 font-sans text-[14px] text-[rgba(248,250,252,0.8)]">{entry.jobType}</td>
                  <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{entry.retryTime}</td>
                  <td className="px-6 py-3 font-sans text-[14px] text-[rgba(248,250,252,0.7)]">{entry.initiatedBy}</td>
                  <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{entry.attempt}</td>
                  <td className="px-6 py-3">
                    <Badge
                      variant={entry.outcome === 'Success' ? 'success' : entry.outcome === 'Failed Again' ? 'error' : 'warning'}
                    >
                      {entry.outcome}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-6 py-3 border-t border-[rgba(255,255,255,0.06)]">
          <p className="font-sans text-[13px] text-[rgba(248,250,252,0.4)]">Showing 1–{history.length} of {history.length}</p>
          <div className="flex gap-2">
            {['Previous', 'Next'].map(l => (
              <button key={l} className="px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.5)] border border-[rgba(255,255,255,0.08)] cursor-pointer hover:border-[rgba(255,255,255,0.25)] transition-colors duration-[150ms] focus-visible:outline-[#22C55E]">{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBulkModal && (
        <BulkRetryModal
          failedCount={failedJobs.length}
          onCancel={onBulkCancel}
          onConfirm={onBulkConfirm}
          isBulkLoading={isBulkLoading}
        />
      )}
      {drawerJob && (
        <JobDetailDrawer
          job={drawerJob}
          retryState={retryStates[drawerJob.id] ?? 'idle'}
          onClose={onCloseDrawer}
          onRetry={() => onRetry(drawerJob.id)}
        />
      )}
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function JobManagement() {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<FailedJob[]>(INITIAL_JOBS);
  const [retryStates, setRetryStates] = useState<Record<string, RetryState>>({});
  const [escalateStates, setEscalateStates] = useState<Record<string, EscalateState>>({});
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [drawerJob, setDrawerJob] = useState<FailedJob | null>(null);
  const [recoveredCount, setRecoveredCount] = useState(14);
  const [search, setSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');

  const setJobRetryState = useCallback((id: string, state: RetryState) => {
    setRetryStates(prev => ({ ...prev, [id]: state }));
  }, []);

  const handleRetry = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === 'max-retries') return;
    setJobRetryState(jobId, 'loading');
    try {
      await new Promise(r => setTimeout(r, 1500));
      setJobRetryState(jobId, 'queued');
      showToast('Job queued for retry.', 'success');
      setRecoveredCount(p => p + 1);
      setTimeout(() => {
        setJobs(prev => prev.filter(j => j.id !== jobId));
        setJobRetryState(jobId, 'idle');
      }, 2000);
    } catch {
      setJobRetryState(jobId, 'failed');
      showToast('Retry failed. Please try again.', 'error');
      setTimeout(() => setJobRetryState(jobId, 'idle'), 2000);
    }
  }, [jobs, setJobRetryState, showToast]);

  const handleEscalate = useCallback((jobId: string) => {
    setEscalateStates(prev => ({ ...prev, [jobId]: 'escalated' }));
    showToast('Escalation sent. Team notified.', 'warning');
  }, [showToast]);

  const handleBulkConfirm = async () => {
    setIsBulkLoading(true);
    const failedIds = jobs.filter(j => j.status === 'failed').map(j => j.id);
    failedIds.forEach(id => setJobRetryState(id, 'loading'));
    await new Promise(r => setTimeout(r, 2000));
    failedIds.forEach(id => setJobRetryState(id, 'queued'));
    setIsBulkLoading(false);
    setShowBulkModal(false);
    showToast(`${failedIds.length} jobs queued for retry.`, 'success');
    setRecoveredCount(p => p + failedIds.length);
    setTimeout(() => {
      setJobs(prev => prev.filter(j => j.status === 'max-retries'));
      failedIds.forEach(id => setJobRetryState(id, 'idle'));
    }, 2000);
  };

  return (
    <JobManagementView
      jobs={jobs}
      history={HISTORY_ENTRIES}
      search={search}
      jobTypeFilter={jobTypeFilter}
      retryStates={retryStates}
      escalateStates={escalateStates}
      showBulkModal={showBulkModal}
      isBulkLoading={isBulkLoading}
      drawerJob={drawerJob}
      recoveredCount={recoveredCount}
      onSearch={setSearch}
      onJobTypeFilter={setJobTypeFilter}
      onRetry={handleRetry}
      onEscalate={handleEscalate}
      onViewDetails={setDrawerJob}
      onCloseDrawer={() => setDrawerJob(null)}
      onBulkRetry={() => setShowBulkModal(true)}
      onBulkConfirm={handleBulkConfirm}
      onBulkCancel={() => setShowBulkModal(false)}
    />
  );
}
