import React, { useState } from 'react';
import type { ComplianceCheckResult } from '../../types';
import { StatusBadge } from '../common/UI';
import { checkLabel, checkMessage, paperStatus } from '../../utils/complianceUi';

/* Confidence normaliser (0–1 float or 0–100 int or undefined) */
function displayConfidence(raw: unknown): string {
  if (raw == null) return 'Engine default';
  const n = Number(raw);
  if (Number.isNaN(n)) return 'Engine default';
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  return `${pct}%`;
}

function recommendedAction(status: string): string {
  const s = paperStatus(status);
  if (s === 'verified')         return 'Accept as supporting evidence. No further action required.';
  if (s === 'non_compliant')    return 'Raise non-compliance finding. Request bidder clarification or document.';
  if (s === 'missing')          return 'Request the mandatory document from the bidder before proceeding.';
  if (s === 'expired')          return 'Request a renewed / current version of the document.';
  if (s === 'inconsistent')     return 'Cross-check conflicting records manually before qualification.';
  if (s === 'manual_review')    return 'Officer manual review required before qualification.';
  if (s === 'unable_to_verify') return 'Source unavailable. Do not treat as non-compliance — note in report.';
  if (s === 'not_applicable')   return 'Requirement does not apply to this bidder or tender.';
  return 'Review before proceeding.';
}

const STATUS_DOT: Record<string, string> = {
  verified:         'bg-status-verified',
  non_compliant:    'bg-status-fail',
  missing:          'bg-status-fail',
  expired:          'bg-status-fail',
  inconsistent:     'bg-status-review',
  manual_review:    'bg-status-review',
  unable_to_verify: 'bg-ink-muted',
  not_applicable:   'bg-ink-muted',
};

export function EvidenceViewer({
  checks,
  sourceFile,
}: {
  checks: ComplianceCheckResult[];
  sourceFile?: string;
}) {
  const [open, setOpen] = useState(0);

  if (!checks.length) {
    return (
      <p className="text-sm text-ink-secondary dark:text-slate-400">
        No evidence rows were returned for this bid.
      </p>
    );
  }

  const selected = checks[open] ?? checks[0];
  const ps       = paperStatus(selected.status);
  const conf     = displayConfidence(selected.confidence);
  const source   = String(selected.source || (sourceFile ? `${sourceFile} + mock portal` : 'Bidder PDF + mock portal'));
  const page     = selected.page != null ? `Page ${selected.page}` : 'Reference unavailable';
  const action   = recommendedAction(selected.status);
  const msg      = checkMessage(selected);
  const declared = selected.declared != null ? String(selected.declared) : '—';
  const expected = selected.expected != null ? String(selected.expected) : '—';

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      {/* Check list */}
      <ul className="space-y-0.5">
        {checks.map((c, i) => {
          const cps   = paperStatus(c.status);
          const dot   = STATUS_DOT[cps] ?? 'bg-ink-muted';
          const label = checkLabel(c, i);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                  open === i
                    ? 'bg-navy-900 text-white'
                    : 'text-ink-secondary hover:bg-surface-secondary dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
                <span className="truncate font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Evidence detail */}
      <div className="rounded-xl border border-line p-5 dark:border-[#1e2d47]">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={ps} />
          <span className="text-[11px] text-ink-muted dark:text-slate-500">
            {source} · {page}
          </span>
        </div>

        {/* Evidence grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <EvidenceCell label="Requirement" value={checkLabel(selected, open)} />
          <EvidenceCell label="Tender clause / check ID" value={String(selected.check || selected.requirement || `check_${open + 1}`)} mono />
          <EvidenceCell label="Bidder declared / extracted" value={declared} />
          <EvidenceCell label="Portal / expected value" value={expected} />
          <EvidenceCell label="Source document" value={source} />
          <EvidenceCell label="Page / reference" value={page} />
          <EvidenceCell label="Confidence" value={conf} />
          <EvidenceCell label="Verification status" value={<StatusBadge status={ps} />} />
        </div>

        {/* Explanation */}
        <div className="mt-4 rounded-md border border-line bg-surface-secondary px-4 py-3 dark:border-[#1e2d47] dark:bg-[#0a1628]">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">
            Why this result?
          </p>
          <p className="text-sm leading-relaxed text-ink-secondary dark:text-slate-400">
            {msg || 'No additional explanation returned by the verification engine.'}
          </p>
        </div>

        {/* Recommended action */}
        <div className={`mt-3 rounded-md px-4 py-3 text-sm leading-relaxed ${
          ps === 'verified'
            ? 'bg-status-verified/8 text-status-verified dark:bg-status-verified/10'
            : ps === 'unable_to_verify' || ps === 'not_applicable'
            ? 'bg-surface-secondary text-ink-secondary dark:bg-[#0a1628] dark:text-slate-400'
            : 'bg-status-fail/8 text-status-fail dark:bg-status-fail/10'
        }`}>
          <span className="font-semibold">Recommended action: </span>{action}
        </div>

        <p className="mt-3 text-[11px] text-ink-muted dark:text-slate-600">
          Verification result is AI-assisted and advisory. Final qualification decision rests with the Procurement Officer.
        </p>
      </div>
    </div>
  );
}

function EvidenceCell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">
        {label}
      </p>
      <div className={`mt-1 break-words text-sm font-medium text-ink-heading dark:text-slate-100 ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </div>
    </div>
  );
}
