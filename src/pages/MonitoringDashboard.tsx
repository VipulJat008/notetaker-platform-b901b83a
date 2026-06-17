import { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Activity, Timer, Loader, TrendingUp, TrendingDown,
  RefreshCw, CheckCircle, XCircle,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';
import { Badge } from '../components/ui/Badge';
import { SkeletonLines } from '../components/ui/SkeletonLoader';

/* ─── Types ─────────────────────────────────────────────── */
type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d';

interface SuccessDataPoint { time: string; rate: number; }
interface LatencyDataPoint { jobType: string; p50: number; p95: number; }
interface JobTypeRow {
  jobType: string; color: string;
  runsToday: number; successful: number; failed: number;
  failureRate: number; p50ms: number; p95ms: number; lastRun: string;
}
interface FeedEntry {
  id: string; status: 'success' | 'error';
  jobType: string; jobId: string; latency: string; timestamp: string;
}

/* ─── Mock data generators ───────────────────────────────── */
function generateSuccessData(range: TimeRange): SuccessDataPoint[] {
  const labels: Record<TimeRange, string[]> = {
    '1h': ['09:00','09:10','09:20','09:30','09:40','09:50','10:00'],
    '6h': ['04:00','05:00','06:00','07:00','08:00','09:00','10:00'],
    '24h': ['Mon 22','Mon 04','Mon 10','Mon 16','Mon 22','Tue 04','Tue 10'],
    '7d': ['17 May','18 May','19 May','20 May','21 May','22 May','23 May'],
    '30d': ['24 Apr','27 Apr','30 Apr','3 May','6 May','9 May','23 May'],
  };
  const bases = [97, 98.4, 96, 99, 97.8, 98.1, 98.4];
  return labels[range].map((time, i) => ({ time, rate: bases[i] }));
}

function generateLatencyData(): LatencyDataPoint[] {
  return [
    { jobType: 'CSV Ingest', p50: 1200, p95: 2400 },
    { jobType: 'AI Summ.', p50: 3800, p95: 7200 },
    { jobType: 'Prediction', p50: 242, p95: 510 },
    { jobType: 'Tenant Filter', p50: 85, p95: 180 },
  ];
}

const JOB_TYPE_ROWS: JobTypeRow[] = [
  { jobType: 'CSV Ingestion', color: '#3B82F6', runsToday: 142, successful: 139, failed: 3, failureRate: 2.1, p50ms: 1200, p95ms: 2400, lastRun: '09:52:10' },
  { jobType: 'AI Summarisation', color: '#8B5CF6', runsToday: 98, successful: 91, failed: 7, failureRate: 7.1, p50ms: 3800, p95ms: 7200, lastRun: '09:50:45' },
  { jobType: 'Status Prediction', color: '#22C55E', runsToday: 2301, successful: 2300, failed: 1, failureRate: 0.04, p50ms: 242, p95ms: 510, lastRun: '09:53:00' },
  { jobType: 'Tenant Filter', color: '#F59E0B', runsToday: 700, successful: 700, failed: 0, failureRate: 0, p50ms: 85, p95ms: 180, lastRun: '09:53:05' },
];

const INITIAL_FEED: FeedEntry[] = [
  { id: 'f1', status: 'success', jobType: 'Status Prediction', jobId: '#JOB-2026-0523-9821', latency: '238ms', timestamp: '09:53:05' },
  { id: 'f2', status: 'success', jobType: 'CSV Ingestion', jobId: '#JOB-2026-0523-9820', latency: '1.1s', timestamp: '09:52:10' },
  { id: 'f3', status: 'error', jobType: 'AI Summarisation', jobId: '#JOB-2026-0523-9819', latency: '8.2s', timestamp: '09:50:45' },
  { id: 'f4', status: 'success', jobType: 'Tenant Filter', jobId: '#JOB-2026-0523-9818', latency: '82ms', timestamp: '09:50:30' },
  { id: 'f5', status: 'success', jobType: 'Status Prediction', jobId: '#JOB-2026-0523-9817', latency: '251ms', timestamp: '09:49:58' },
  { id: 'f6', status: 'error', jobType: 'CSV Ingestion', jobId: '#JOB-2026-0523-9816', latency: '2.4s', timestamp: '09:48:22' },
  { id: 'f7', status: 'success', jobType: 'AI Summarisation', jobId: '#JOB-2026-0523-9815', latency: '3.9s', timestamp: '09:47:10' },
];

/* ─── Colour helpers ─────────────────────────────────────── */
function successRateColor(rate: number) {
  if (rate >= 95) return '#22C55E';
  if (rate >= 80) return '#F59E0B';
  return '#EF4444';
}

function latencyColor(ms: number) {
  if (ms < 2000) return '#22C55E';
  if (ms <= 5000) return '#F59E0B';
  return '#EF4444';
}

function failureRateColor(rate: number) {
  if (rate < 5) return '#22C55E';
  if (rate <= 15) return '#F59E0B';
  return '#EF4444';
}

/* ─── Custom Tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-[8px] px-3 py-2 border border-[rgba(255,255,255,0.08)]"
      style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-lg)' }}
    >
      <p className="font-sans text-[12px] text-[rgba(248,250,252,0.5)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-code text-[13px] text-[#F8FAFC]">
          {p.name ? <span className="text-[rgba(248,250,252,0.5)] mr-1">{p.name}:</span> : null}
          {typeof p.value === 'number' && p.name?.includes('ms') ? `${p.value}ms` : p.value}
          {!p.name?.includes('ms') && typeof p.value === 'number' && label && !p.name ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────── */
function KpiCard({
  label, value, icon: Icon, color, trend, trendLabel, onFocus,
}: {
  label: string; value: string; icon: typeof CheckCircle2; color: string;
  trend?: 'up' | 'down'; trendLabel?: string;
  onFocus?: () => void;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? '#22C55E' : '#EF4444';

  return (
    <article
      role="article"
      aria-label={`${label}: ${value}${trendLabel ? `, trend: ${trendLabel}` : ''}`}
      tabIndex={0}
      onClick={onFocus}
      onKeyDown={e => e.key === 'Enter' && onFocus?.()}
      className="rounded-[12px] p-5 border border-[rgba(255,255,255,0.06)] cursor-pointer hover:-translate-y-0.5 transition-all duration-[200ms] focus-visible:outline-[#22C55E]"
      style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} aria-hidden="true" />
        <span className="font-sans text-[13px] text-[rgba(248,250,252,0.55)]">{label}</span>
      </div>
      <p className="font-code text-[32px] font-bold leading-none mb-2" style={{ color }}>{value}</p>
      {trend && trendLabel && (
        <div className="flex items-center gap-1">
          <TrendIcon size={12} style={{ color: trendColor }} aria-hidden="true" />
          <span className="font-sans text-[12px]" style={{ color: trendColor }}>{trendLabel}</span>
        </div>
      )}
    </article>
  );
}

/* ─── Presentational ───────────────────────────────────── */
interface MonitoringDashboardViewProps {
  timeRange: TimeRange;
  successData: SuccessDataPoint[];
  latencyData: LatencyDataPoint[];
  feed: FeedEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  showDataTable: boolean;
  expandedJobType: string | null;
  onTimeRangeChange: (r: TimeRange) => void;
  onRefresh: () => void;
  onToggleDataTable: () => void;
  onToggleJobRow: (type: string) => void;
  onClearFeed: () => void;
  chartHighlight: string | null;
  successRef: React.RefObject<HTMLDivElement | null>;
  latencyRef: React.RefObject<HTMLDivElement | null>;
  onKpiClick: (chart: 'success' | 'latency') => void;
}

function MonitoringDashboardView({
  timeRange, successData, latencyData, feed, isLoading, isRefreshing,
  showDataTable, expandedJobType,
  onTimeRangeChange, onRefresh, onToggleDataTable, onToggleJobRow, onClearFeed,
  chartHighlight, successRef, latencyRef, onKpiClick,
}: MonitoringDashboardViewProps) {
  const successRate = 98.4;
  const avgLatencyMs = 1200;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)] flex-wrap gap-4">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Monitoring Dashboard</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">Background job health and performance metrics</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E] pulse-green" />
            <span className="font-sans text-[12px] text-[rgba(248,250,252,0.35)]">Auto-refreshing every 60s</span>
          </div>
          <select
            value={timeRange}
            onChange={e => onTimeRangeChange(e.target.value as TimeRange)}
            aria-label="Select time range for metrics"
            className="rounded-[8px] px-3 py-2 font-sans text-[14px] text-[rgba(248,250,252,0.8)] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] cursor-pointer focus-visible:outline-[#22C55E] focus:outline-none"
          >
            {(['1h', '6h', '24h', '7d', '30d'] as TimeRange[]).map(r => (
              <option key={r} value={r} style={{ background: '#0F172A' }}>Last {r}</option>
            ))}
          </select>
          <button
            onClick={onRefresh}
            aria-label="Refresh metrics"
            aria-busy={isRefreshing}
            disabled={isRefreshing}
            className="p-2 rounded-[8px] text-[rgba(248,250,252,0.6)] hover:text-[#F8FAFC] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
          >
            <RefreshCw size={16} aria-hidden="true" className={isRefreshing ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[12px] p-5 border border-[rgba(255,255,255,0.06)]" style={{ background: 'var(--color-secondary)' }}>
              <SkeletonLines lines={2} />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              label="Job Success Rate" value={`${successRate}%`}
              icon={CheckCircle2} color={successRateColor(successRate)}
              trend="up" trendLabel="+1.2% vs yesterday"
              onFocus={() => onKpiClick('success')}
            />
            <KpiCard
              label="Total Jobs Completed" value="3,241"
              icon={Activity} color="#3B82F6"
              trend="up" trendLabel="+184 vs yesterday"
              onFocus={() => onKpiClick('latency')}
            />
            <KpiCard
              label="Avg Latency (P50)" value={`${(avgLatencyMs / 1000).toFixed(1)}s`}
              icon={Timer} color={latencyColor(avgLatencyMs)}
              trend="down" trendLabel="-0.2s vs yesterday"
              onFocus={() => onKpiClick('latency')}
            />
            <KpiCard
              label="Active / Running Jobs" value="3"
              icon={Loader} color="#22C55E"
              trendLabel="Queue healthy"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Success Rate Line Chart */}
        <div
          ref={successRef}
          role="img"
          aria-label={`Line chart: job success rate over last ${timeRange}, includes 95% target threshold line`}
          className="rounded-[12px] p-5 border transition-shadow duration-[300ms]"
          style={{
            background: 'var(--color-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: chartHighlight === 'success' ? 'var(--shadow-lg)' : 'var(--shadow-md)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-code text-[14px] font-semibold text-[#F8FAFC]">
              Job Success Rate — Last {timeRange}
            </h2>
            <button
              onClick={onToggleDataTable}
              aria-expanded={showDataTable}
              className="font-sans text-[12px] text-[rgba(248,250,252,0.4)] hover:text-[#22C55E] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded"
            >
              {showDataTable ? 'Hide' : 'Show'} data table
            </button>
          </div>

          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <SkeletonLines lines={3} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={successData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 100]} tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<ChartTooltip />} />
                <ReferenceLine y={95} stroke="rgba(245,158,11,0.5)" strokeDasharray="4 4" label={{ value: 'Target 95%', fill: 'rgba(245,158,11,0.6)', fontSize: 11 }} />
                <Line
                  type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: '#22C55E' }}
                  fill="rgba(34,197,94,0.08)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {showDataTable && !isLoading && (
            <div className="mt-4 overflow-x-auto">
              <p className="sr-only">Success rate data table for last {timeRange}</p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th scope="col" className="text-left pb-2 pr-6 font-sans text-[11px] uppercase text-[rgba(248,250,252,0.4)]">Time</th>
                    <th scope="col" className="text-left pb-2 font-sans text-[11px] uppercase text-[rgba(248,250,252,0.4)]">Success Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {successData.map(d => (
                    <tr key={d.time}>
                      <td className="py-1 pr-6 font-code text-[12px] text-[rgba(248,250,252,0.5)]">{d.time}</td>
                      <td className="py-1 font-code text-[12px]" style={{ color: successRateColor(d.rate) }}>{d.rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Latency Bar Chart */}
        <div
          ref={latencyRef}
          role="img"
          aria-label="Bar chart: execution latency per job type"
          className="rounded-[12px] p-5 border transition-shadow duration-[300ms]"
          style={{
            background: 'var(--color-secondary)',
            borderColor: 'rgba(255,255,255,0.06)',
            boxShadow: chartHighlight === 'latency' ? 'var(--shadow-lg)' : 'var(--shadow-md)',
          }}
        >
          <h2 className="font-code text-[14px] font-semibold text-[#F8FAFC] mb-4">Avg Execution Latency by Job Type</h2>

          {isLoading ? (
            <div className="h-[200px] flex items-center justify-center">
              <SkeletonLines lines={3} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={latencyData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="jobType" tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'rgba(248,250,252,0.45)', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 8 }}
                  formatter={v => <span style={{ color: 'rgba(248,250,252,0.6)', fontSize: 12 }}>{v}</span>}
                />
                <Bar dataKey="p50" name="P50 ms" fill="#3B82F6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="p95" name="P95 ms" fill="#8B5CF6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Job Type Breakdown Table */}
      <div
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Job Type Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {[
                  { label: 'Job Type', sort: false },
                  { label: 'Runs (Today)', sort: true },
                  { label: 'Successful', sort: false },
                  { label: 'Failed', sort: false },
                  { label: 'Failure Rate', sort: true },
                  { label: 'P50 Latency', sort: true },
                  { label: 'P95 Latency', sort: true },
                  { label: 'Last Run', sort: false },
                ].map(({ label, sort }) => (
                  <th
                    key={label}
                    scope="col"
                    aria-sort={sort ? 'none' : undefined}
                    className="text-left px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOB_TYPE_ROWS.map(row => (
                <>
                  <tr
                    key={row.jobType}
                    className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms] cursor-pointer"
                    onClick={() => onToggleJobRow(row.jobType)}
                    aria-expanded={expandedJobType === row.jobType}
                  >
                    <td className="px-6 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded font-sans text-[12px] font-medium"
                        style={{ background: `${row.color}22`, color: row.color }}
                      >
                        {row.jobType}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-code text-[14px] text-[rgba(248,250,252,0.8)]">{row.runsToday.toLocaleString()}</td>
                    <td className="px-6 py-3 font-code text-[14px] text-[#22C55E]">{row.successful.toLocaleString()}</td>
                    <td className="px-6 py-3 font-code text-[14px] text-[row.failed > 0 ? '#EF4444' : 'rgba(248,250,252,0.6)']"
                      style={{ color: row.failed > 0 ? '#EF4444' : 'rgba(248,250,252,0.6)' }}
                    >{row.failed}</td>
                    <td className="px-6 py-3 font-code text-[14px]" style={{ color: failureRateColor(row.failureRate) }}>
                      {row.failureRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3 font-code text-[14px]" style={{ color: latencyColor(row.p50ms) }}>
                      {row.p50ms >= 1000 ? `${(row.p50ms / 1000).toFixed(1)}s` : `${row.p50ms}ms`}
                    </td>
                    <td className="px-6 py-3 font-code text-[14px]" style={{ color: latencyColor(row.p95ms) }}>
                      {row.p95ms >= 1000 ? `${(row.p95ms / 1000).toFixed(1)}s` : `${row.p95ms}ms`}
                    </td>
                    <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.5)]">{row.lastRun}</td>
                  </tr>
                  {expandedJobType === row.jobType && (
                    <tr key={`${row.jobType}-sparkline`}>
                      <td colSpan={8} className="px-6 pb-4 border-t border-[rgba(255,255,255,0.04)]">
                        <div className="bg-[rgba(0,0,0,0.2)] rounded-[8px] p-4 mt-2">
                          <p className="font-sans text-[12px] text-[rgba(248,250,252,0.45)] mb-3">P50 Latency trend (last 24h) — {row.jobType}</p>
                          <ResponsiveContainer width="100%" height={80}>
                            <LineChart data={[
                              { t: '00:00', v: row.p50ms * 0.9 },
                              { t: '04:00', v: row.p50ms * 1.1 },
                              { t: '08:00', v: row.p50ms * 0.95 },
                              { t: '12:00', v: row.p50ms * 1.2 },
                              { t: '16:00', v: row.p50ms * 0.85 },
                              { t: '20:00', v: row.p50ms * 1.0 },
                              { t: '23:59', v: row.p50ms },
                            ]} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                              <XAxis dataKey="t" tick={{ fill: 'rgba(248,250,252,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: 'rgba(248,250,252,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                              <Line type="monotone" dataKey="v" stroke={row.color} strokeWidth={1.5} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Job Activity Feed */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Recent job activity"
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Recent Jobs</h2>
          <button
            onClick={onClearFeed}
            className="font-sans text-[13px] text-[rgba(248,250,252,0.4)] hover:text-[#22C55E] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded"
          >
            Clear
          </button>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
          {feed.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="font-sans text-[14px] text-[rgba(248,250,252,0.35)]">No recent job activity</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-[rgba(255,255,255,0.04)]">
              {feed.map(entry => (
                <li key={entry.id} className="flex items-center gap-3 px-6 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                  {entry.status === 'success'
                    ? <CheckCircle size={14} className="flex-shrink-0 text-[#22C55E]" aria-hidden="true" />
                    : <XCircle size={14} className="flex-shrink-0 text-[#EF4444]" aria-hidden="true" />
                  }
                  <span className="font-code text-[13px] font-medium text-[#22C55E] min-w-[140px]">{entry.jobType}</span>
                  <span className="font-sans text-[12px] text-[rgba(248,250,252,0.4)] flex-1 truncate">{entry.jobId}</span>
                  <span className="font-code text-[13px] text-[rgba(248,250,252,0.6)]">{entry.latency}</span>
                  <span className="font-sans text-[12px] text-[rgba(248,250,252,0.35)] whitespace-nowrap">{entry.timestamp}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Aria-live refresh announcer */}
      <div aria-live="polite" className="sr-only" id="refresh-announcer" />
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function MonitoringDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [successData, setSuccessData] = useState<SuccessDataPoint[]>(() => generateSuccessData('24h'));
  const [latencyData] = useState<LatencyDataPoint[]>(generateLatencyData());
  const [feed, setFeed] = useState<FeedEntry[]>(INITIAL_FEED);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [expandedJobType, setExpandedJobType] = useState<string | null>(null);
  const [chartHighlight, setChartHighlight] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const latencyRef = useRef<HTMLDivElement>(null);

  const handleTimeRangeChange = useCallback(async (range: TimeRange) => {
    setTimeRange(range);
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setSuccessData(generateSuccessData(range));
    setIsLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setSuccessData(generateSuccessData(timeRange));
    setIsRefreshing(false);
    const announcer = document.getElementById('refresh-announcer');
    if (announcer) announcer.textContent = 'Metrics updated.';
  }, [timeRange]);

  /* Auto-refresh every 60s */
  useEffect(() => {
    const id = setInterval(handleRefresh, 60_000);
    return () => clearInterval(id);
  }, [handleRefresh]);

  const handleKpiClick = (chart: 'success' | 'latency') => {
    setChartHighlight(chart);
    setTimeout(() => setChartHighlight(null), 2000);
    (chart === 'success' ? successRef : latencyRef).current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <MonitoringDashboardView
      timeRange={timeRange}
      successData={successData}
      latencyData={latencyData}
      feed={feed}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      showDataTable={showDataTable}
      expandedJobType={expandedJobType}
      onTimeRangeChange={handleTimeRangeChange}
      onRefresh={handleRefresh}
      onToggleDataTable={() => setShowDataTable(p => !p)}
      onToggleJobRow={type => setExpandedJobType(p => p === type ? null : type)}
      onClearFeed={() => setFeed([])}
      chartHighlight={chartHighlight}
      successRef={successRef}
      latencyRef={latencyRef}
      onKpiClick={handleKpiClick}
    />
  );
}
