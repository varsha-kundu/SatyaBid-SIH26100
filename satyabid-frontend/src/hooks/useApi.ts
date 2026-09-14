import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../services/api/apiClient';

interface State<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Thin wrapper so pages don't re-implement loading/error plumbing by hand.
 * Never fabricates data on failure — `data` stays null and `error` carries
 * the friendly message from the API client.
 */
export function useApi<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, loading: true, error: null });

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : 'Something went wrong while contacting the backend.';
        setState({ data: null, loading: false, error: message });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, refetch: run };
}
