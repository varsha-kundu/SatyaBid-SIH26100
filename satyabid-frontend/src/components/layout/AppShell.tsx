import React, { useState } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { OfflineScreen } from '../offline/OfflineScreen';

export function AppShell() {
  const online = useOnlineStatus();
  const matches = useMatches() as { handle?: { title?: string; subtitle?: string } }[];
  const current = [...matches].reverse().find((m) => m.handle?.title)?.handle;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-page dark:bg-[#0a1628]">
      {/* Sidebar — always rendered; hidden on mobile unless open */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-navy-950/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Demo banner */}
        <div className="bg-saffron-500 px-6 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white">
          Prototype demo — vendors, tenders, and verification results are synthetic data for SIH 2026 evaluation
        </div>

        <Topbar
          title={current?.title || 'SatyaBid'}
          subtitle={current?.subtitle}
          onMenuToggle={() => setSidebarOpen((v) => !v)}
        />

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div className="mx-auto max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      {!online && <OfflineScreen />}
    </div>
  );
}
