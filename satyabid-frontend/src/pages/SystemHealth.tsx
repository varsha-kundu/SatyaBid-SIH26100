import React from 'react';
import { apiClient } from '../services/api/apiClient';
import { useApi } from '../hooks/useApi';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { Card, CardHeader, InlineError, Loader, Button } from '../components/common/UI';

export function SystemHealth() {
  const health = useBackendHealth();
  const detail = useApi<Record<string, unknown>>(() => apiClient.health() as Promise<Record<string, unknown>>, [health.status]);

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Backend connection"
          subtitle={`Base URL: ${apiClient.baseUrl}`}
          action={<Button variant="ghost" onClick={health.recheck}>Recheck now</Button>}
        />
        <div className="flex items-center gap-3 p-5">
          <span className={`h-3 w-3 rounded-full ${health.status === 'online' ? 'bg-status-verified' : health.status === 'offline' ? 'bg-status-fail' : 'bg-navy-950/30'}`} />
          <span className="font-medium text-navy-950">
            {health.status === 'online' ? 'Backend Connected' : health.status === 'offline' ? 'Backend Offline' : 'Checking…'}
          </span>
          {health.lastChecked && <span className="text-xs text-navy-950/45">Last checked {health.lastChecked.toLocaleTimeString()}</span>}
        </div>
        {health.status === 'offline' && (
          <div className="px-5 pb-5">
            <InlineError message="Backend service is unavailable. Please start the Flask backend at the URL above and try again." />
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Raw /health response" />
        <div className="p-5">
          {detail.loading && <Loader label="Calling GET /health…" />}
          {detail.error && <InlineError message={detail.error} />}
          {detail.data && (
            <pre className="whitespace-pre-wrap rounded-md bg-surface-page p-4 text-xs text-navy-950/80">{JSON.stringify(detail.data, null, 2)}</pre>
          )}
        </div>
      </Card>
    </div>
  );
}
