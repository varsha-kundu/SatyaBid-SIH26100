import React, { useState } from 'react';
import { sessionStore } from '../services/sessionStore';
import { Card, CardHeader, RiskBadge, StatusBadge, EmptyState, Button } from '../components/common/UI';

export function AuditorView() {
  const [events] = useState(() => sessionStore.list());

  const total      = events.length;
  const highRisk   = events.filter((e) => ['HIGH','CRITICAL'].includes(String(e.result.risk_level || '').toUpperCase())).length;
  const avgScore   = total
    ? Math.round(events.reduce((s, e) => s + (typeof e.result.compliance_score === 'number' ? e.result.compliance_score : 0), 0) / total)
    : null;

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      {total > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total verifications', value: String(total) },
            { label: 'High / critical risk', value: String(highRisk) },
            { label: 'Average score', value: avgScore !== null ? `${avgScore}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-line bg-surface-card px-4 py-3 shadow-card dark:bg-[#0f1e35] dark:border-[#1e2d47]">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-slate-500">{s.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink-heading dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title="Auditor overview"
          subtitle="Read-only view of this session's verification activity"
        />
        <div className="p-5">
          {events.length === 0 ? (
            <EmptyState
              icon="◎"
              title="Nothing to audit yet"
              body="Run a verification from the Bid Verification page to populate this view."
            />
          ) : (
            <div className="space-y-3">
              {events.map((e) => {
                const score     = typeof e.result.compliance_score === 'number' ? e.result.compliance_score : null;
                const risk      = String(e.result.risk_level || '');
                const status    = String(e.result.overall_status || '');
                const rec       = typeof e.result.recommendation === 'string' ? e.result.recommendation : null;

                return (
                  <div key={e.id} className="rounded-lg border border-line bg-surface-secondary p-4 dark:border-[#1e2d47] dark:bg-[#0a1628]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink-heading dark:text-slate-100">
                          {e.sourceFile}
                        </p>
                        <p className="text-xs text-ink-muted dark:text-slate-500">
                          {new Date(e.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {score !== null && (
                          <span className="text-sm font-bold text-ink-heading dark:text-slate-100">{score}%</span>
                        )}
                        <RiskBadge level={risk} />
                        <StatusBadge status={status} />
                      </div>
                    </div>
                    {rec && (
                      <p className="mt-2 text-xs leading-relaxed text-ink-secondary dark:text-slate-400 line-clamp-2">
                        {rec}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-4 text-xs text-ink-muted dark:text-slate-600">
            <strong>Prototype:</strong> A dedicated auditor endpoint with cross-session fraud signals would extend this view.
          </p>
        </div>
      </Card>
    </div>
  );
}
