import React, { useState } from 'react';
import { sessionStore } from '../services/sessionStore';
import { Card, CardHeader, EmptyState, StatusBadge, Button } from '../components/common/UI';

export function AuditTrail() {
  const [events, setEvents] = useState(() => sessionStore.list());

  return (
    <Card>
      <CardHeader
        title="Audit trail"
        subtitle="Session-scoped events — every /verify-compliance call is recorded here"
        action={
          events.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => { sessionStore.clear(); setEvents([]); }}>
              Clear session
            </Button>
          ) : undefined
        }
      />
      <div className="p-5">
        {events.length === 0 ? (
          <EmptyState
            icon="↺"
            title="No audit events yet"
            body="Verification activity you generate in this browser session will appear here, newest first."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const score = typeof e.result.compliance_score === 'number'
                    ? e.result.compliance_score
                    : null;
                  const status = String(e.result.overall_status || '—');
                  return (
                    <tr key={e.id}>
                      <td className="whitespace-nowrap text-xs text-ink-secondary dark:text-slate-400">
                        {new Date(e.timestamp).toLocaleString()}
                      </td>
                      <td className="text-xs text-ink-secondary dark:text-slate-400">
                        Officer (session)
                      </td>
                      <td className="text-xs font-medium text-ink-heading dark:text-slate-200">
                        Compliance analysis
                      </td>
                      <td className="max-w-[160px] truncate text-xs text-ink-secondary dark:text-slate-400">
                        {e.sourceFile}
                      </td>
                      <td>
                        <StatusBadge status={status} />
                      </td>
                      <td className="text-xs font-semibold text-ink-heading dark:text-slate-200">
                        {score !== null ? `${score}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-xs text-ink-muted dark:text-slate-600">
          <strong>Prototype:</strong> events are stored in browser localStorage for this session.
          A <code>GET /audit-trail</code> backend endpoint would persist these across sessions.
        </p>
      </div>
    </Card>
  );
}
