import { useState } from 'react';
import { Activity, Timer, Gauge, BarChart2, ExternalLink, Send, RotateCcw, Download } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { SkeletonLines } from '../components/ui/SkeletonLoader';

/* ─── Mock data ─────────────────────────────────────────── */
const DEFAULT_PAYLOAD = `{
  "call_id": "CALL-20260522-001",
  "duration": 120,
  "notes": "Customer enquired about delivery status"
}`;

const MOCK_LOG = [
  { requestTime: '09:45:12', inputSummary: 'call_id: CALL-001, duration: 120', predictedCode: 'RESOLVED',  confidence: 0.94, latencyMs: 234, status: 'success' as const },
  { requestTime: '09:44:58', inputSummary: 'call_id: CALL-002, duration: 45',  predictedCode: 'PENDING',   confidence: 0.78, latencyMs: 198, status: 'success' as const },
  { requestTime: '09:44:30', inputSummary: 'call_id: CALL-003, duration: 200', predictedCode: 'ESCALATED', confidence: 0.62, latencyMs: 310, status: 'success' as const },
  { requestTime: '09:43:12', inputSummary: 'invalid payload',                  predictedCode: 'ERROR',     confidence: 0,    latencyMs: 12,  status: 'error'   as const },
];

/* ─── Metric Card ────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, color, extra }: {
  label: string; value: string; icon: typeof Activity; color: string; extra?: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-label={`${label}: ${value}`}
      className="rounded-[12px] p-5 border border-[rgba(255,255,255,0.06)]"
      style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} style={{ color }} aria-hidden="true" />
        <span className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)]">{label}</span>
      </div>
      <p className="font-code text-[26px] font-bold leading-none" style={{ color }}>{value}</p>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  );
}

/* ─── Confidence Bar ─────────────────────────────────────── */
function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.8 ? '#22C55E' : value >= 0.6 ? '#F59E0B' : '#EF4444';
  return (
    <div className="w-20 progress-bar" aria-label={`Confidence: ${(value * 100).toFixed(0)}%`}>
      <div className="progress-fill" style={{ width: `${value * 100}%`, background: color }} />
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function PredictionAPIConsole() {
  const { showToast } = useToast();
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<'success' | 'error' | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);

  const handlePayloadChange = (v: string) => {
    setPayload(v);
    try { JSON.parse(v); setJsonError(null); } catch { setJsonError('Invalid JSON syntax'); }
  };

  const handleSend = async () => {
    if (jsonError) return;
    setIsSending(true);
    setResponse(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/v1/predict-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      const latency = Date.now() - start;
      setResponseLatency(latency);
      const data = await res.json() as unknown;
      setResponse(JSON.stringify(data, null, 2));
      setResponseStatus(res.ok ? 'success' : 'error');
    } catch {
      const latency = Date.now() - start;
      setResponseLatency(latency);
      setResponse(JSON.stringify({ error: 'Network request failed', status_code: 'ERROR' }, null, 2));
      setResponseStatus('error');
      showToast('Request failed. Check your connection.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const isJsonValid = !jsonError && payload.trim().length > 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Prediction API Console</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">POST /predict-status — Real-time call status code prediction</p>
        </div>
        <button
          className="flex items-center gap-2 font-sans text-[14px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded"
          aria-label="Open API documentation"
        >
          <ExternalLink size={14} aria-hidden="true" /> API Docs ↗
        </button>
      </div>

      {/* Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="API Status" value="Healthy" icon={Activity} color="#22C55E"
          extra={<div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] pulse-green" />}
        />
        <MetricCard
          label="Avg Latency" value="242ms" icon={Timer} color="#3B82F6"
        />
        <MetricCard
          label="Rate Limit Used" value="34,201/50k" icon={Gauge} color="#F59E0B"
          extra={
            <div className="progress-bar w-full">
              <div className="progress-fill" style={{ width: '68%', background: '#F59E0B' }} />
            </div>
          }
        />
        <MetricCard
          label="Predictions Today" value="12,450" icon={BarChart2} color="#22C55E"
        />
      </div>

      {/* Test Request + Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Request Panel */}
        <div
          className="rounded-[12px] p-5 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="font-sans text-[15px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.5)] mb-3">
            Test Request
          </h2>
          <div
            className="rounded-[8px] mb-3 overflow-hidden border"
            style={{ borderColor: jsonError ? '#EF4444' : 'rgba(255,255,255,0.08)' }}
          >
            <textarea
              value={payload}
              onChange={e => handlePayloadChange(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full font-code text-[13px] text-[#F8FAFC] bg-[#020617] p-4 resize-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]"
              role="textbox"
              aria-multiline="true"
              aria-label="JSON request payload"
              aria-describedby={jsonError ? 'json-error' : undefined}
              aria-invalid={!!jsonError}
            />
          </div>
          {jsonError && (
            <p id="json-error" className="font-sans text-[12px] text-[#EF4444] mb-3">{jsonError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={!isJsonValid || isSending}
              aria-label="Send test prediction request"
              aria-busy={isSending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-[#22C55E]"
            >
              {isSending ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" /> : <Send size={14} aria-hidden="true" />}
              {isSending ? 'Sending…' : 'Send Request'}
            </button>
            <button
              onClick={() => { setPayload(DEFAULT_PAYLOAD); setJsonError(null); }}
              className="flex items-center gap-1 font-sans text-[13px] text-[rgba(248,250,252,0.4)] hover:text-[#F8FAFC] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded"
            >
              <RotateCcw size={12} aria-hidden="true" /> Reset
            </button>
          </div>
        </div>

        {/* Response Panel */}
        <div
          role="region"
          aria-label="Prediction response output"
          aria-live="polite"
          className="rounded-[12px] p-5 border border-[rgba(255,255,255,0.06)]"
          style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        >
          <h2 className="font-sans text-[15px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.5)] mb-3">
            Prediction Response
          </h2>
          {!response && !isSending && (
            <div className="flex flex-col items-center justify-center h-[180px] text-center">
              <p className="font-sans text-[13px] text-[rgba(248,250,252,0.3)]">
                Run a test request to see the prediction output
              </p>
            </div>
          )}
          {isSending && (
            <div className="h-[180px] flex flex-col gap-3 justify-center">
              <SkeletonLines lines={3} />
            </div>
          )}
          {response && !isSending && (
            <>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-sans text-[12px] font-semibold"
                  style={{
                    background: responseStatus === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: responseStatus === 'success' ? '#22C55E' : '#EF4444',
                  }}
                >
                  {responseStatus === 'success' ? '200 OK' : '400 Bad Request'}
                </span>
                {responseLatency && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-[rgba(34,197,94,0.15)] font-sans text-[12px] text-[#22C55E]">
                    ⚡ {responseLatency}ms
                  </span>
                )}
              </div>
              <pre
                className="font-code text-[13px] text-[#F8FAFC] bg-[#020617] rounded-[8px] p-4 overflow-auto"
                style={{ maxHeight: '200px' }}
              >
                {response}
              </pre>
            </>
          )}
        </div>
      </div>

      {/* Recent Predictions Log */}
      <div
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        role="log"
        aria-live="polite"
        aria-label="Recent predictions log"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Recent Predictions</h2>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
            aria-label="Export predictions log as CSV"
          >
            <Download size={14} aria-hidden="true" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr>
                {['Request Time', 'Input Summary', 'Predicted Code', 'Confidence', 'Latency', 'Status'].map(h => (
                  <th key={h} scope="col" className="text-left pb-3 pr-4 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LOG.map((row, i) => (
                <tr key={i} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                  <td className="py-3 pr-4 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{row.requestTime}</td>
                  <td className="py-3 pr-4 font-sans text-[13px] text-[rgba(248,250,252,0.7)] max-w-[180px] truncate">{row.inputSummary}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={row.predictedCode === 'RESOLVED' ? 'success' : row.predictedCode === 'ERROR' ? 'error' : 'warning'}>{row.predictedCode}</Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <ConfidenceBar value={row.confidence} />
                      <span className="font-code text-[12px] text-[rgba(248,250,252,0.6)]">{(row.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{row.latencyMs}ms</td>
                  <td className="py-3">
                    <Badge variant={row.status === 'success' ? 'success' : 'error'}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <p className="font-sans text-[13px] text-[rgba(248,250,252,0.4)]">Showing 1–20 of 1,345</p>
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
