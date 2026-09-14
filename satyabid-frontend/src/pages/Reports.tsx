import React, { useState } from 'react';
import { sessionStore } from '../services/sessionStore';
import {
  Card, CardHeader, StatusBadge, RiskBadge, EmptyState, Button, InlineSuccess,
} from '../components/common/UI';
import { RequirementMatrix } from '../components/compliance/RequirementMatrix';
import { GapsPanel } from '../components/compliance/GapsPanel';
import { checksOf } from '../utils/complianceUi';

/* ── Print styles injected once into <head> ── */
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden !important; }
  #satyabid-print-report, #satyabid-print-report * { visibility: visible !important; }
  #satyabid-print-report { position: fixed; inset: 0; padding: 32px; font-size: 12px; }
  .no-print { display: none !important; }
  .print-break { page-break-before: always; }
  table { font-size: 11px; }
  thead th { background: #f1f5f9 !important; color: #0f172a !important; }
}
`;

function injectPrintStyle() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('sb-print-style')) return;
  const s = document.createElement('style');
  s.id = 'sb-print-style';
  s.textContent = PRINT_STYLE;
  document.head.appendChild(s);
}

type ReportTab = 'summary' | 'matrix' | 'gaps';
type OfficerDecision = 'accepted' | 'overridden' | null;

interface DecisionRecord {
  decision: OfficerDecision;
  reason: string;
  timestamp: string;
}

export function Reports() {
  injectPrintStyle();

  const [events] = useState(() => sessionStore.list());
  const [openId, setOpenId] = useState<string | null>(events[0]?.id ?? null);
  const [tab, setTab] = useState<ReportTab>('summary');

  /* Officer decision state */
  const [decisions, setDecisions] = useState<Record<string, DecisionRecord>>({});
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const open    = events.find((e) => e.id === openId);
  const checks  = open ? checksOf(open.result) : [];

  // Extract typed values from open.result before JSX (avoids index-signature `unknown` in JSX)
  const openRecommendation: string = open && typeof open.result.recommendation === 'string'
    ? open.result.recommendation : 'No recommendation returned by backend.';
  const openIntegrityHash: string | null = open && typeof open.result.integrity_hash === 'string'
    ? open.result.integrity_hash : null;
  const myDec   = openId ? decisions[openId] : undefined;

  const gapCount = checks.filter((c) => {
    const s = String(c.status || '').toUpperCase();
    return ['FAIL','CRITICAL','WARNING','MISSING','EXPIRED','INCONSISTENT'].includes(s)
      || String(c.status).toLowerCase().includes('review');
  }).length;

  const handleAccept = () => {
    if (!openId) return;
    const rec: DecisionRecord = { decision: 'accepted', reason: '', timestamp: new Date().toISOString() };
    setDecisions((d) => ({ ...d, [openId]: rec }));
    setShowOverrideForm(false);
    setJustSaved('AI recommendation accepted and recorded.');
    setTimeout(() => setJustSaved(null), 4000);
  };

  const handleOverride = () => {
    if (!openId || !overrideReason.trim()) return;
    const rec: DecisionRecord = { decision: 'overridden', reason: overrideReason.trim(), timestamp: new Date().toISOString() };
    setDecisions((d) => ({ ...d, [openId]: rec }));
    setShowOverrideForm(false);
    setOverrideReason('');
    setJustSaved('Decision override recorded with justification.');
    setTimeout(() => setJustSaved(null), 4000);
  };

  const printReport = () => window.print();

  const downloadJson = () => {
    if (!open) return;
    const payload = { ...open, officerDecision: myDec ?? null };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `satyabid-report-${open.sourceFile.replace('.pdf','')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      {/* ── Sidebar list ── */}
      <Card className="no-print h-fit">
        <CardHeader title="Reports" subtitle="One per verification this session" />
        <div className="p-2">
          {events.length === 0 ? (
            <p className="p-3 text-sm text-ink-muted dark:text-slate-500">No reports yet — run a verification first.</p>
          ) : (
            events.map((e) => {
              const score  = typeof e.result.compliance_score === 'number' ? e.result.compliance_score : null;
              const isOpen = openId === e.id;
              const dec    = decisions[e.id];
              return (
                <button
                  key={e.id}
                  onClick={() => { setOpenId(e.id); setTab('summary'); setShowOverrideForm(false); }}
                  className={`block w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
                    isOpen ? 'bg-navy-900 text-white' : 'hover:bg-surface-secondary dark:hover:bg-[#142038]'
                  }`}
                >
                  <p className="truncate font-medium">{e.sourceFile}</p>
                  <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${isOpen ? 'text-white/60' : 'text-ink-muted dark:text-slate-500'}`}>
                    {score !== null && <span>{score}%</span>}
                    {dec && <span className={dec.decision === 'accepted' ? 'text-status-verified' : 'text-status-review'}>
                      · {dec.decision === 'accepted' ? '✓ Accepted' : '⚠ Overridden'}
                    </span>}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </Card>

      {/* ── Report panel ── */}
      {!open ? (
        <Card>
          <div className="p-5">
            <EmptyState icon="▧" title="No report selected" body="Run a verification on the Bid Verification page to generate a report, then select it here." />
          </div>
        </Card>
      ) : (
        <div id="satyabid-print-report" className="space-y-4">
          {/* Print header (hidden on screen) */}
          <div className="hidden print:block mb-4">
            <p className="text-2xl font-bold">SatyaBid — Compliance Report</p>
            <p className="text-sm text-gray-600">Synthetic prototype — all verification data is illustrative only</p>
            <hr className="my-2"/>
          </div>

          {justSaved && <InlineSuccess message={justSaved} />}

          {/* Score + action header */}
          <Card>
            <CardHeader
              title="Compliance report"
              subtitle={open.sourceFile}
              action={
                <div className="no-print flex gap-2">
                  <Button variant="ghost" size="sm" onClick={printReport}>Print / PDF</Button>
                  <Button size="sm" onClick={downloadJson}>Download JSON</Button>
                </div>
              }
            />
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-4 border-b border-line dark:border-[#1e2d47]">
              <InfoCell label="Compliance score" value={
                typeof open.result.compliance_score === 'number' ? `${open.result.compliance_score}%` : '—'
              } />
              <InfoCell label="Risk level" value={<RiskBadge level={String(open.result.risk_level || '')} />} />
              <InfoCell label="Overall status" value={<StatusBadge status={String(open.result.overall_status || '')} />} />
              <InfoCell label="Generated" value={new Date(open.timestamp).toLocaleString()} />
            </div>

            {/* Tabs */}
            <div className="no-print flex gap-1 border-b border-line px-5 pt-3 dark:border-[#1e2d47]">
              {(['summary','matrix','gaps'] as ReportTab[]).map((t) => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  className={`pb-3 pt-1 px-3 text-sm font-medium transition-colors ${
                    tab === t
                      ? 'border-b-2 border-saffron-500 text-ink-heading dark:text-slate-100'
                      : 'text-ink-secondary hover:text-ink-heading dark:text-slate-400 dark:hover:text-slate-200'
                  }`}>
                  {t === 'matrix' ? 'Requirement matrix' : t === 'gaps' ? `Gaps & issues${gapCount > 0 ? ` (${gapCount})` : ''}` : 'Summary'}
                </button>
              ))}
            </div>

            <div className="p-5">
              {tab === 'summary' && (
                <div className="space-y-4">
                  {/* AI Recommendation */}
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">AI Recommendation</p>
                    <div className="rounded-md border border-line bg-surface-secondary px-4 py-3 dark:border-[#1e2d47] dark:bg-[#0a1628]">
                      <p className="text-sm leading-relaxed text-ink-secondary dark:text-slate-400">
                        {openRecommendation}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-muted dark:text-slate-600">
                      AI-assisted recommendation. Final qualification/disqualification rests with the Procurement Officer.
                    </p>
                  </div>

                  {/* Check summary pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { k:'PASS',    label:'Pass',    cls:'bg-status-verified/10 text-status-verified' },
                      { k:'FAIL',    label:'Fail',    cls:'bg-status-fail/10 text-status-fail' },
                      { k:'CRITICAL',label:'Critical',cls:'bg-status-fail text-white' },
                      { k:'WARNING', label:'Warning', cls:'bg-status-review/10 text-status-review' },
                      { k:'INFO',    label:'Info',    cls:'bg-status-info/10 text-status-info' },
                    ].map(({ k, label, cls }) => {
                      const count = checks.filter((c) => String(c.status).toUpperCase() === k).length;
                      if (!count) return null;
                      return <span key={k} className={`status-chip font-semibold ${cls}`}>{count} {label}</span>;
                    })}
                  </div>

                  {/* Integrity hash */}
                  {openIntegrityHash && (
                    <p className="text-[11px] text-ink-muted dark:text-slate-600">
                      Integrity hash: <code className="font-mono">{openIntegrityHash.slice(0, 40)}…</code>
                    </p>
                  )}
                </div>
              )}
              {tab === 'matrix' && <RequirementMatrix checks={checks} />}
              {tab === 'gaps'   && <GapsPanel checks={checks} />}
            </div>
          </Card>

          {/* ── Officer Decision Panel ── */}
          <Card>
            <CardHeader
              title="Officer final decision"
              subtitle="AI recommendation is advisory — the procurement officer records the binding decision"
            />
            <div className="p-5 space-y-4">
              {myDec ? (
                /* Decision already recorded */
                <div className={`rounded-lg border px-4 py-4 ${
                  myDec.decision === 'accepted'
                    ? 'border-status-verified/30 bg-status-verified/5'
                    : 'border-status-review/30 bg-status-review/5'
                }`}>
                  <p className={`font-semibold ${myDec.decision === 'accepted' ? 'text-status-verified' : 'text-status-review'}`}>
                    {myDec.decision === 'accepted' ? '✓ AI recommendation accepted' : '⚠ Decision overridden by officer'}
                  </p>
                  {myDec.reason && (
                    <p className="mt-1 text-sm text-ink-secondary dark:text-slate-400">
                      <strong>Override reason:</strong> {myDec.reason}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-ink-muted dark:text-slate-500">
                    Recorded at {new Date(myDec.timestamp).toLocaleString()}
                  </p>
                  <Button variant="ghost" size="sm" className="no-print mt-3" onClick={() => {
                    setDecisions((d) => { const n = { ...d }; delete n[openId!]; return n; });
                  }}>
                    Change decision
                  </Button>
                </div>
              ) : (
                /* Decision not yet recorded */
                <div className="space-y-3">
                  <p className="text-sm text-ink-secondary dark:text-slate-400">
                    Review the compliance result, evidence, and gaps above, then record the final decision.
                  </p>
                  {!showOverrideForm ? (
                    <div className="no-print flex flex-wrap gap-3">
                      <Button variant="primary" onClick={handleAccept}>
                        ✓ Accept AI recommendation
                      </Button>
                      <Button variant="warning" onClick={() => setShowOverrideForm(true)}>
                        Override decision
                      </Button>
                    </div>
                  ) : (
                    <div className="no-print space-y-3 rounded-lg border border-status-review/30 bg-status-review/5 p-4">
                      <p className="text-sm font-medium text-status-review">Override reason (required)</p>
                      <p className="text-xs text-ink-secondary dark:text-slate-400">
                        Provide a clear justification for overriding the AI recommendation. This will be recorded in the audit trail.
                      </p>
                      <textarea
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        rows={3}
                        placeholder="e.g. Experience evidence was subsequently verified through additional documentation provided directly to the office."
                        className="w-full resize-none rounded-md border border-line bg-surface-card px-3 py-2.5 text-sm outline-none transition-colors focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:placeholder:text-slate-600"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          onClick={handleOverride}
                          disabled={!overrideReason.trim()}
                        >
                          Confirm override
                        </Button>
                        <Button variant="ghost" onClick={() => { setShowOverrideForm(false); setOverrideReason(''); }}>
                          Cancel
                        </Button>
                      </div>
                      {!overrideReason.trim() && (
                        <p className="text-xs text-status-fail">A justification is required to override the AI recommendation.</p>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-ink-muted dark:text-slate-600">
                    The procurement officer is solely responsible for the final qualification or disqualification decision.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-ink-heading dark:text-slate-100">{value}</div>
    </div>
  );
}
