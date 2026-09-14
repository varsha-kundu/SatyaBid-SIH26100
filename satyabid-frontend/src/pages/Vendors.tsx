import React, { useState } from 'react';
import { apiClient } from '../services/api/apiClient';
import { useApi } from '../hooks/useApi';
import { Card, CardHeader, InlineError, Loader, EmptyState, Button } from '../components/common/UI';

function labelFor(v: unknown, i: number): string {
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    return String(o.legal_name || o.name || o.identifier || o.gstin || `Vendor ${i + 1}`);
  }
  return String(v);
}

export function Vendors() {
  const { data, loading, error, refetch } = useApi<{ count: number; vendors: unknown[] }>(
    () => apiClient.vendors(),
    [],
  );
  const [selected, setSelected] = useState<unknown | null>(null);
  const list: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.vendors)
    ? (data as any).vendors
    : [];

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
      <Card>
        <CardHeader
          title="Vendors"
          subtitle="GET /vendors — backend's synthetic dataset"
          action={<Button variant="ghost" size="sm" onClick={refetch}>Refresh</Button>}
        />
        <div className="p-5">
          {loading && <Loader label="Loading vendors…" />}
          {error && <InlineError message={error} />}
          {!loading && !error && list.length === 0 && (
            <EmptyState title="No vendors returned" body="The backend responded but returned no vendor records." />
          )}
          {!loading && !error && list.length > 0 && (
            <ul className="divide-y divide-navy-900/5 dark:divide-white/5">
              {list.map((v, i) => (
                <li key={i}>
                  <button
                    onClick={() => setSelected(v)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm hover:text-saffron-600 transition-colors"
                  >
                    <span className="font-medium text-ink-heading dark:text-slate-100">{labelFor(v, i)}</span>
                    <span className="text-ink-muted">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Vendor details"
          subtitle={selected ? 'Raw backend record' : 'Select a vendor to inspect its record'}
        />
        <div className="p-5">
          {!selected ? (
            <EmptyState title="Nothing selected" body="Pick a vendor from the list to view exactly what the backend returned for it." />
          ) : (
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-surface-secondary p-4 text-xs text-ink-secondary dark:bg-[#0a1628] dark:text-slate-400">
              {JSON.stringify(selected, null, 2)}
            </pre>
          )}
        </div>
      </Card>
    </div>
  );
}
