import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BrandMark } from '../common/BrandMark';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../context/AuthContext';

const PRIMARY_NAV = [
  { to: '/app/dashboard',       key: 'nav_dashboard',       icon: '▤', label: 'Dashboard' },
  { to: '/app/bid-verification', key: 'nav_bidVerification', icon: '✓', label: 'Bid Verification' },
  { to: '/app/vendors',          key: 'nav_vendors',          icon: '⌂', label: 'Vendors' },
  { to: '/app/tenders',          key: 'nav_tenders',          icon: '≡', label: 'Tenders' },
  { to: '/app/documents',        key: 'nav_documents',        icon: '▦', label: 'Documents' },
  { to: '/app/human-review',     key: 'nav_humanReview',      icon: '◎', label: 'Human Review' },
  { to: '/app/reports',          key: 'nav_reports',          icon: '▧', label: 'Reports' },
  { to: '/app/audit-trail',      key: 'nav_auditTrail',       icon: '↺', label: 'Audit Trail' },
];

const SECONDARY_NAV = [
  { to: '/app/vendor-portal',  key: 'nav_vendorPortal',  label: 'Vendor Portal' },
  { to: '/app/auditor',        key: 'nav_auditor',        label: 'Auditor View' },
  { to: '/app/system-health',  key: 'nav_systemHealth',   label: 'System Health' },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
    onClose?.();
  };

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-900 md:flex dark:bg-[#070f1e]">
        <SidebarContent t={t} user={user} onSignOut={handleSignOut} />
      </aside>

      {/* ── Mobile sidebar (slide-in) ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex-col bg-navy-900 transition-transform duration-200 md:hidden dark:bg-[#070f1e] ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close sidebar"
        >
          ✕
        </button>
        <SidebarContent t={t} user={user} onSignOut={handleSignOut} />
      </aside>
    </>
  );
}

function SidebarContent({
  t,
  user,
  onSignOut,
}: {
  t: (k: string) => string;
  user: ReturnType<typeof useAuth>['user'];
  onSignOut: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BrandMark size={32} />
        <div>
          <p className="font-display text-[17px] font-semibold leading-none text-white">
            {t('appName') || 'SatyaBid'}
          </p>
          <p className="mt-1 text-[11px] text-white/40">SIH 2026 · PS 26100</p>
        </div>
      </div>

      <div className="tricolor-rule mx-5 rounded-full" />

      {/* Primary nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-saffron-500 transition-opacity ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span className="w-4 shrink-0 text-center text-[13px]">{item.icon}</span>
                <span>{t(item.key) || item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Secondary nav */}
      <div className="border-t border-white/10 px-3 py-3">
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-white/30">
          Other roles
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                isActive ? 'bg-white/10 font-medium text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {t(item.key) || item.label}
          </NavLink>
        ))}
      </div>

      {/* User section */}
      {user && (
        <div className="border-t border-white/10 px-3 py-3">
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-saffron-500/20 text-sm font-bold text-saffron-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">{user.name}</p>
              <p className="text-[11px] capitalize text-white/40">{user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 w-full rounded-md px-3 py-1.5 text-left text-[13px] text-white/45 transition-colors hover:bg-white/5 hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
