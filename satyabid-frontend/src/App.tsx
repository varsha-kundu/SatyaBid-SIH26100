import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Landing } from './pages/Landing';
import { Login } from './pages/login';
import { Dashboard } from './pages/Dashboard';
import { BidVerification } from './pages/BidVerification';
import { Vendors } from './pages/Vendors';
import { Tenders } from './pages/Tenders';
import { HumanReview } from './pages/HumanReview';
import { Reports } from './pages/Reports';
import { AuditTrail } from './pages/AuditTrail';
import { Documents } from './pages/Documents';
import { VendorPortal } from './pages/VendorPortal';
import { AuditorView } from './pages/AuditorView';
import { SystemHealth } from './pages/SystemHealth';
import { useAuth } from './context/AuthContext';

/** Redirect unauthenticated users to login, preserving the intended path. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-page dark:bg-[#0a1628]">
        <div className="flex items-center gap-3 text-sm text-ink-secondary">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy-900/20 border-t-saffron-500" />
          Loading SatyaBid…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
        handle: { title: 'Dashboard', subtitle: 'Compliance overview across active tenders and vendors' },
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
        handle: { title: 'Dashboard', subtitle: 'Compliance overview across active tenders and vendors' },
      },
      {
        path: 'bid-verification',
        element: <BidVerification />,
        handle: { title: 'Bid Verification', subtitle: 'Document → extraction → verification → compliance → decision' },
      },
      {
        path: 'vendors',
        element: <Vendors />,
        handle: { title: 'Vendors', subtitle: 'Backend-registered bidders' },
      },
      {
        path: 'tenders',
        element: <Tenders />,
        handle: { title: 'Tenders', subtitle: 'Eligibility and requirement conditions' },
      },
      {
        path: 'documents',
        element: <Documents />,
        handle: { title: 'Document Center', subtitle: 'Sample bid PDFs from the backend dataset' },
      },
      {
        path: 'human-review',
        element: <HumanReview />,
        handle: { title: 'Human Review', subtitle: 'Cases needing a procurement officer\'s decision' },
      },
      {
        path: 'reports',
        element: <Reports />,
        handle: { title: 'Reports', subtitle: 'Full compliance reports per bid' },
      },
      {
        path: 'audit-trail',
        element: <AuditTrail />,
        handle: { title: 'Audit Trail', subtitle: 'Timestamped verification activity' },
      },
      {
        path: 'vendor-portal',
        element: <VendorPortal />,
        handle: { title: 'Vendor Portal', subtitle: 'Bidder document submission and compliance pre-check' },
      },
      {
        path: 'auditor',
        element: <AuditorView />,
        handle: { title: 'Auditor', subtitle: 'Read-only oversight view' },
      },
      {
        path: 'system-health',
        element: <SystemHealth />,
        handle: { title: 'System Health', subtitle: 'Backend connectivity and diagnostics' },
      },
    ],
  },
  // Catch-all redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
