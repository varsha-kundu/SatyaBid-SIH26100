import React from 'react';
import type { ComplianceCheckResult } from '../../types';
import { StatusBadge } from '../common/UI';
import { checkLabel, checkMessage, paperStatus } from '../../utils/complianceUi';

/* ─── Human-readable check ID → NIT clause mapping ─── */
const CLAUSE_MAP: Record<string, { clause: string; category: string }> = {
  vendor_lookup:                 { clause: '—', category: 'Registry' },
  pan_matches_registry:          { clause: 'Cl 4.1', category: 'Statutory' },
  cin_matches_registry:          { clause: 'Cl 4.1', category: 'Statutory' },
  gst_status:                    { clause: 'Cl 4.2', category: 'Statutory' },
  gst_name_matches_bid:          { clause: 'Cl 4.2', category: 'Statutory' },
  name_matches_gstn:             { clause: 'Cl 4.2', category: 'Statutory' },
  name_matches_pan_it:           { clause: 'Cl 4.1', category: 'Statutory' },
  name_matches_mca21:            { clause: 'Cl 4.3', category: 'Statutory' },
  mca_company_status:            { clause: 'Cl 4.3', category: 'Statutory' },
  debarment_check:               { clause: 'Cl 3.1', category: 'Integrity' },
  udyam_claim_verifiable:        { clause: 'Cl 8.1', category: 'MSME' },
  startup_india_claim_verifiable:{ clause: 'Cl 8.2', category: 'Social' },
  msme_exemption_consistent:     { clause: 'Cl 8.3', category: 'MSME' },
  msme_exemption_eligibility:    { clause: 'Cl 8.4', category: 'MSME' },
  annual_turnover_meets_threshold:{ clause: 'Cl 6.3', category: 'Financial' },
  local_content_meets_threshold: { clause: 'Cl 7.1', category: 'MII' },
  bis_declared_on_bid:           { clause: 'Cl 9.1', category: 'Technical' },
  bis_number_matches:            { clause: 'Cl 9.1', category: 'Technical' },
  bis_certificate_valid:         { clause: 'Cl 9.1', category: 'Technical' },
  iso_9001_declared_on_bid:      { clause: 'Cl 9.2', category: 'Technical' },
  iso_9001_number_matches:       { clause: 'Cl 9.2', category: 'Technical' },
  iso_9001_certificate_valid:    { clause: 'Cl 9.2', category: 'Technical' },
  nsic_declared_on_bid:          { clause: 'Cl 9.3', category: 'Technical' },
};

function clauseFor(check: string) {
  return CLAUSE_MAP[check]?.clause ?? '—';
}
function categoryFor(check: string) {
  return CLAUSE_MAP[check]?.category ?? 'General';
}

/* Normalise the raw backend confidence (0–1 float or 0–100 int or undefined) */
function displayConfidence(raw: unknown): string {
  if (raw == null) return '—';
  const n = Number(raw);
  if (Number.isNaN(n)) return '—';
  const pct = n <= 1 ? Math.round(n * 100) : Math.round(n);
  return `${pct}%`;
}

function recommendedAction(status: string): string {
  const s = paperStatus(status);
  if (s === 'verified')         return 'Accept — no further action required.';
  if (s === 'non_compliant')    return 'Disqualify requirement — officer review required.';
  if (s === 'missing')          return 'Request supporting document from bidder.';
  if (s === 'expired')          return 'Request current / renewed document.';
  if (s === 'inconsistent')     return 'Manual cross-check of conflicting records.';
  if (s === 'manual_review')    return 'Officer manual review before qualification.';
  if (s === 'unable_to_verify') return 'Source unavailable — do not treat as non-compliance.';
  return 'Review before proceeding.';
}

const STATUS_ICON: Record<string, string> = {
  verified:         '✓',
  non_compliant:    '✕',
  missing:          '⚠',
  expired:          '⚠',
  inconsistent:     '◐',
  manual_review:    '◐',
  unable_to_verify: '—',
  not_applicable:   '—',
};

export function RequirementMatrix({ checks }: { checks: ComplianceCheckResult[] }) {
  if (!checks.length) {
    return (
      <p className="text-sm text-ink-secondary dark:text-slate-400">
        No requirement rows to display. Run a verification first.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-[22%]">Requirement</th>
            <th className="hidden sm:table-cell w-[8%]">Clause</th>
            <th className="hidden md:table-cell w-[8%]">Category</th>
            <th className="w-[12%]">Status</th>
            <th className="hidden sm:table-cell w-[10%]">Declared / Found</th>
            <th className="hidden md:table-cell w-[10%]">Expected / Portal</th>
            <th className="hidden lg:table-cell w-[7%]">Confidence</th>
            <th className="hidden xl:table-cell">Explanation</th>
            <th className="hidden lg:table-cell w-[18%]">Recommended action</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c, i) => {
            const checkId  = String(c.check || c.requirement || `check_${i + 1}`);
            const ps       = paperStatus(c.status);
            const icon     = STATUS_ICON[ps] ?? '—';
            const declared = c.declared != null ? String(c.declared) : '—';
            const expected = c.expected != null ? String(c.expected) : '—';
            const conf     = displayConfidence(c.confidence);
            const msg      = checkMessage(c);
            const action   = recommendedAction(c.status);

            return (
              <tr key={i}>
                {/* Requirement */}
                <td>
                  <p className="font-medium text-ink-heading dark:text-slate-100">
                    {checkLabel(c, i)}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink-muted dark:text-slate-500">
                    {checkId}
                  </p>
                </td>

                {/* Clause */}
                <td className="hidden text-xs font-mono text-ink-secondary dark:text-slate-400 sm:table-cell">
                  {clauseFor(checkId)}
                </td>

                {/* Category */}
                <td className="hidden text-xs text-ink-secondary dark:text-slate-400 md:table-cell">
                  {categoryFor(checkId)}
                </td>

                {/* Status with icon */}
                <td>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" aria-hidden="true">{icon}</span>
                    <StatusBadge status={ps} />
                  </div>
                </td>

                {/* Declared / found */}
                <td className="hidden text-xs text-ink-secondary dark:text-slate-400 sm:table-cell">
                  {declared}
                </td>

                {/* Expected / portal */}
                <td className="hidden text-xs text-ink-secondary dark:text-slate-400 md:table-cell">
                  {expected}
                </td>

                {/* Confidence */}
                <td className="hidden text-xs font-semibold text-ink-heading dark:text-slate-200 lg:table-cell">
                  {conf}
                </td>

                {/* Explanation */}
                <td className="hidden max-w-xs text-xs leading-relaxed text-ink-secondary dark:text-slate-400 xl:table-cell">
                  {msg}
                </td>

                {/* Action */}
                <td className="hidden text-xs text-ink-secondary dark:text-slate-400 lg:table-cell">
                  {action}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
