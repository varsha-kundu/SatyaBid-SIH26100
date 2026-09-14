// This is NOT a substitute backend or database. It only remembers, inside
// the user's own browser, the real backend responses that occurred during
// this session (e.g. a /verify-compliance call the user actually made), so
// that Reports / Audit Trail / Human Review have something honest to show
// without a dedicated backend endpoint for each. Everything stored here
// originated from a real API response — nothing is invented here.

import type { ComplianceResponse } from '../types';

const KEY = 'satyabid_session_events_v1';

export interface SessionEvent {
  id: string;
  timestamp: string;
  sourceFile: string;
  result: ComplianceResponse;
}

function read(): SessionEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionEvent[]) : [];
  } catch {
    return [];
  }
}

function write(events: SessionEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

export const sessionStore = {
  recordVerification(sourceFile: string, result: ComplianceResponse) {
    const events = read();
    events.unshift({
      id: `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      sourceFile,
      result,
    });
    write(events.slice(0, 50));
  },
  list(): SessionEvent[] {
    return read();
  },
  clear() {
    write([]);
  },
};
