import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { LANGUAGES } from '../../i18n/languages';
import type { Lang } from '../../types';

/* Inline SVG sun/moon — no emoji, no extra file */
function SunIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface TopbarProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export function Topbar({ title, subtitle, onMenuToggle }: TopbarProps) {
  const { t, lang, setLang } = useI18n();
  const { status, recheck } = useBackendHealth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user } = useAuth();

  const statusMeta = {
    checking: { dot: 'bg-ink-muted', label: t('backend_checking') || 'Checking…' },
    online:   { dot: 'bg-status-verified', label: t('backend_online') || 'Backend online' },
    offline:  { dot: 'bg-status-fail', label: t('backend_offline') || 'Backend offline' },
  }[status];

  return (
    <header className="border-b border-line bg-surface-card px-4 py-3 sm:px-6 dark:bg-[#0f1e35] dark:border-[#1e2d47]">
      <div className="flex items-center justify-between gap-3">
        {/* Left: mobile menu + title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuToggle}
            className="flex h-8 w-8 items-center justify-center rounded-md text-ink-secondary hover:bg-navy-900/5 md:hidden dark:text-slate-400 dark:hover:bg-white/5"
            aria-label="Open navigation"
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-3.5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-display-sm font-semibold text-ink-heading dark:text-slate-100">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden truncate text-xs text-ink-secondary sm:block dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Language selector */}
          <label className="hidden items-center gap-1.5 rounded-full border border-line bg-surface-card px-2.5 py-1.5 text-xs font-medium text-ink-secondary sm:flex dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-400">
            <span aria-hidden="true">🌐</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Choose language"
              className="cursor-pointer appearance-none bg-transparent pr-1 text-ink outline-none dark:text-slate-300"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName}
                </option>
              ))}
            </select>
          </label>

          {/* Dark mode toggle — SVG sun/moon */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface-card text-ink-secondary transition-colors hover:bg-surface-secondary dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-400 dark:hover:bg-[#142038]"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Backend health */}
          <button
            onClick={recheck}
            title="Recheck backend connection"
            className="hidden items-center gap-2 rounded-full border border-line bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-secondary sm:flex dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-400 dark:hover:bg-[#142038]"
          >
            <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </button>

          {/* User avatar */}
          {user && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-saffron-500/15 text-sm font-bold text-saffron-600 dark:bg-saffron-500/20 dark:text-saffron-400"
              title={`${user.name} (${user.role})`}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
