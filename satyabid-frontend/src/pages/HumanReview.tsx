import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sessionStore } from '../services/sessionStore';
import type { SessionEvent } from '../services/sessionStore';
import { Card, CardHeader, StatusBadge, RiskBadge, EmptyState, Button, ConfirmDialog, InlineSuccess, Modal } from '../components/common/UI';
import type { ConfirmAction } from '../components/common/UI';

interface ReviewDecision {
  eventId: string;
  action: ConfirmAction;
  reason: string;
  timestamp: string;
}

export function HumanReview() {
  const [events, setEvents] = useState(() => sessionStore.list());
  const [decisions, setDecisions] = useState<Record<string, ReviewDecision>>({});
  const [confirmTarget, setConfirmTarget] = useState<{ event: SessionEvent; action: ConfirmAction } | null>(null);
  const [lastSuccess, setLastSuccess] = useState<string | null>(null);
  const [detailEvent, setDetailEvent] = useState<SessionEvent | null>(null);

  const flagged = events.filter((e) => {
    const checks = Array.isArray(e.result.checks) ? e.result.checks : [];
    const hasReview = checks.some(
      (c) =>
        String(c.status).toLowerCase().includes('review') ||
        String(c.status).toLowerCase().includes('inconsistent') ||
        String(c.status).toUpperCase() === 'WARNING' ||
        String(c.status).toUpperCase() === 'FAIL' ||
        String(c.status).toUpperCase() === 'CRITICAL',
    );
    const riskHigh =
      ['HIGH', 'CRITICAL'].includes(String(e.result.risk_level || '').toUpperCase());
    return hasReview || riskHigh;
  });

  // Also show any bid not yet decided
  const undecided = flagged.filter((e) => !decisions[e.id]);
  const decided = flagged.filter((e) => !!decisions[e.id]);

  const handleDecision = (reason: string) => {
    if (!confirmTarget) return;
    const { event, action } = confirmTarget;
    const decision: ReviewDecision = {
      eventId: event.id,
      action,
      reason,
      timestamp: new Date().toISOString(),
    };
    setDecisions((prev) => ({ ...prev, [event.id]: decision }));
    setLastSuccess(
      action === 'approve'
        ? `Bid "${event.sourceFile}" approved and recorded in the audit trail.`
        : action === 'decline'
        ? `Bid "${event.sourceFile}" declined.${reason ? ` Reason: ${reason}` : ''}`
        : `Vendor for bid "${event.sourceFile}" has been flagged as blocked.`,
    );
    setConfirmTarget(null);
    setTimeout(() => setLastSuccess(null), 5000);
  };

  return (
    <div className="space-y-5">
      {/* Success notification */}
      {lastSuccess && <InlineSuccess message={lastSuccess} />}

      <Card>
        <CardHeader
          title="Cases needing human review"
          subtitle="Derived from compliance checks run this session — filtered for high-risk, failing, or flagged bids"
          action={
            events.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  sessionStore.clear();
                  setEvents([]);
                  setDecisions({});
                }}
              >
                Clear session
              </Button>
            ) : undefined
          }
        />

        <div className="p-5">
          {flagged.length === 0 ? (
            <EmptyState
              icon="◎"
              title="No cases pending review"
              body={
                events.length === 0
                  ? 'Run a compliance check from the Bid Verification page — any result with high risk or a failing check will appear here automatically.'
                  : 'None of the verifications run this session were flagged for manual review.'
              }
            />
          ) : (
            <div className="space-y-3">
              {/* Undecided cases */}
              {undecided.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-secondary dark:text-slate-400">
                    Awaiting officer decision ({undecided.length})
                  </p>
                  {undecided.map((e) => (
                    <ReviewCard
                      key={e.id}
                      event={e}
                      decision={undefined}
                      onApprove={() => setConfirmTarget({ event: e, action: 'approve' })}
                      onDecline={() => setConfirmTarget({ event: e, action: 'decline' })}
                      onBlock={() => setConfirmTarget({ event: e, action: 'block' })}
                      onViewDetail={() => setDetailEvent(e)}
                    />
                  ))}
                </>
              )}

              {/* Decided cases */}
              {decided.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-secondary dark:text-slate-400">
                    Decided this session ({decided.length})
                  </p>
                  {decided.map((e) => (
                    <ReviewCard
                      key={e.id}
                      event={e}
                      decision={decisions[e.id]}
                      onViewDetail={() => setDetailEvent(e)}
                    />
                  ))}
                </>
              )}
            </div>
          )}

          <p className="mt-5 border-t border-line pt-4 text-xs text-ink-muted dark:border-[#1e2d47] dark:text-slate-500">
            <strong>Prototype note:</strong> decisions are recorded in this browser session only.
            A persistent backend endpoint (<code>POST /officer-decision</code>) is required to save
            decisions across users and sessions.{' '}
            <span className="text-status-fail">Final qualification decisions must always be made by the authorized Procurement Officer.</span>
          </p>
        </div>
      </Card>

      {/* Confirm dialog */}
      {confirmTarget && (
        <ConfirmDialog
          open={!!confirmTarget}
          onClose={() => setConfirmTarget(null)}
          action={confirmTarget.action}
          targetName={confirmTarget.event.sourceFile}
          onConfirm={handleDecision}
        />
      )}

      {/* Detail modal */}
      {detailEvent && (
        <Modal
          open={!!detailEvent}
          onClose={() => setDetailEvent(null)}
          title={`Compliance detail — ${detailEvent.sourceFile}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            <div className="flex flex-wrap gap-3">
              <RiskBadge level={String(detailEvent.result.risk_level || '')} />
              <StatusBadge status={String(detailEvent.result.overall_status || '')} />
              {typeof detailEvent.result.compliance_score === 'number' && (
                <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-ink-heading dark:bg-[#142038] dark:text-slate-100">
                  {detailEvent.result.compliance_score}% compliance
                </span>
              )}
            </div>
            {detailEvent.result.recommendation && (
              <p className="text-sm leading-relaxed text-ink-secondary dark:text-slate-400">
                {detailEvent.result.recommendation}
              </p>
            )}
            {Array.isArray(detailEvent.result.checks) && detailEvent.result.checks.length > 0 && (
              <div className="space-y-1.5">
                {detailEvent.result.checks.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border border-line px-3 py-2 text-xs dark:border-[#1e2d47]"
                  >
                    <StatusBadge status={String(c.status)} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-medium text-ink-heading dark:text-slate-100">
                        {String(c.check || `check_${i + 1}`)}
                      </p>
                      <p className="mt-0.5 text-ink-secondary dark:text-slate-400">
                        {String(c.message || c.reason || '—')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ─── Review card ─── */
function ReviewCard({
  event,
  decision,
  onApprove,
  onDecline,
  onBlock,
  onViewDetail,
}: {
  event: SessionEvent;
  decision?: ReviewDecision;
  onApprove?: () => void;
  onDecline?: () => void;
  onBlock?: () => void;
  onViewDetail?: () => void;
}) {
  const risk = String(event.result.risk_level || '').toUpperCase();
  const score = typeof event.result.compliance_score === 'number' ? event.result.compliance_score : null;

  const decidedStyle: Record<ConfirmAction, string> = {
    approve: 'border-status-verified/30 bg-status-verified/5',
    decline: 'border-status-fail/30 bg-status-fail/5',
    block:   'border-status-fail/40 bg-status-fail/10',
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        decision
          ? decidedStyle[decision.action]
          : 'border-line dark:border-[#1e2d47]'
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-ink-heading dark:text-slate-100">{event.sourceFile}</p>
            {score !== null && (
              <span className="rounded-full bg-surface-secondary px-2.5 py-0.5 text-xs font-semibold text-ink-heading dark:bg-[#142038] dark:text-slate-100">
                {score}%
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-muted dark:text-slate-500">
            {new Date(event.timestamp).toLocaleString()}
          </p>
          {decision && (
            <p className="mt-1 text-xs text-ink-secondary dark:text-slate-400">
              <strong className="capitalize">{decision.action}d</strong> by officer
              {decision.reason ? ` · "${decision.reason}"` : ''}
              {' · '}{new Date(decision.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={risk} />
          <StatusBadge status={String(event.result.overall_status || 'manual_review')} />

          {onViewDetail && (
            <Button variant="ghost" size="sm" onClick={onViewDetail}>
              Detail
            </Button>
          )}

          {!decision && (
            <>
              <Button variant="primary" size="sm" onClick={onApprove}>
                ✓ Approve
              </Button>
              <Button variant="warning" size="sm" onClick={onDecline}>
                Decline
              </Button>
              <Button variant="danger" size="sm" onClick={onBlock}>
                ⊘ Block
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
