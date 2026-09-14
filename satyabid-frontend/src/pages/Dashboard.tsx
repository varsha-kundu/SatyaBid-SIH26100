import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { apiClient } from '../services/api/apiClient';
import { sessionStore } from '../services/sessionStore';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import {
  Card, CardHeader, StatBox, InlineError, Loader, EmptyState, StatusBadge, RiskBadge,
} from '../components/common/UI';
/* ─── Chart colours ─── */
const RISK_COLORS: Record<string, string> = {
  LOW:     '#15803D',
  MEDIUM:  '#B45309',
  HIGH:    '#B91C1C',
  CRITICAL:'#7F1D1D',
};
const STATUS_COLORS: Record<string, string> = {
  PASS:     '#15803D',
  WARNING:  '#B45309',
  FAIL:     '#B91C1C',
  CRITICAL: '#7F1D1D',
};

/* ─── Sample requirement matrix — illustrates paper's Table A2 ─── */
const SAMPLE_MATRIX = [
  { req: 'GST registration',    source: 'GST certificate / API',  status: 'PASS',     conf: '98%', evidence: 'Page 1' },
  { req: 'Udyam status',        source: 'Udyam record',           status: 'WARNING',  conf: '72%', evidence: 'Portal + Page 2' },
  { req: 'OEM authorization',   source: 'Uploaded letter',        status: 'CRITICAL', conf: '99%', evidence: 'None' },
  { req: 'Local content',       source: 'Declaration',            status: 'WARNING',  conf: '61%', evidence: 'Page 4' },
];

/* ─── Quick-start steps ─── */
const FLOW_STEPS = [
  { n: 1, label: 'Select tender',      link: '/app/tenders',          done: true  },
  { n: 2, label: 'View requirements',  link: '/app/tenders',          done: true  },
  { n: 3, label: 'Upload bid docs',    link: '/app/bid-verification',  done: false },
  { n: 4, label: 'Run verification',   link: '/app/bid-verification',  done: false },
  { n: 5, label: 'Review findings',    link: '/app/human-review',      done: false },
  { n: 6, label: 'Record decision',    link: '/app/human-review',      done: false },
  { n: 7, label: 'Audit & report',     link: '/app/audit-trail',       done: false },
];

export function Dashboard() {
  const { user } = useAuth();
  const vendors = useApi<{ count: number; vendors: unknown[] }>(
    () => apiClient.vendors() as Promise<{ count: number; vendors: unknown[] }>,
    [],
  );
  const tenders = useApi<unknown>(
    () => apiClient.tenderRequirements() as Promise<unknown>,
    [],
  );
  const events = useMemo(() => sessionStore.list(), []);

  /* Stats */
  const verifiedCount  = events.length;
  const pendingReview  = events.filter((e) => ['HIGH','CRITICAL'].includes(String(e.result.risk_level || '').toUpperCase())).length;
  const compliantCount = events.filter((e) => typeof e.result.compliance_score === 'number' && e.result.compliance_score >= 80).length;
  const vendorCount    = vendors.data?.count ?? (Array.isArray(vendors.data) ? (vendors.data as unknown[]).length : null);
  const tenderCount    = Array.isArray(tenders.data) ? tenders.data.length : tenders.data ? 1 : null;

  /* Charts */
  const riskData = useMemo(() => {
    if (!events.length) return null;
    const counts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    for (const e of events) {
      const k = String(e.result.risk_level || 'HIGH').toUpperCase();
      counts[k] = (counts[k] || 0) + 1;
    }
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [events]);

  const scoreData = useMemo(
    () =>
      events.slice(0, 8).map((e, i) => ({
        name: e.sourceFile.replace('bid_form_', '').replace('.pdf', '').replace(/_2026.*$/, '').replace(/_/g, ' '),
        score: typeof e.result.compliance_score === 'number' ? e.result.compliance_score : 0,
      })),
    [events],
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      {user && (
        <div className="rounded-lg border border-saffron-500/20 bg-saffron-50/40 px-5 py-4 dark:bg-saffron-500/5 dark:border-saffron-500/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink-heading dark:text-slate-100">
                Welcome, <span className="text-saffron-600 dark:text-saffron-400">{user.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-secondary dark:text-slate-400 capitalize">
                {user.role === 'officer' ? 'Procurement Officer · GeM Bid Compliance Platform' : `${user.role} · SatyaBid`}
              </p>
            </div>
            <Link
              to="/app/bid-verification"
              className="inline-flex items-center gap-2 rounded-md bg-saffron-500 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-600 transition-colors"
            >
              Start verification →
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatBox label="Registered vendors"    value={vendors.loading ? '…' : vendorCount ?? '—'} icon="⌂" hint="Synthetic demo dataset" />
        <StatBox label="Active tenders"        value={tenders.loading ? '…' : tenderCount ?? '—'} icon="≡" hint="From /tender-requirements" />
        <StatBox label="Verified bids"         value={verifiedCount} tone={verifiedCount > 0 ? 'good' : 'neutral'} icon="✓" hint="This session" />
        <StatBox label="Pending review"        value={pendingReview} tone={pendingReview > 0 ? 'warn' : 'neutral'} icon="◎" hint="High / critical risk" />
        <StatBox label="Compliant bids"        value={compliantCount} tone={compliantCount > 0 ? 'good' : 'neutral'} icon="◈" hint="Score ≥ 80" />
        <StatBox label="High risk"             value={pendingReview}  tone={pendingReview > 0 ? 'bad' : 'neutral'}  icon="⚠" hint="Officer review needed" />
      </div>

      {vendors.error && <InlineError message={vendors.error} />}

      {/* Demo flow pipeline — always shown */}
      <Card>
        <CardHeader
          title="Verification workflow"
          subtitle="Follow this sequence for a complete SIH demo · CPCL-TENDER-2026-089"
        />
        <div className="overflow-x-auto px-5 py-5">
          <ol className="flex min-w-[640px] items-center gap-0">
            {FLOW_STEPS.map((step, i) => (
              <React.Fragment key={step.n}>
                <li className="flex flex-col items-center gap-2 text-center">
                  <Link to={step.link}>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all hover:scale-105 ${
                      step.done
                        ? 'border-status-verified bg-status-verified text-white'
                        : 'border-saffron-500 bg-saffron-50 text-saffron-700 dark:bg-saffron-500/15 dark:text-saffron-300 hover:bg-saffron-100'
                    }`}>
                      {step.done ? '✓' : step.n}
                    </span>
                  </Link>
                  <span className="text-[11px] font-medium text-ink-secondary dark:text-slate-400 max-w-[80px] leading-tight">
                    {step.label}
                  </span>
                </li>
                {i < FLOW_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 min-w-[24px] ${step.done ? 'bg-status-verified' : 'bg-line dark:bg-[#1e2d47]'}`} />
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line px-5 py-3 dark:border-[#1e2d47]">
          <Link to="/app/tenders" className="rounded-md border border-line bg-surface-secondary px-4 py-2 text-xs font-medium text-ink-secondary hover:bg-surface-card hover:text-ink-heading transition-colors dark:border-[#1e2d47] dark:bg-[#0a1628] dark:text-slate-400">
            View NIT requirements →
          </Link>
          <Link to="/app/bid-verification" className="rounded-md bg-saffron-500 px-4 py-2 text-xs font-semibold text-white hover:bg-saffron-600 transition-colors">
            Run bid verification →
          </Link>
        </div>
      </Card>

      {/* Charts — appear after verifications; sample matrix always shown */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Sample requirement matrix (from research paper Table A2) */}
        <Card>
          <CardHeader
            title="Sample requirement matrix"
            subtitle="Illustrative result — run verification to generate a real matrix"
          />
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Confidence</th>
                  <th className="hidden sm:table-cell">Evidence</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE_MATRIX.map((row) => (
                  <tr key={row.req}>
                    <td className="font-medium text-ink-heading dark:text-slate-100 text-sm">{row.req}</td>
                    <td className="text-xs text-ink-secondary dark:text-slate-400">{row.source}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td className="hidden text-xs text-ink-secondary dark:text-slate-400 sm:table-cell">{row.conf}</td>
                    <td className="hidden text-xs text-ink-muted dark:text-slate-500 sm:table-cell">{row.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-2.5 text-xs text-ink-muted dark:border-[#1e2d47] dark:text-slate-600">
            Synthetic prototype data · from research paper Table A2
          </p>
        </Card>

        {/* Activity or CTA */}
        {events.length > 0 ? (
          <Card>
            <CardHeader
              title="Recent verification activity"
              subtitle="Verification results from this session"
              action={<Link to="/app/reports" className="text-xs font-medium text-saffron-600 hover:underline">View reports →</Link>}
            />
            <div className="p-5">
              <ul className="divide-y divide-navy-900/5 dark:divide-white/5">
                {events.slice(0, 6).map((e) => {
                  const score = typeof e.result.compliance_score === 'number' ? e.result.compliance_score : null;
                  const risk  = String(e.result.risk_level || 'UNKNOWN').toUpperCase();
                  const riskColor = risk === 'LOW' ? 'text-status-verified' : risk === 'MEDIUM' ? 'text-status-review' : 'text-status-fail';
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-heading dark:text-slate-100">{e.sourceFile}</p>
                        <p className="text-xs text-ink-muted dark:text-slate-500">{new Date(e.timestamp).toLocaleTimeString()}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {score !== null && <span className="text-sm font-bold text-ink-heading dark:text-slate-100">{score}%</span>}
                        <span className={`text-xs font-semibold ${riskColor}`}>{risk}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Compliance analytics" subtitle="Charts appear after you run verifications" />
            <div className="p-5">
              <EmptyState
                icon="▤"
                title="No session data yet"
                body="Run a verification on any demo bid. Results appear here and in Reports / Audit Trail."
              />
              <div className="mt-4 flex justify-center">
                <Link to="/app/bid-verification" className="inline-flex items-center gap-2 rounded-md bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-saffron-600 transition-colors">
                  Start bid verification →
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Session charts (only when there's data) */}
      {events.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {/* Bar chart */}
          <Card className="xl:col-span-2">
            <CardHeader title="Compliance scores" subtitle="Session verification runs" />
            <div className="p-5">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: unknown) => [`${v as number}%`, 'Score']} contentStyle={{ fontSize: 12 }} />
                  <Bar dataKey="score" radius={[3, 3, 0, 0]}>
                    {scoreData.map((entry, i) => (
                      <Cell key={i} fill={entry.score >= 80 ? '#15803D' : entry.score >= 50 ? '#B45309' : '#B91C1C'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Risk pie */}
          {riskData && (
            <Card>
              <CardHeader title="Risk distribution" subtitle="Across session bids" />
              <div className="flex items-center justify-center p-5">
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={46} outerRadius={70} paddingAngle={3} dataKey="value">
                      {riskData.map((entry) => (
                        <Cell key={entry.name} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown, name?: string | number) => [v as number, String(name || '') + ' risk']} contentStyle={{ fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Registered vendors */}
      <Card>
        <CardHeader
          title="Registered demo vendors"
          subtitle="Synthetic dataset — 6 vendors with different compliance profiles"
          action={<Link to="/app/vendors" className="text-xs font-medium text-saffron-600 hover:underline">View details →</Link>}
        />
        <div className="p-5">
          {vendors.loading && <Loader label="Loading vendors…" />}
          {!vendors.loading && !vendors.error && (() => {
            const list: unknown[] = Array.isArray(vendors.data)
              ? vendors.data as unknown[]
              : Array.isArray((vendors.data as any)?.vendors)
              ? (vendors.data as any).vendors
              : [];
            return list.length === 0 ? (
              <EmptyState title="Backend offline" body="Start the Flask backend at http://127.0.0.1:8000 to load demo data." />
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((v, i) => (
                  <li key={i} className="rounded-md border border-line bg-surface-secondary px-3 py-2.5 text-xs text-ink-secondary dark:border-[#1e2d47] dark:bg-[#0a1628] dark:text-slate-400">
                    {typeof v === 'string' ? v : JSON.stringify(v).slice(0, 60)}
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      </Card>
    </div>
  );
}

// Loader imported from UI above
