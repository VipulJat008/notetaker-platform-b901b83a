import { useState, useId } from 'react';
import { ShieldCheck, Key, ShieldX, ScanSearch, AlertTriangle, Download, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { SkeletonTableRows } from '../components/ui/SkeletonLoader';

/* ─── Mock data ─────────────────────────────────────────── */
const MOCK_REJECTIONS = [
  { time: '09:45:12', userIp: '192.168.1.42', reason: 'Missing Tenant Claim', tenantPresent: false, excerpt: 'eyJhbGci…[redacted]' },
  { time: '09:32:05', userIp: 'user@acme.com', reason: 'Token Expired',        tenantPresent: true,  excerpt: 'eyJhbGci…[redacted]' },
  { time: '08:15:44', userIp: '10.0.0.18',    reason: 'Invalid Signature',    tenantPresent: true,  excerpt: 'eyJhbGci…[redacted]' },
];

/* ─── Metric Card ────────────────────────────────────────── */
function MetricCard({ label, value, icon: Icon, color, pulse }: {
  label: string; value: string; icon: typeof ShieldCheck; color: string; pulse?: boolean;
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
      <div className="flex items-center gap-2">
        <p className="font-code text-[26px] font-bold leading-none" style={{ color }}>{value}</p>
        {pulse && <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] pulse-green" />}
      </div>
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function TenantAuthMiddleware() {
  const { showToast } = useToast();

  const [claimKey, setClaimKey]       = useState('tenant_id');
  const [issuer, setIssuer]           = useState('https://keycloak.company.com/realms/app');
  const [algorithm, setAlgorithm]     = useState('RS256');
  const [clockSkew, setClockSkew]     = useState('30s');
  const [hasUnsaved, setHasUnsaved]   = useState(false);
  const [isSaving, setIsSaving]       = useState(false);
  const [jwtInput, setJwtInput]       = useState('');
  const [decodeResult, setDecodeResult] = useState<Array<{ label: string; ok: boolean }> | null>(null);
  const [isDecoding, setIsDecoding]   = useState(false);
  const [isLoading] = useState(false);

  const claimKeyId  = useId();
  const issuerId    = useId();
  const algoId      = useId();
  const skewId      = useId();
  const jwtInputId  = useId();

  const markDirty = () => setHasUnsaved(true);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setHasUnsaved(false);
      showToast('Configuration saved — active for new requests.', 'success');
    } catch {
      showToast('Failed to save configuration.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDecode = async () => {
    if (!jwtInput.trim()) return;
    setIsDecoding(true);
    setDecodeResult(null);
    await new Promise(r => setTimeout(r, 600));
    setDecodeResult([
      { label: 'Tenant ID: "tenant_abc"', ok: true },
      { label: 'Expiry: valid',           ok: true },
      { label: 'Issuer: matches',         ok: true },
    ]);
    setIsDecoding(false);
  };

  const rejectionVariant = (reason: string) => {
    if (reason === 'Token Expired') return 'warning';
    return 'error';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">
            Tenant Authentication Config
            {hasUnsaved && (
              <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.15)] font-sans text-[12px] font-medium text-[#F59E0B]">
                Unsaved changes
              </span>
            )}
          </h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">JWT middleware status and tenant claim extraction settings</p>
        </div>
        <button
          onClick={() => document.getElementById('token-debugger')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
        >
          <ScanSearch size={16} aria-hidden="true" /> Test Token
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricCard label="Middleware Status"            value="Active"  icon={ShieldCheck} color="#22C55E" pulse />
        <MetricCard label="Valid Tokens (Last Hour)"    value="1,234"   icon={Key}         color="#3B82F6" />
        <MetricCard label="Rejected Tokens (Last Hour)" value="3"       icon={ShieldX}     color="#EF4444" />
      </div>

      {/* JWT Config Form */}
      <form
        aria-label="JWT middleware configuration"
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        onSubmit={e => { e.preventDefault(); handleSave(); }}
      >
        <h2 className="font-code text-[16px] font-semibold text-[#F8FAFC] mb-4">JWT Claim Settings</h2>

        {/* Warning */}
        <div
          role="alert"
          className="flex items-start gap-3 p-3 rounded-[8px] border border-[rgba(245,158,11,0.3)] mb-5"
          style={{ background: 'rgba(245,158,11,0.1)' }}
        >
          <AlertTriangle size={16} className="text-[#F59E0B] flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="font-sans text-[13px] text-[rgba(248,250,252,0.8)]">Changes affect all active sessions. Save with caution.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Claim Key */}
          <div>
            <label htmlFor={claimKeyId} className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1">Tenant Claim Key</label>
            <input
              id={claimKeyId}
              type="text"
              value={claimKey}
              onChange={e => { setClaimKey(e.target.value); markDirty(); }}
              className="w-full px-4 py-2.5 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,42,0.8)] focus:outline-none focus:border-[#22C55E] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] transition-all duration-[200ms]"
            />
          </div>

          {/* Issuer */}
          <div>
            <label htmlFor={issuerId} className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1">JWT Issuer (iss)</label>
            <input
              id={issuerId}
              type="text"
              value={issuer}
              onChange={e => { setIssuer(e.target.value); markDirty(); }}
              className="w-full px-4 py-2.5 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,42,0.8)] focus:outline-none focus:border-[#22C55E] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.2)] transition-all duration-[200ms]"
            />
          </div>

          {/* Algorithm */}
          <div>
            <label htmlFor={algoId} className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1">Signing Algorithm</label>
            <select
              id={algoId}
              value={algorithm}
              onChange={e => { setAlgorithm(e.target.value); markDirty(); }}
              className="w-full px-4 py-2.5 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,42,0.8)] focus:outline-none focus:border-[#22C55E] transition-all duration-[200ms] cursor-pointer"
            >
              {['RS256', 'HS256', 'ES256'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Clock Skew */}
          <div>
            <label htmlFor={skewId} className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-1">Clock Skew Tolerance</label>
            <select
              id={skewId}
              value={clockSkew}
              onChange={e => { setClockSkew(e.target.value); markDirty(); }}
              className="w-full px-4 py-2.5 rounded-[8px] font-sans text-[15px] text-[#F8FAFC] border border-[rgba(255,255,255,0.12)] bg-[rgba(15,23,42,0.8)] focus:outline-none focus:border-[#22C55E] transition-all duration-[200ms] cursor-pointer"
            >
              {['0s', '15s', '30s', '60s'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSaving || !hasUnsaved}
            aria-label="Save JWT configuration settings"
            aria-busy={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-[#22C55E]"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
            {isSaving ? 'Saving…' : 'Save Configuration'}
          </button>
          <button
            type="button"
            onClick={() => { setClaimKey('tenant_id'); setIssuer('https://keycloak.company.com/realms/app'); setAlgorithm('RS256'); setClockSkew('30s'); setHasUnsaved(false); }}
            className="font-sans text-[13px] text-[rgba(248,250,252,0.4)] hover:text-[#22C55E] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded"
          >
            Reset to Default
          </button>
        </div>
      </form>

      {/* Rejection Log */}
      <div
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
        role="log"
        aria-live="polite"
        aria-label="Token rejection log"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Token Rejection Log</h2>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
            aria-label="Export rejection log"
          >
            <Download size={14} aria-hidden="true" /> Export Log
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="grid">
            <thead>
              <tr>
                {['Request Time', 'User / IP', 'Rejection Reason', 'Tenant Claim', 'Token Excerpt'].map(h => (
                  <th key={h} scope="col" className="text-left pb-3 pr-4 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <SkeletonTableRows rows={3} cols={5} /> : MOCK_REJECTIONS.map((r, i) => (
                <tr key={i} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                  <td className="py-3 pr-4 font-code text-[13px] text-[rgba(248,250,252,0.6)] whitespace-nowrap">{r.time}</td>
                  <td className="py-3 pr-4 font-sans text-[14px] text-[#F8FAFC]">{r.userIp}</td>
                  <td className="py-3 pr-4"><Badge variant={rejectionVariant(r.reason)}>{r.reason}</Badge></td>
                  <td className="py-3 pr-4"><Badge variant={r.tenantPresent ? 'success' : 'error'}>{r.tenantPresent ? 'Present' : 'Missing'}</Badge></td>
                  <td className="py-3 font-code text-[12px] text-[rgba(248,250,252,0.4)]">{r.excerpt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Token Debugger */}
      <div
        id="token-debugger"
        className="rounded-[12px] p-6 border border-[rgba(34,197,94,0.15)] border-t-[2px]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-sans text-[15px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.5)] mb-4">Token Debugger</h2>
        <label htmlFor={jwtInputId} className="block font-sans text-[13px] font-medium text-[rgba(248,250,252,0.7)] mb-2">Paste JWT token</label>
        <textarea
          id={jwtInputId}
          value={jwtInput}
          onChange={e => setJwtInput(e.target.value)}
          rows={4}
          placeholder="Paste JWT token here…"
          spellCheck={false}
          aria-label="Paste JWT token for debugging"
          className="w-full font-code text-[13px] text-[#F8FAFC] bg-[#020617] rounded-[8px] p-4 border border-[rgba(255,255,255,0.1)] focus:outline-none focus:border-[#22C55E] transition-all duration-[200ms] resize-none mb-3"
        />
        <button
          onClick={handleDecode}
          disabled={isDecoding || !jwtInput.trim()}
          aria-busy={isDecoding}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-[#22C55E] mb-4"
        >
          {isDecoding ? <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full spin" aria-hidden="true" /> : <ScanSearch size={14} aria-hidden="true" />}
          {isDecoding ? 'Decoding…' : 'Decode & Validate'}
        </button>

        {decodeResult && (
          <div aria-live="polite">
            <div className="space-y-2 mb-3">
              {decodeResult.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`font-sans text-[14px] ${r.ok ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {r.ok ? '✓' : '✗'}
                  </span>
                  <span className="font-code text-[13px] text-[rgba(248,250,252,0.8)]">{r.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="font-sans text-[11px] text-[rgba(248,250,252,0.3)]">
          Token content is decoded client-side only and never sent to server.
        </p>
      </div>
    </div>
  );
}
