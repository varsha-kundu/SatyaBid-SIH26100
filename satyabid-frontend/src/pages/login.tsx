import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BrandMark } from '../components/common/BrandMark';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../context/AuthContext';
import { LANGUAGES } from '../i18n/languages';
import type { Lang } from '../types';

type AuthMode = 'signin' | 'signup';

const ROLE_META: Record<UserRole, {
  heading: string;
  subtitle: string;
  destination: string;
  idLabel: string;
  idPlaceholder: string;
  icon: string;
}> = {
  officer: {
    heading: 'Procurement Officer',
    subtitle: 'Review bids, resolve flagged discrepancies, and record final qualification decisions.',
    destination: '/app/dashboard',
    idLabel: 'Officer ID or email',
    idPlaceholder: 'a.officer@department.gov.in',
    icon: '🏛',
  },
  vendor: {
    heading: 'Vendor / Bidder',
    subtitle: 'Upload bid documents, track your submission status, and respond to officer queries.',
    destination: '/app/vendor-portal',
    idLabel: 'Vendor ID or email',
    idPlaceholder: 'contact@yourcompany.com',
    icon: '🏢',
  },
};

export function Login() {
  const { t, lang, setLang } = useI18n();
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read ?role= from landing-page links so the correct tab is pre-selected
  const searchParams = new URLSearchParams(location.search);
  const urlRole = searchParams.get('role') as UserRole | null;
  const [role, setRole] = useState<UserRole>(
    urlRole === 'vendor' ? 'vendor' : 'officer',
  );
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = ROLE_META[role];
  // After login, go to the page the user was trying to reach, or the role default
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || meta.destination;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email || meta.idPlaceholder, password, role);
      navigate(from, { replace: true });
    } catch {
      setError('Sign in failed. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(role);
      navigate(from, { replace: true });
    } catch {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl bg-navy-900 shadow-elevated lg:grid-cols-[1fr_1.1fr]">

        {/* ── Left brand panel ── */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-8 lg:flex">
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'radial-gradient(120% 90% at 15% 0%, #2B4F6E 0%, #122C44 38%, #081826 78%)' }}
          />
          {/* Decorative rings */}
          <svg
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-[380px] w-[380px] opacity-[0.12]"
            viewBox="0 0 400 400"
          >
            <circle cx="200" cy="200" r="190" fill="none" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="140" fill="none" stroke="#F8FAFC" strokeWidth="1" />
            <circle cx="200" cy="200" r="90" fill="none" stroke="#F97316" strokeWidth="1.5" />
            <circle cx="200" cy="200" r="40" fill="none" stroke="#F8FAFC" strokeWidth="0.8" />
          </svg>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BrandMark size={30} />
              <span className="font-display text-lg font-semibold text-white">{t('appName') || 'SatyaBid'}</span>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
            >
              ← Back to home
            </Link>
          </div>

          <div className="relative">
            <p className="eyebrow mb-3 text-saffron-500">GeM Procurement · SIH 2026</p>
            <h2 className="max-w-sm font-display text-display-lg font-semibold leading-[1.1] text-white">
              Verified bids,<br />trusted decisions.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
              Every requirement traced to its evidence. Every score explainable. Every decision auditable.
            </p>
            {/* Role selector on left panel */}
            <div className="mt-8 grid grid-cols-2 gap-2">
              {(['officer', 'vendor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border p-3 text-left text-xs transition-all ${
                    role === r
                      ? 'border-saffron-500 bg-saffron-500/15 text-white'
                      : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/70'
                  }`}
                >
                  <div className="text-base mb-1">{ROLE_META[r].icon}</div>
                  <div className="font-semibold">{ROLE_META[r].heading}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right form panel ── */}
        <div className="bg-surface-card px-6 py-10 sm:px-10 dark:bg-[#0f1e35]">
          {/* Mobile header */}
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <div className="flex items-center gap-2">
              <BrandMark size={26} />
              <span className="font-display text-base font-semibold text-ink-heading dark:text-slate-100">
                {t('appName') || 'SatyaBid'}
              </span>
            </div>
            <label className="flex items-center gap-1 text-xs text-ink-secondary">
              <span aria-hidden="true">🌐</span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                aria-label="Choose language"
                className="cursor-pointer appearance-none bg-transparent outline-none dark:text-slate-300"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.nativeName}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mx-auto max-w-sm">
            {/* Mode tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-secondary p-1 mb-6 dark:bg-[#142038] dark:border-[#1e2d47]">
              {(['signin', 'signup'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    mode === m
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-ink-secondary hover:text-ink-heading dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            <h1 className="font-display text-display-sm font-semibold text-ink-heading dark:text-slate-100">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="mt-1 text-sm text-ink-secondary dark:text-slate-400">
              {mode === 'signin'
                ? 'Sign in to access your SatyaBid workspace.'
                : 'Register to submit bids or review compliance results.'}
            </p>

            {/* Role toggle (mobile/form) */}
            <div className="mt-5 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-secondary p-1 dark:bg-[#142038] dark:border-[#1e2d47]">
              {(['officer', 'vendor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    role === r
                      ? 'bg-navy-900 text-white shadow-sm'
                      : 'text-ink-secondary hover:text-ink-heading dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  aria-pressed={role === r}
                >
                  {ROLE_META[r].heading}
                </button>
              ))}
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-secondary dark:text-slate-400">
              {meta.subtitle}
            </p>

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-status-fail/25 bg-status-fail/5 px-3 py-2.5 text-sm text-status-fail">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-secondary dark:text-slate-400">Full name / Organisation name</span>
                  <input
                    type="text"
                    placeholder="Your name or organisation"
                    className="w-full rounded-md border border-line bg-surface-card px-3.5 py-2.5 text-sm text-ink-heading outline-none transition-colors placeholder:text-ink-muted focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-secondary dark:text-slate-400">{meta.idLabel}</span>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={meta.idPlaceholder}
                  className="w-full rounded-md border border-line bg-surface-card px-3.5 py-2.5 text-sm text-ink-heading outline-none transition-colors placeholder:text-ink-muted focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:placeholder:text-slate-600"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-secondary dark:text-slate-400">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-md border border-line bg-surface-card px-3.5 py-2.5 pr-10 text-sm text-ink-heading outline-none transition-colors placeholder:text-ink-muted focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted hover:text-ink-secondary"
                  >
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </label>

              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-secondary dark:text-slate-400">Confirm password</span>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    className="w-full rounded-md border border-line bg-surface-card px-3.5 py-2.5 text-sm text-ink-heading outline-none transition-colors placeholder:text-ink-muted focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:placeholder:text-slate-600"
                  />
                </label>
              )}

              {mode === 'signin' && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-ink-secondary dark:text-slate-400">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-line accent-saffron-500" />
                    Remember me
                  </label>
                  <a href="#forgot" className="font-medium text-ink-link hover:underline text-xs">Forgot password?</a>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-saffron-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                {mode === 'signin' ? `Sign in as ${meta.heading}` : `Create ${meta.heading} account`}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3 text-xs text-ink-muted dark:text-slate-500">
              <span className="h-px flex-1 bg-line dark:bg-[#1e2d47]" />
              or continue with
              <span className="h-px flex-1 bg-line dark:bg-[#1e2d47]" />
            </div>

            <div className="space-y-2.5">
              {/* Google sign-in */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-line bg-surface-card px-4 py-2.5 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-secondary disabled:opacity-50 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:hover:bg-[#142038]"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* GeM SSO */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-md border border-line bg-surface-card px-3 py-2 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-secondary dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:hover:bg-[#142038]"
                  title="GeM SSO – requires official GeM credentials (not available in prototype)"
                >
                  <span aria-hidden="true">🔐</span>
                  GeM SSO
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-md border border-line bg-surface-card px-3 py-2 text-sm font-medium text-ink-heading transition-colors hover:bg-surface-secondary dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100 dark:hover:bg-[#142038]"
                  title="DigiLocker SSO – requires DigiLocker integration (not available in prototype)"
                >
                  <span aria-hidden="true">📄</span>
                  DigiLocker
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-ink-muted dark:text-slate-500">
              By continuing you agree to the{' '}
              <a href="#terms" className="font-medium text-ink-link hover:underline">Terms &amp; Conditions</a>.
            </p>

            <p className="mt-3 text-center text-xs text-ink-muted dark:text-slate-500">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="font-medium text-ink-link hover:underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
