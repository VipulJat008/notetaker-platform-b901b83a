import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck, Building2, Database, ShieldAlert, Eye, Settings,
  Download, ChevronDown, X, ShieldOff, Plus,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/ui/Badge';

/* ─── Types ─────────────────────────────────────────────── */
type TenantStatus = 'Live' | 'Inactive' | 'Suspended';

interface Tenant {
  id: string;
  displayName: string;
  activeUsers: number;
  dataVolume: string;
  status: TenantStatus;
  collections: { name: string; count: number }[];
  lastActivity: string;
  filterSample: string;
}

interface Violation {
  timestamp: string;
  requestingTenant: string;
  targetTenant: string;
  endpoint: string;
}

/* ─── Mock data ─────────────────────────────────────────── */
const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant_abc',
    displayName: 'ACME Corp',
    activeUsers: 45,
    dataVolume: '2.3 GB',
    status: 'Live',
    collections: [
      { name: 'call_notes', count: 18420 },
      { name: 'predictions', count: 9301 },
      { name: 'jobs', count: 1203 },
    ],
    lastActivity: '2026-05-23 09:44',
    filterSample: 'SELECT * FROM call_notes WHERE tenant_id = \'tenant_abc\'',
  },
  {
    id: 'tenant_xyz',
    displayName: 'Globex Ltd',
    activeUsers: 12,
    dataVolume: '0.8 GB',
    status: 'Live',
    collections: [
      { name: 'call_notes', count: 4311 },
      { name: 'predictions', count: 2100 },
      { name: 'jobs', count: 340 },
    ],
    lastActivity: '2026-05-23 08:30',
    filterSample: 'SELECT * FROM call_notes WHERE tenant_id = \'tenant_xyz\'',
  },
  {
    id: 'tenant_mno',
    displayName: 'Initech Systems',
    activeUsers: 8,
    dataVolume: '0.4 GB',
    status: 'Suspended',
    collections: [
      { name: 'call_notes', count: 1022 },
      { name: 'predictions', count: 500 },
      { name: 'jobs', count: 88 },
    ],
    lastActivity: '2026-05-20 14:00',
    filterSample: 'SELECT * FROM call_notes WHERE tenant_id = \'tenant_mno\' AND active = true',
  },
  {
    id: 'tenant_pqr',
    displayName: 'Umbrella Corp',
    activeUsers: 0,
    dataVolume: '0.1 GB',
    status: 'Inactive',
    collections: [
      { name: 'call_notes', count: 200 },
      { name: 'predictions', count: 90 },
      { name: 'jobs', count: 15 },
    ],
    lastActivity: '2026-04-01 10:00',
    filterSample: 'SELECT * FROM call_notes WHERE tenant_id = \'tenant_pqr\'',
  },
];

const MOCK_VIOLATIONS: Violation[] = [];

/* ─── Add Tenant Modal ───────────────────────────────────── */
function AddTenantModal({ onClose, onAdd }: { onClose: () => void; onAdd: (id: string, name: string) => void }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [idError, setIdError] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.match(/^[a-z0-9_]+$/)) {
      setIdError('Tenant ID must be lowercase alphanumeric with underscores only');
      return;
    }
    onAdd(id, name);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(2,6,23,0.8)', backdropFilter: 'blur(4px)' }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-tenant-title"
      onKeyDown={handleKeyDown}
    >
      <div
        className="rounded-[16px] p-6 w-full max-w-[440px] border border-[rgba(255,255,255,0.1)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 id="add-tenant-title" className="font-code text-[18px] font-bold text-[#F8FAFC]">Add New Tenant</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close add tenant modal"
            className="p-1.5 rounded text-[rgba(248,250,252,0.4)] hover:text-[#F8FAFC] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenant-id-input" className="block font-sans text-[13px] text-[rgba(248,250,252,0.6)] mb-1.5">
              Tenant ID <span className="text-[#EF4444]">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="tenant-id-input"
              type="text"
              value={id}
              onChange={e => { setId(e.target.value); setIdError(''); }}
              placeholder="e.g. tenant_newco"
              required
              aria-invalid={!!idError}
              aria-describedby={idError ? 'tenant-id-error' : undefined}
              className="w-full rounded-[8px] px-3 py-2.5 font-code text-[13px] text-[#F8FAFC] bg-[#020617] border border-[rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]"
              style={{ borderColor: idError ? '#EF4444' : undefined }}
            />
            {idError && <p id="tenant-id-error" className="font-sans text-[12px] text-[#EF4444] mt-1">{idError}</p>}
          </div>
          <div>
            <label htmlFor="tenant-name-input" className="block font-sans text-[13px] text-[rgba(248,250,252,0.6)] mb-1.5">
              Display Name <span className="text-[#EF4444]">*</span>
            </label>
            <input
              id="tenant-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. NewCo Ltd"
              required
              className="w-full rounded-[8px] px-3 py-2.5 font-sans text-[14px] text-[#F8FAFC] bg-[#020617] border border-[rgba(255,255,255,0.12)] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-[8px] bg-[#22C55E] text-white font-sans text-[14px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
            >
              Add Tenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Tenant Detail Drawer ───────────────────────────────── */
function TenantDetailDrawer({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const [queryInput, setQueryInput] = useState('');
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const runSimulatedQuery = () => {
    setQueryResult(`✓ Filter applied: tenant_id = '${tenant.id}'\n→ Returning ${tenant.collections[0].count.toLocaleString()} rows from call_notes\n→ All rows scoped to ${tenant.displayName}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(2,6,23,0.6)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div
        className="w-full max-w-[440px] h-full overflow-y-auto flex flex-col border-l border-[rgba(255,255,255,0.08)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(255,255,255,0.07)] flex-shrink-0">
          <div>
            <h2 id="drawer-title" className="font-code text-[16px] font-bold text-[#F8FAFC]">{tenant.displayName}</h2>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded font-code text-[12px] mt-1"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
              aria-label={`Tenant ID: ${tenant.id}`}
            >
              {tenant.id}
            </span>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close tenant detail drawer"
            className="p-2 rounded text-[rgba(248,250,252,0.4)] hover:text-[#F8FAFC] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          {/* Metadata */}
          <section aria-label="Tenant metadata">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Tenant Info</h3>
            <dl className="space-y-2">
              {[
                { label: 'Status', value: <Badge variant={tenant.status === 'Live' ? 'success' : tenant.status === 'Suspended' ? 'warning' : 'neutral'}>{tenant.status}</Badge> },
                { label: 'Active Users', value: <span className="font-code text-[13px] text-[#3B82F6] font-semibold">{tenant.activeUsers}</span> },
                { label: 'Data Volume', value: <span className="font-sans text-[13px] text-[rgba(248,250,252,0.6)]">{tenant.dataVolume}</span> },
                { label: 'Last Activity', value: <span className="font-sans text-[13px] text-[rgba(248,250,252,0.6)]">{tenant.lastActivity}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="font-sans text-[13px] text-[rgba(248,250,252,0.5)]">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Data breakdown */}
          <section aria-label="Per-collection data counts">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Collection Breakdown</h3>
            <div className="rounded-[8px] overflow-hidden border border-[rgba(255,255,255,0.06)]">
              {tenant.collections.map((col, i) => (
                <div
                  key={col.name}
                  className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? 'border-t border-[rgba(255,255,255,0.04)]' : ''}`}
                >
                  <span className="font-code text-[13px] text-[rgba(248,250,252,0.6)]">{col.name}</span>
                  <span className="font-code text-[13px] font-semibold text-[#22C55E]">{col.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Isolation filter sample */}
          <section aria-label="Isolation filter SQL sample">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Isolation Filter Sample</h3>
            <pre className="font-code text-[12px] text-[#22C55E] bg-[#020617] rounded-[8px] p-4 overflow-x-auto whitespace-pre-wrap">
              {tenant.filterSample}
            </pre>
          </section>

          {/* Simulate query */}
          <section aria-label="Simulate query for tenant (admin only)">
            <h3 className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Simulate Query</h3>
            <textarea
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="SELECT * FROM call_notes ..."
              rows={3}
              className="w-full font-code text-[12px] text-[#F8FAFC] bg-[#020617] rounded-[8px] p-3 border border-[rgba(255,255,255,0.08)] resize-none focus:outline-none focus-visible:ring-1 focus-visible:ring-[#22C55E] mb-2"
              aria-label="Query input for tenant filter simulation"
            />
            <button
              onClick={runSimulatedQuery}
              className="flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#22C55E] text-white font-sans text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
            >
              Verify Isolation Filter
            </button>
            {queryResult && (
              <pre className="mt-3 font-code text-[12px] text-[rgba(248,250,252,0.75)] bg-[#020617] rounded-[8px] p-3 whitespace-pre-wrap">
                {queryResult}
              </pre>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/* ─── Health Card ────────────────────────────────────────── */
function HealthCard({
  label, value, icon: Icon, color, extra, role: ariaRole = 'status',
}: {
  label: string; value: string; icon: typeof ShieldCheck; color: string;
  extra?: React.ReactNode; role?: 'status' | 'alert';
}) {
  return (
    <div
      role={ariaRole}
      aria-label={`${label}: ${value}`}
      className="rounded-[12px] p-5 border transition-all duration-[200ms]"
      style={{
        background: ariaRole === 'alert' ? 'rgba(239,68,68,0.06)' : 'var(--color-secondary)',
        borderColor: ariaRole === 'alert' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
        boxShadow: 'var(--shadow-sm)',
      }}
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

/* ─── Presentational ───────────────────────────────────── */
interface TenantDataIsolationViewProps {
  tenants: Tenant[];
  violations: Violation[];
  expandedRows: Set<string>;
  selectedTenant: Tenant | null;
  showAddModal: boolean;
  isDownloading: boolean;
  onToggleRow: (id: string) => void;
  onViewTenant: (tenant: Tenant) => void;
  onCloseDrawer: () => void;
  onAddTenant: () => void;
  onAddTenantSubmit: (id: string, name: string) => void;
  onCloseAddModal: () => void;
  onDownloadAudit: () => void;
}

function TenantDataIsolationView({
  tenants, violations, expandedRows, selectedTenant,
  showAddModal, isDownloading,
  onToggleRow, onViewTenant, onCloseDrawer, onAddTenant,
  onAddTenantSubmit, onCloseAddModal, onDownloadAudit,
}: TenantDataIsolationViewProps) {
  const violationCount = violations.length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.07)]">
        <div>
          <h1 className="font-code text-[28px] font-bold text-[#F8FAFC]">Tenant Data Isolation</h1>
          <p className="font-sans text-[14px] text-[rgba(248,250,252,0.5)] mt-1">Multi-tenant boundary enforcement and access audit</p>
        </div>
        <button
          onClick={onDownloadAudit}
          disabled={isDownloading}
          aria-label="Download isolation audit report"
          aria-busy={isDownloading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] font-sans text-[14px] font-medium text-[rgba(248,250,252,0.8)] border border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-all duration-[150ms] focus-visible:outline-[#22C55E] disabled:opacity-60"
        >
          {isDownloading
            ? <div className="w-4 h-4 border-2 border-t-transparent border-[rgba(248,250,252,0.6)] rounded-full spin" aria-hidden="true" />
            : <Download size={14} aria-hidden="true" />
          }
          Audit Report ↓
        </button>
      </div>

      {/* Isolation Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HealthCard
          label="Isolation Status" value="Enforced" icon={ShieldCheck} color="#22C55E"
          extra={<div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] pulse-green" />}
        />
        <HealthCard
          label="Active Tenants" value={String(tenants.filter(t => t.status === 'Live').length)} icon={Building2} color="#3B82F6"
        />
        <HealthCard
          label="Filtered Queries (Today)" value="45,231" icon={Database} color="#22C55E"
        />
        <HealthCard
          label="Cross-Tenant Attempts" value={String(violationCount)} icon={ShieldAlert}
          color={violationCount > 0 ? '#EF4444' : '#22C55E'}
          role={violationCount > 0 ? 'alert' : 'status'}
        />
      </div>

      {/* Tenant Registry Table */}
      <div
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)] mb-6"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Tenant Registry</h2>
          <button
            onClick={onAddTenant}
            aria-label="Add new tenant"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#22C55E] text-white font-sans text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-[200ms] focus-visible:outline-[#22C55E]"
          >
            <Plus size={14} aria-hidden="true" /> Add Tenant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" role="grid" aria-label="Tenant registry">
            <thead>
              <tr>
                {['Tenant ID', 'Display Name', 'Active Users', 'Data Volume', 'Status', 'Actions'].map(h => (
                  <th key={h} scope="col" className="text-left px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tenants.map(tenant => (
                <>
                  <tr
                    key={tenant.id}
                    className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(34,197,94,0.03)] transition-colors duration-[150ms]"
                    style={{ opacity: tenant.status === 'Suspended' ? 0.5 : 1 }}
                  >
                    <td className="px-6 py-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded font-code text-[13px] font-medium"
                        style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}
                        aria-label={`Tenant ID: ${tenant.id}`}
                      >
                        {tenant.id}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-sans text-[14px] font-medium text-[#F8FAFC] whitespace-nowrap">{tenant.displayName}</td>
                    <td className="px-6 py-3 font-code text-[14px] font-semibold text-[#3B82F6]">{tenant.activeUsers}</td>
                    <td className="px-6 py-3 font-sans text-[14px] text-[rgba(248,250,252,0.6)]">{tenant.dataVolume}</td>
                    <td className="px-6 py-3">
                      <Badge variant={tenant.status === 'Live' ? 'success' : tenant.status === 'Suspended' ? 'warning' : 'neutral'}>
                        {tenant.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewTenant(tenant)}
                          aria-label={`View data metrics for ${tenant.displayName}`}
                          className="p-1.5 rounded text-[rgba(248,250,252,0.4)] hover:text-[#22C55E] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
                        >
                          <Eye size={16} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Configure settings for ${tenant.displayName}`}
                          className="p-1.5 rounded text-[rgba(248,250,252,0.4)] hover:text-[rgba(248,250,252,0.8)] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
                        >
                          <Settings size={16} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => onToggleRow(tenant.id)}
                          aria-expanded={expandedRows.has(tenant.id)}
                          aria-controls={`tenant-${tenant.id}-details`}
                          aria-label={`${expandedRows.has(tenant.id) ? 'Collapse' : 'Expand'} data breakdown for ${tenant.displayName}`}
                          className="p-1.5 rounded text-[rgba(248,250,252,0.4)] hover:text-[rgba(248,250,252,0.8)] cursor-pointer transition-all duration-[200ms] focus-visible:outline-[#22C55E]"
                          style={{ transform: expandedRows.has(tenant.id) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <ChevronDown size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(tenant.id) && (
                    <tr id={`tenant-${tenant.id}-details`} key={`${tenant.id}-expanded`}>
                      <td colSpan={6} className="px-6 pb-4 border-t border-[rgba(255,255,255,0.04)]">
                        <div className="bg-[rgba(0,0,0,0.2)] rounded-[8px] p-4 mt-2">
                          <p className="font-sans text-[12px] uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] mb-3">Collection Breakdown</p>
                          <table className="w-full">
                            <thead>
                              <tr>
                                {['Collection', 'Record Count', 'Last Sync'].map(h => (
                                  <th key={h} scope="col" className="text-left pb-2 pr-8 font-sans text-[11px] uppercase tracking-[0.06em] text-[rgba(248,250,252,0.3)]">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tenant.collections.map(col => (
                                <tr key={col.name}>
                                  <td className="py-1.5 pr-8 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{col.name}</td>
                                  <td className="py-1.5 pr-8 font-code text-[13px] font-semibold text-[#22C55E]">{col.count.toLocaleString()}</td>
                                  <td className="py-1.5 font-sans text-[12px] text-[rgba(248,250,252,0.35)]">2026-05-23</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
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

      {/* Cross-Tenant Violation Log */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Cross-tenant access violations log"
        className="rounded-[12px] border border-[rgba(255,255,255,0.06)]"
        style={{ background: 'var(--color-secondary)', boxShadow: 'var(--shadow-md)' }}
      >
        {violationCount > 0 && (
          <div
            role="alert"
            className="mx-6 mt-4 p-3 rounded-[8px] border border-[rgba(245,158,11,0.3)] flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)' }}
          >
            <span className="font-sans text-[13px] font-medium text-[#F59E0B]">
              ⚠ Cross-tenant access attempts detected. Review immediately.
            </span>
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="font-code text-[15px] font-semibold text-[#F8FAFC]">Cross-Tenant Access Violations</h2>
          <div className="flex items-center gap-3">
            <span className="font-sans text-[12px] text-[rgba(248,250,252,0.35)]">Auto-refreshes every 60s</span>
            {violationCount > 0 && (
              <button
                aria-label="Export violation log"
                className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] font-sans text-[13px] text-[rgba(248,250,252,0.7)] border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.3)] cursor-pointer transition-colors duration-[150ms] focus-visible:outline-[#22C55E]"
              >
                <Download size={14} aria-hidden="true" /> Export
              </button>
            )}
          </div>
        </div>

        {violationCount === 0 ? (
          <div
            role="status"
            aria-label="No violations detected"
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
          >
            <ShieldCheck size={48} className="text-[#22C55E] mb-4" aria-hidden="true" />
            <p className="font-code text-[16px] font-medium text-[rgba(248,250,252,0.5)]">
              No cross-tenant violations detected in the past 30 days
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Timestamp', 'Requesting Tenant', 'Attempted Target', 'Endpoint', 'Action Taken'].map(h => (
                    <th key={h} scope="col" className="text-left px-6 py-3 font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-[rgba(248,250,252,0.45)] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {violations.map((v, i) => (
                  <tr key={i} className="border-t border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors duration-[150ms]">
                    <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.6)]">{v.timestamp}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-code text-[12px]" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E' }}>{v.requestingTenant}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded font-code text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>{v.targetTenant}</span>
                    </td>
                    <td className="px-6 py-3 font-code text-[13px] text-[rgba(248,250,252,0.7)]">{v.endpoint}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-sans text-[12px] font-semibold" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>
                        <ShieldOff size={12} aria-hidden="true" /> Blocked
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals / Drawers */}
      {showAddModal && (
        <AddTenantModal onClose={onCloseAddModal} onAdd={onAddTenantSubmit} />
      )}
      {selectedTenant && (
        <TenantDetailDrawer tenant={selectedTenant} onClose={onCloseDrawer} />
      )}
    </div>
  );
}

/* ─── Container ────────────────────────────────────────── */
export default function TenantDataIsolation() {
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [violations] = useState<Violation[]>(MOCK_VIOLATIONS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  /* Auto-refresh every 60s */
  useEffect(() => {
    const id = setInterval(() => {
      /* In production: re-fetch violations here */
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleToggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDownloadAudit = async () => {
    setIsDownloading(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsDownloading(false);
    showToast('Audit report exported.', 'success');
  };

  const handleAddTenant = (id: string, name: string) => {
    const newTenant: Tenant = {
      id,
      displayName: name,
      activeUsers: 0,
      dataVolume: '0 GB',
      status: 'Inactive',
      collections: [
        { name: 'call_notes', count: 0 },
        { name: 'predictions', count: 0 },
        { name: 'jobs', count: 0 },
      ],
      lastActivity: 'Never',
      filterSample: `SELECT * FROM call_notes WHERE tenant_id = '${id}'`,
    };
    setTenants(prev => [newTenant, ...prev]);
    showToast(`Tenant "${name}" added successfully.`, 'success');
  };

  return (
    <TenantDataIsolationView
      tenants={tenants}
      violations={violations}
      expandedRows={expandedRows}
      selectedTenant={selectedTenant}
      showAddModal={showAddModal}
      isDownloading={isDownloading}
      onToggleRow={handleToggleRow}
      onViewTenant={setSelectedTenant}
      onCloseDrawer={() => setSelectedTenant(null)}
      onAddTenant={() => setShowAddModal(true)}
      onAddTenantSubmit={handleAddTenant}
      onCloseAddModal={() => setShowAddModal(false)}
      onDownloadAudit={handleDownloadAudit}
    />
  );
}
