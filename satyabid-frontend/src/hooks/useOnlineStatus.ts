import { useEffect, useState } from 'react';

/**
 * Tracks navigator.onLine. This answers "does the browser have internet?" —
 * it must never be confused with backend reachability (see useBackendHealth).
 * When this goes false, the app shows the offline screen + easter-egg game.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
