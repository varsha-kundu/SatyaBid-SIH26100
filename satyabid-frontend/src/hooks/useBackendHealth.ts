import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../services/api/apiClient';
import type { BackendStatus } from '../types';

/**
 * Polls GET /health to know whether the Flask backend is reachable.
 * This is deliberately separate from browser online/offline detection:
 * the internet can be fine while the backend is simply not running.
 */
export function useBackendHealth(intervalMs = 15000) {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  const check = async () => {
    try {
      await apiClient.health();
      setStatus('online');
    } catch {
      setStatus('offline');
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    check();
    timer.current = window.setInterval(check, intervalMs);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status, lastChecked, recheck: check };
}
