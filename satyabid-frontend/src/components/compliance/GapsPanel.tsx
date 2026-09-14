import React from 'react';
import type { ComplianceCheckResult } from '../../types';
import { StatusBadge } from '../common/UI';
import { checkLabel, checkMessage, paperStatus } from '../../utils/complianceUi';

type GapCategory = 'MISSING' | 'FAILED' | 'NEEDS REVIEW' | 'RISK FLAGS';

const GAP_CONFIG: Record<GapCategory, {
  statuses: string[];
  color: string;
  bg: string;
  icon: string;
  action: string;
}> = {
  MISSING: {
    statuses: ['missing'],
    color: 'text-status-fail',
    bg: 'border-status-fail/20 bg-status-fail/5 dark:bg-status-fail/10',
    icon: '⚠',
    action: 'Request this mandatory document from the bidder before proceeding.',
  },
  FAILED: {
    statuses: ['non_compliant', 'expired'],
    color: 'text-status-fail',
    bg: 'border-status-fail/20 bg-status-fail/5 dark:bg-status-fail/10',
    icon: '✕',
    action: 'Raise a non-compliance finding. Bidder must resolve before qualification.',
  },
  'NEEDS REVIEW': {
    statuses: ['inconsistent', 'manual_review'],
    color: 'text-status-review',
    bg: 'border-status-review/20 bg-status-review/5 dark:bg-status-review/10',
    icon: '◐',
    action: 'Officer manual review required before a qualification decision can be made.',
  },
  'RISK FLAGS': {
    statuses: ['unable_to_verify'],
    color: 'text-ink-secondary',
    bg: 'border-line bg-surface-secondary dark:border-[#1e2d47] dark:bg-[#0a1628]',
    icon: '—',
    action: 'Source unavailable. Do not treat as automatic non-compliance — investigate independently.',
  },
};

function groupChecks(checks: ComplianceCheckResult[]): Record<GapCategory, ComplianceCheckResult[]> {
  const groups: Record<GapCategory, ComplianceCheckResult[]> = {
    MISSING:       [],
    FAILED:        [],
    'NEEDS REVIEW':[],
    'RISK FLAGS':  [],
  };
  for (const c of checks) {
    const ps = paperStatus(c.status);
    for (const [cat, cfg] of Object.entries(GAP_CONFIG) as [GapCategory, typeof GAP_CONFIG[GapCategory]][]) {
      if (cfg.statuses.includes(ps)) {
        groups[cat].push(c);
        break;
      }
    }
  }
  return groups;
}

export function GapsPanel({ checks }: { checks: ComplianceCheckResult[] }) {
  const groups = groupChecks(checks);
  const totalGaps = Object.values(groups).flat().length;

  if (!totalGaps) {
    return (
      <p className="text-sm font-medium text-status-verified">
        ✓ No missing, expired, inconsistent, or unverifiable items were identified in this run.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {(Object.keys(GAP_CONFIG) as GapCategory[]).map((cat) => {
        const items = groups[cat];
        if (!items.length) return null;
        const cfg = GAP_CONFIG[cat];
        return (
          <section key={cat}>
            {/* Category header */}
            <div className="mb-2 flex items-center gap-2">
              <span className={`text-base font-bold ${cfg.color}`}>{cfg.icon}</span>
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${cfg.color}`}>
                {cat} ({items.length})
              </h4>
            </div>

            <ul className="space-y-2">
              {items.map((c, i) => (
                <li key={i} className={`rounded-lg border px-4 py-3 ${cfg.bg}`}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink-heading dark:text-slate-100">
                        {checkLabel(c, i)}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary dark:text-slate-400">
                        {checkMessage(c)}
                      </p>
                      {(c.declared != null || c.expected != null) && (
                        <p className="mt-1 text-[11px] text-ink-muted dark:text-slate-500">
                          {c.declared != null && <>Declared: <strong>{String(c.declared)}</strong></>}
                          {c.declared != null && c.expected != null && ' · '}
                          {c.expected != null && <>Expected: <strong>{String(c.expected)}</strong></>}
                        </p>
                      )}
                      {/* Recommended action */}
                      <p className={`mt-2 text-xs font-medium ${cfg.color}`}>
                        → {cfg.action}
                      </p>
                    </div>
                    <div className="mt-1 shrink-0 sm:mt-0 sm:ml-4">
                      <StatusBadge status={paperStatus(c.status)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-xs text-ink-muted dark:text-slate-600">
        AI-identified gaps are advisory. Final qualification decision rests with the Procurement Officer.
      </p>
    </div>
  );
}
