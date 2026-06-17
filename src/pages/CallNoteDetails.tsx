import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronRight, ArrowLeft, Share2, Sparkles, RotateCcw, AlertCircle, Copy, Loader2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';
import { SkeletonLines } from '../components/ui/SkeletonLoader';

/* ─── Mock ───────────────────────────────────────────────── */
const MOCK_NOTE = {
  orderId: 'ORD-20260522-042',
  ingestedAt: '2026-05-22 09:45',
  status: 'Processed',
  aiSummary: 'The customer contacted support regarding the current delivery status of their order. They expressed urgency as the items are required for a corporate event scheduled on 24 May 2026. The support agent confirmed the package is in transit and arranged for expedited shipping at no extra charge. Key actions: Follow-up call scheduled for 24 May. Escalation flag: None.',
  aiGeneratedAt: '2026-05-22 09:50',
  rawTimestamp: '2026-05-22T09:42:00Z',
  rawOrderIds: 'ORD-042, ORD-043',
  rawNotes: `Customer called at 09:42. Expressed concern about delayed delivery.
Order placed on 2026-05-18. Expected delivery: 2026-05-22.
Package tracked: In transit - Auckland depot.
Customer requested expedited shipping.
Agent: Arranged overnight courier upgrade. No extra charge applied.
Case ID: CASE-20260522-0042
Next step: Follow-up call on 24 May 2026.
Satisfaction survey sent via email.`,
};

/* ─── Breadcrumb ─────────────────────────────────────────── */
function Breadcrumb({ orderId, onDashboard, onNotes }: { orderId: string; onDashboard: () => void; onNotes: () => void }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 flex-wrap">
        {[
          { label: 'Dashboard', onClick: onDashboard },
          { label: 'Call Notes', onClick: onNotes },
          { label: `#${orderId}`, current: true },
        ].map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-[rgba(248,250,252,0.25)]" aria-hidden="true" />}
            {item.current ? (
              <span aria-current="page" className="font-sans text-[13px] text-[rgba(248,250,252,0.75)]">{item.label}</span>
            ) : (
              <button
                onClick={item.onClick}
                className="font-sans text-[13px] text-[rgba(248,250,252,0.45)] hover:text-[#22C55E] hover:underline cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E] rounded"
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ─── Presentational ───────────────────────────────────── */
interface CallNoteDetailsViewProps {
  orderId: string;
  isAdmin: boolean;
  summaryStatus: 'loading' | 'ready' | 'error';
  isRegenerating: boolean;
  isCopied: boolean;
  onBack: () => void;
  onShare: () => void;
  onRegenerate: () => void;
  onCopy: () => void;
  onDashboard: () => void;
  onNotes: () => void;
}

function CallNoteDetailsView({
  orderId, isAdmin, summaryStatus, isRegenerating, isCopied,
  onBack, onShare, onRegenerate, onCopy, onDashboard, onNotes,
}: CallNoteDetailsViewProps) {
  return (
    <div className="max-w-[900px] mx-auto">
      <Breadcrumb orderId={orderId} onDashboard={onDashboard} onNotes={onNotes} />

      {/* Page Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-code text-[26px] font-bold text-[#F8FAFC]">Call Note: {orderId}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)]">Ingested: {MOCK_NOTE.ingestedAt}</p>
            <span className="text-[rgba(248,250,252,0.25)]">·</span>
            <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)]">Status:</p>
            <Badge variant="success">{MOCK_NOTE.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBack}
            aria-label="Go back to Call Notes list"
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] font-sans text-[14px] text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[#22C55E] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <ArrowLeft size={16} aria-hidden="true" /> Back to Call Notes
          </button>
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] font-sans text-[14px] text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
            aria-label="Copy link to this call note"
          >
            <Share2 size={16} aria-hidden="true" /> Share
          </button>
        </div>
      </div>

      {/* AI Summary Card */}
      <section
        role="region"
        aria-label="AI-generated summary"
        className="rounded-[12px] p-6 border mb-6"
        style={{
          background: 'var(--color-secondary)',
          borderColor: 'rgba(34,197,94,0.2)',
          borderLeftWidth: '4px',
          borderLeftColor: '#22C55E',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Card header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#22C55E]" aria-hidden="true" />
            <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">AI Summary</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[rgba(34,197,94,0.15)] font-sans text-[11px] text-[#22C55E]">
              Azure OpenAI
            </span>
          </div>
          {summaryStatus === 'ready' && (
            <p className="font-sans text-[12px] text-[rgba(248,250,252,0.4)]">Generated {MOCK_NOTE.aiGeneratedAt}</p>
          )}
        </div>

        {/* Summary body */}
        {summaryStatus === 'loading' && (
          <div role="status" aria-live="polite">
            <SkeletonLines lines={3} widths={['w-4/5', 'w-full', 'w-3/5']} />
            <p className="font-sans text-[13px] text-[rgba(248,250,252,0.45)] mt-3 animate-pulse">AI summary is being generated…</p>
          </div>
        )}

        {summaryStatus === 'ready' && (
          <p
            className="font-sans text-[15px] text-[#F8FAFC] leading-[1.7] max-w-[70ch]"
            style={{ borderLeft: '3px solid rgba(34,197,94,0.3)', paddingLeft: '16px' }}
          >
            {MOCK_NOTE.aiSummary}
          </p>
        )}

        {summaryStatus === 'error' && (
          <div
            role="alert"
            className="flex items-start gap-3 p-4 rounded-[8px] border border-[rgba(239,68,68,0.2)]"
            style={{ background: 'rgba(239,68,68,0.06)' }}
          >
            <AlertCircle size={20} className="text-[#EF4444] flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-sans text-[15px] font-semibold text-[rgba(248,250,252,0.8)] mb-1">Summary unavailable</p>
              <p className="font-sans text-[14px] text-[rgba(248,250,252,0.55)]">The AI summarisation service is currently unavailable. Raw notes are displayed below.</p>
              <button
                className="mt-3 flex items-center gap-1 font-sans text-[13px] text-[#22C55E] hover:underline cursor-pointer focus-visible:outline-[#22C55E] rounded"
                aria-label="Retry generating AI summary"
              >
                <RotateCcw size={12} aria-hidden="true" /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Regenerate button — admin only */}
        {isAdmin && summaryStatus === 'ready' && (
          <div className="flex justify-end mt-4">
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              aria-label="Regenerate AI summary for this call note"
              aria-busy={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] font-sans text-[13px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[#22C55E] hover:bg-[rgba(34,197,94,0.06)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
            >
              {isRegenerating ? <Loader2 size={14} className="spin" aria-hidden="true" /> : <RotateCcw size={14} aria-hidden="true" />}
              {isRegenerating ? 'Generating…' : 'Regenerate'}
            </button>
          </div>
        )}
      </section>

      {/* Raw Call Note Card */}
      <section
        role="region"
        aria-label="Raw call note text"
        className="rounded-[12px] p-6 border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-[14px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.5)]">
            Raw Call Note
          </h2>
          <button
            onClick={onCopy}
            aria-label={isCopied ? 'Copied!' : 'Copy raw call note text'}
            className="flex items-center gap-1.5 text-[rgba(248,250,252,0.5)] hover:text-[#F8FAFC] transition-colors duration-[150ms] cursor-pointer p-1.5 rounded focus-visible:outline-[#22C55E]"
          >
            <Copy size={14} aria-hidden="true" />
            <span className="font-sans text-[12px]">{isCopied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { label: 'Timestamp:', value: MOCK_NOTE.rawTimestamp },
            { label: 'Order IDs:', value: MOCK_NOTE.rawOrderIds },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="font-code text-[13px] text-[rgba(248,250,252,0.45)]">{label}</span>
              <span className="font-code text-[13px] text-[#22C55E]">{value}</span>
            </div>
          ))}
        </div>

        <pre
          className="font-code text-[14px] text-[rgba(248,250,252,0.75)] leading-[1.6] bg-[#020617] rounded-[8px] p-4 overflow-y-auto whitespace-pre-wrap"
          style={{ maxHeight: '320px' }}
          tabIndex={0}
          aria-label="Raw call note content"
        >
          {MOCK_NOTE.rawNotes}
        </pre>
      </section>
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function CallNoteDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [summaryStatus] = useState<'loading' | 'ready' | 'error'>('ready');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isAdmin = user?.role === 'admin';
  const orderId = id ?? MOCK_NOTE.orderId;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied to clipboard.', 'success');
    }).catch(() => showToast('Could not copy link.', 'error'));
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      showToast('AI summary regenerated.', 'success');
    } catch {
      showToast('Regeneration failed. AI service may be unavailable.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(MOCK_NOTE.rawNotes).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(() => showToast('Could not copy text.', 'error'));
  };

  return (
    <CallNoteDetailsView
      orderId={orderId}
      isAdmin={isAdmin}
      summaryStatus={summaryStatus}
      isRegenerating={isRegenerating}
      isCopied={isCopied}
      onBack={() => navigate('/call-notes')}
      onShare={handleShare}
      onRegenerate={handleRegenerate}
      onCopy={handleCopy}
      onDashboard={() => navigate('/dashboard')}
      onNotes={() => navigate('/call-notes')}
    />
  );
}
