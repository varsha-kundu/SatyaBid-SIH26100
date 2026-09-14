import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/common/BrandMark';
import {
  IconAlert, IconArrow, IconAudit, IconDocument, IconScale, IconSearch, IconShield, IconUsers,
} from '../components/common/Icons';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../context/ThemeContext';
import { LANGUAGES } from '../i18n/languages';
import type { Lang } from '../types';

/* ── SVG theme icons ── */
function IconSun({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconMoon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Static content ── */
const STATS = [
  { value: '13+', label: 'Statutory verification sources' },
  { value: '100%', label: 'Officer retains final decision' },
  { value: '9', label: 'Compliance categories checked' },
  { value: '6', label: 'Synthetic demo bidders' },
];

const STEPS = [
  { n: '01', title: 'Read the NIT',        body: 'Eligibility clauses become a structured checklist.' },
  { n: '02', title: 'Collect documents',   body: 'Vendors upload GST, PAN, Udyam, ISO and related evidence.' },
  { n: '03', title: 'Extract fields',      body: 'OCR pulls identifiers and dates from submitted PDFs.' },
  { n: '04', title: 'Cross-check portals', body: 'Fields are compared with mock government records.' },
  { n: '05', title: 'Score the bid',       body: 'Each requirement contributes to a 0–100 score and risk band.' },
  { n: '06', title: 'Show the evidence',   body: 'Officers see clause, extracted value, portal value, and why.' },
  { n: '07', title: 'Record the decision', body: 'Qualify or disqualify with a reason. Everything is logged.' },
];

const CAPABILITIES = [
  { icon: IconDocument, title: 'OCR Document Intelligence',   body: 'GSTIN, PAN, CIN and Udyam numbers are pulled from bid PDFs so officers are not retyping certificates.' },
  { icon: IconSearch,   title: 'Multi-Source Cross-Check',   body: 'Extracted fields are compared with GST, PAN, MCA, Udyam, EPFO, ESIC, Startup India, NSIC, DigiLocker, debarment and OEM records.' },
  { icon: IconScale,    title: 'Explainable Compliance Score', body: 'Every 0–100 score traces to a requirement, a piece of evidence, and a confidence — never a black box.' },
  { icon: IconUsers,    title: 'Human-in-the-Loop Review',   body: 'Low-confidence or conflicting results go to the procurement officer. AI recommends; the officer decides.' },
  { icon: IconAlert,    title: 'Risk Classification',        body: 'Bids are Low, Medium, High or Critical. Suspected forgery or active debarment always needs manual review.' },
  { icon: IconAudit,    title: 'Tamper-Evident Audit Trail', body: 'Extractions, checks and overrides are timestamped and hashed so a decision can be reconstructed later.' },
];

const SOURCES = [
  'GST Portal', 'PAN / Income Tax', 'MCA21', 'Udyam / MSME', 'Startup India / DPIIT',
  'NSIC', 'EPFO', 'ESIC', 'DigiLocker', 'Make in India', 'BIS / ISO',
  'Debarment Registry', 'OEM Authorization',
];

const FAQ = [
  {
    q: 'Does SatyaBid qualify or disqualify a bidder automatically?',
    a: 'No. The platform is decision support. The authorised procurement officer records the final qualification or disqualification.',
  },
  {
    q: 'Are the government portal results live?',
    a: 'This prototype uses synthetic vendor records. Official GeM or GST APIs would need authorised credentials before any production use.',
  },
  {
    q: 'What can a vendor see?',
    a: 'Vendors can upload documents, run a pre-check against their GSTIN, and see missing slots. They cannot change verification results or the audit trail.',
  },
  {
    q: 'How is this different from a tender-discovery product?',
    a: "SatyaBid does not scrape 60+ portals to find work. It helps officers verify whether a submitted GeM bid meets the tender's own rules.",
  },
];

/* ── Inline evidence preview rows ── */
const EVIDENCE_ROWS = [
  { req: 'GST Registration',   source: 'GST Certificate · Page 1', status: 'Verified',     conf: '98%', color: '#15803d' },
  { req: 'Udyam / MSME',       source: 'Udyam Portal + Page 2',    status: 'Inconsistent', conf: '72%', color: '#b45309' },
  { req: 'OEM Authorization',  source: 'Not submitted',             status: 'Missing',      conf: '99%', color: '#b91c1c' },
  { req: 'Local Content ≥ 50%', source: 'Declaration · Page 4',    status: 'Needs Review', conf: '61%', color: '#b45309' },
];

/* ─────────────── Component ─────────────── */
export function Landing() {
  const { t, lang, setLang } = useI18n();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [fontScale, setFontScale] = useState(1);
  const [openFaq, setOpenFaq]     = useState<number | null>(0);
  const [menuOpen, setMenuOpen]   = useState(false);

  /* Design tokens */
  const body    = isDark ? '#0d1625' : '#f4f6f8';
  const altBody = isDark ? '#111f32' : '#ffffff';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : '#dce2e8';
  const cardBg  = isDark ? '#12203a' : '#ffffff';
  const iconBg  = isDark ? '#1a2f4a' : '#eef2f7';
  const text    = isDark ? '#e2e8f0' : '#1a2b3c';
  const muted   = isDark ? '#94a3b8' : '#51677a';

  return (
    <div
      style={{ fontSize: `${fontScale}em`, backgroundColor: body, color: text }}
      className="min-h-screen transition-colors duration-200"
    >

      {/* ══════════════════════════════════════
          TOP UTILITY BAR — accessibility strip
      ══════════════════════════════════════ */}
      <div
        style={{ backgroundColor: isDark ? '#040b18' : '#1a2b3c', borderBottom: `1px solid rgba(255,255,255,0.1)` }}
        className="flex h-9 items-center justify-between gap-3 overflow-x-auto px-4 text-[12px] sm:px-8"
      >
        <div className="flex items-center gap-3 whitespace-nowrap text-white/60">
          <a href="#main-content" className="hover:text-white/90 transition-colors">Skip to main content</a>
          <span className="h-3 w-px bg-white/20" />
          <label className="hidden items-center gap-1 sm:flex cursor-pointer">
            Language
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label="Choose language"
              className="cursor-pointer appearance-none bg-transparent text-white/70 outline-none ml-1"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="text-navy-950">{l.nativeName}</option>
              ))}
            </select>
          </label>
          <span className="hidden h-3 w-px bg-white/20 sm:block" />
          <span className="hidden items-center gap-1 sm:flex text-white/60">
            Text
            <button type="button" onClick={() => setFontScale((s) => Math.max(0.85, s - 0.1))} className="rounded px-1 hover:text-white" aria-label="Decrease font size">A-</button>
            <button type="button" onClick={() => setFontScale(1)} className="rounded px-1 hover:text-white" aria-label="Reset font size">A</button>
            <button type="button" onClick={() => setFontScale((s) => Math.min(1.3, s + 0.1))} className="rounded px-1 hover:text-white" aria-label="Increase font size">A+</button>
          </span>
        </div>
        {/* No SIH/Team identification in utility bar */}
      </div>

      <div className="tricolor-rule" />

      {/* ══════════════════════════════════════
          STICKY NAVIGATION
      ══════════════════════════════════════ */}
      <header
        id="main-content"
        style={{
          backgroundColor: isDark ? 'rgba(7,14,28,0.96)' : 'rgba(26,43,60,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
        className="sticky top-0 z-30"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-8">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <BrandMark size={32} />
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-white">{t('appName') || 'SatyaBid'}</p>
              <p className="text-[10px] text-white/40">GeM Bid Compliance</p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-5 md:flex ml-6 text-sm text-white/65">
            {[
              { href: '#product',  label: 'Product' },
              { href: '#workflow', label: 'How it works' },
              { href: '#sources',  label: 'Sources' },
              { href: '#officers', label: 'For officers' },
              { href: '#vendors',  label: 'For vendors' },
            ].map((n) => (
              <a key={n.href} href={n.href} className="hover:text-white transition-colors py-1 border-b border-transparent hover:border-saffron-500">
                {n.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              type="button"
              className="rounded p-1.5 text-white/70 md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-current" />
                <span className="block h-0.5 w-3.5 rounded-full bg-current" />
                <span className="block h-0.5 w-5 rounded-full bg-current" />
              </span>
            </button>

            {/* Dark/light toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-8 w-8 items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            >
              {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
            </button>

            {/* Sign in */}
            <Link
              to="/login"
              className="hidden rounded px-3 py-1.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors sm:inline"
            >
              Sign in
            </Link>

            {/* Primary CTA */}
            <Link
              to="/login?role=officer"
              className="inline-flex items-center gap-1.5 rounded px-4 py-2 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#F97316' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EA580C'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F97316'; }}
            >
              Officer workspace <IconArrow />
            </Link>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div
            style={{ borderTop: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(7,14,28,0.98)' }}
            className="px-4 py-3 md:hidden"
          >
            <div className="flex flex-col gap-2.5 text-sm text-white/70">
              <a href="#product"  onClick={() => setMenuOpen(false)} className="hover:text-white">Product</a>
              <a href="#workflow" onClick={() => setMenuOpen(false)} className="hover:text-white">How it works</a>
              <a href="#sources"  onClick={() => setMenuOpen(false)} className="hover:text-white">Sources</a>
              <a href="#officers" onClick={() => setMenuOpen(false)} className="hover:text-white">For officers</a>
              <a href="#vendors"  onClick={() => setMenuOpen(false)} className="hover:text-white">For vendors</a>
              <Link to="/login"   onClick={() => setMenuOpen(false)} className="hover:text-white">Sign in</Link>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════
          HERO — Full-width background image
          Unsplash government/parliament building
          royalty-free (Unsplash licence)
          Dark navy overlay at ~45% opacity
          Left-aligned content, no dashboard mockup
      ══════════════════════════════════════ */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: 580,
        }}
      >
        {/* ── Background image layer ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url('https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1600&q=80&fit=crop&auto=format')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            filter: 'brightness(0.55) saturate(0.8)',
            zIndex: 0,
          }}
        />

        {/* ── Dark navy colour overlay at ~42% ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(10,22,44,0.72) 0%, rgba(10,18,36,0.58) 60%, rgba(10,22,44,0.85) 100%)',
            zIndex: 1,
          }}
        />

        {/* ── Subtle grid texture ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 2,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            backgroundSize: '52px 52px',
            pointerEvents: 'none',
          }}
        />

        {/* ── Content ── */}
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-8 sm:pt-28" style={{ zIndex: 3 }}>

          {/* Eyebrow — NO SIH/Team Nexora */}
          <div
            style={{ border: '1px solid rgba(249,115,22,0.45)', backgroundColor: 'rgba(249,115,22,0.1)', color: '#fdba74' }}
            className="mb-6 inline-flex items-center gap-2 rounded px-3.5 py-1.5 text-xs font-semibold"
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F97316', display: 'inline-block', flexShrink: 0 }} />
            AI-assisted GeM bid compliance verification
          </div>

          {/* Headline */}
          <h1
            className="font-display font-bold text-white"
            style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.07, letterSpacing: '-0.01em', maxWidth: 720 }}
          >
            SatyaBid
          </h1>

          {/* Sub-heading */}
          <p className="mt-5 max-w-2xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
            SatyaBid extracts bidder documents, checks them against 13+ statutory sources, and presents a requirement-wise compliance picture.
            The officer still makes the call.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/login?role=officer')}
              className="inline-flex items-center gap-2 rounded px-7 py-3 text-sm font-semibold text-white transition-colors shadow-lg"
              style={{ backgroundColor: '#F97316' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EA580C'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F97316'; }}
            >
              Officer workspace <IconArrow />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login?role=vendor')}
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.9)' }}
              className="inline-flex items-center gap-2 rounded px-7 py-3 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              Vendor pre-check
            </button>
          </div>

          <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>
            Prototype — verification data is synthetic. Final qualification stays with the procurement officer.
          </p>

          {/* ── Stats strip ── */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  backgroundColor: 'rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 6,
                  padding: '14px 18px',
                }}
              >
                <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs leading-snug" style={{ color: 'rgba(255,255,255,0.52)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CAPABILITIES — white section
      ══════════════════════════════════════ */}
      <section
        id="product"
        style={{ backgroundColor: altBody, borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <p className="eyebrow">Platform capabilities</p>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-semibold" style={{ color: text }}>
            Built for GeM evaluation desks, not for hunting tenders.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                style={{
                  border: `1px solid ${border}`,
                  backgroundColor: cardBg,
                  borderRadius: 6,
                  padding: 24,
                  boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{ backgroundColor: iconBg, borderRadius: 4, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
                  className="text-saffron-600"
                >
                  <cap.icon />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold" style={{ color: text }}>{cap.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: muted }}>{cap.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          DARK STATISTICS SECTION
      ══════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1a2b3c 0%, #0f1f30 100%)',
          position: 'relative', overflow: 'hidden',
        }}
        className="py-16"
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
          backgroundSize: '48px 48px', pointerEvents: 'none',
        }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-8">
          <p className="eyebrow">Transparency &amp; Efficiency</p>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: '13+',  l: 'Verification sources checked per bid' },
              { v: '9',    l: 'Compliance categories evaluated' },
              { v: '100%', l: 'Evidence-backed decisions' },
              { v: '0',    l: 'Automatic disqualifications — officer decides' },
            ].map((s) => (
              <div key={s.l} style={{ borderLeft: '3px solid #F97316', paddingLeft: 16 }}>
                <p className="font-display text-3xl font-bold text-white">{s.v}</p>
                <p className="mt-1 text-sm leading-snug" style={{ color: 'rgba(255,255,255,0.55)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WORKFLOW — alternating light section
      ══════════════════════════════════════ */}
      <section
        id="workflow"
        style={{ backgroundColor: body, borderBottom: `1px solid ${border}` }}
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <p className="eyebrow">NIT to decision</p>
          <h2 className="mt-2 font-display text-3xl font-semibold" style={{ color: text }}>
            Seven steps, one audit trail.
          </h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {STEPS.map((step) => (
              <div key={step.n} style={{ border: `1px solid ${border}`, backgroundColor: cardBg, borderRadius: 6, padding: 16, boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#F97316', marginBottom: 8 }}>{step.n}</p>
                <h3 className="text-sm font-semibold" style={{ color: text }}>{step.title}</h3>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: muted }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          EVIDENCE / VERIFICATION PREVIEW
      ══════════════════════════════════════ */}
      <section
        style={{ backgroundColor: altBody, borderBottom: `1px solid ${border}` }}
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Evidence-backed verification</p>
              <h2 className="mt-2 font-display text-3xl font-semibold" style={{ color: text }}>
                Every finding traced to its source.
              </h2>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>
                SatyaBid maps each tender requirement to the exact document, page and portal record that supports or contradicts it.
                Officers see why — not just what.
              </p>
              <div className="mt-6 space-y-2.5 text-sm" style={{ color: muted }}>
                {['Requirement → Evidence → Source → Page → Status', 'Cross-document consistency detection', 'Confidence levels per check', 'Recommended action for each gap'].map((pt) => (
                  <div key={pt} className="flex items-start gap-2">
                    <span style={{ color: '#F97316', marginTop: 2, flexShrink: 0 }}>✓</span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => navigate('/login?role=officer')}
                className="mt-7 inline-flex items-center gap-1.5 rounded px-6 py-2.5 text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: '#F97316' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EA580C'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F97316'; }}
              >
                View requirement matrix <IconArrow />
              </button>
            </div>

            {/* Evidence table preview */}
            <div style={{ border: `1px solid ${border}`, borderRadius: 8, overflow: 'hidden', boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.08)' }}>
              {/* Table header */}
              <div style={{ backgroundColor: isDark ? '#0a1628' : '#1a2b3c', padding: '10px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Requirement Matrix — CPCL-TENDER-2026-089
                </p>
              </div>
              <div style={{ backgroundColor: cardBg }}>
                {/* Column headers */}
                <div
                  style={{
                    display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 80px 50px',
                    padding: '8px 16px', borderBottom: `1px solid ${border}`,
                    fontSize: 10, fontWeight: 700, color: muted, letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}
                >
                  <span>Requirement</span>
                  <span>Source / Evidence</span>
                  <span>Status</span>
                  <span>Conf.</span>
                </div>
                {EVIDENCE_ROWS.map((row) => (
                  <div
                    key={row.req}
                    style={{
                      display: 'grid', gridTemplateColumns: '1.4fr 1.6fr 80px 50px',
                      padding: '10px 16px', borderBottom: `1px solid ${border}`, alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{row.req}</span>
                    <span style={{ fontSize: 11, color: muted }}>{row.source}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: row.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: row.color, flexShrink: 0 }} />
                      {row.status}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: muted }}>{row.conf}</span>
                  </div>
                ))}
                <div style={{ padding: '8px 16px', borderTop: `1px solid ${border}` }}>
                  <p style={{ fontSize: 10, color: muted }}>Prototype · Synthetic verification data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          AI + HUMAN DECISION — dark section
      ══════════════════════════════════════ */}
      <section
        style={{
          background: isDark ? '#0d1625' : '#1a2b3c',
          borderBottom: `1px solid ${border}`,
        }}
        className="py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Human-in-the-loop</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-white">
                AI recommends.<br />The officer decides.
              </h2>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                SatyaBid is a decision-support platform, not an automated qualification engine.
                Every AI finding surfaces to the procurement officer with its evidence and reasoning.
                The final qualification or disqualification is always the officer's call.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: '⊕', label: 'AI Analyses', desc: 'Documents, portals, consistency' },
                  { icon: '◈', label: 'AI Explains', desc: 'Evidence-backed with confidence' },
                  { icon: '◉', label: 'Officer Decides', desc: 'Final authority always human' },
                ].map((item) => (
                  <div key={item.label} style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: 14, backgroundColor: 'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: 20, color: '#F97316', marginBottom: 6 }}>{item.icon}</div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'white', marginBottom: 4 }}>{item.label}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, overflow: 'hidden' }}>
              {/* AI Recommendation panel */}
              <div style={{ backgroundColor: 'rgba(249,115,22,0.12)', borderBottom: '1px solid rgba(249,115,22,0.25)', padding: '12px 18px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#fdba74', letterSpacing: '0.06em', textTransform: 'uppercase' }}>AI Recommendation</p>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: 18 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 12 }}>
                  "Bidder appears substantially compliant but requires resolution of 2 mandatory issues before final evaluation. Final decision rests with the Procurement Officer."
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  {[
                    { label: 'Accept recommendation', primary: true },
                    { label: 'Override decision', primary: false },
                    { label: 'Request clarification', primary: false },
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      style={{
                        border: btn.primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        backgroundColor: btn.primary ? '#F97316' : 'rgba(255,255,255,0.06)',
                        color: 'white', borderRadius: 4, padding: '6px 12px',
                        fontSize: 11, fontWeight: 600, cursor: 'default',
                      }}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
                <p style={{ marginTop: 10, fontSize: 10, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
                  Prototype interface — AI assessment is advisory only
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOR OFFICERS / VENDORS — white section
      ══════════════════════════════════════ */}
      <section
        style={{ backgroundColor: altBody, borderBottom: `1px solid ${border}` }}
        className="py-20"
      >
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-8 lg:grid-cols-2">
          <div id="officers" style={{ borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : border}` }} className="lg:pr-12">
            <p className="eyebrow">For procurement officers</p>
            <h2 className="mt-2 font-display text-2xl font-semibold" style={{ color: text }}>
              See every clause next to its evidence.
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>
              Parse the NIT into a checklist, run a bid through OCR and portal checks, open the requirement matrix, override a finding with a reason, and print a report.
            </p>
            <button type="button" onClick={() => navigate('/login?role=officer')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#F97316' }}>
              Open officer workspace <IconArrow />
            </button>
          </div>
          <div id="vendors" className="lg:pl-2">
            <p className="eyebrow">For bidders</p>
            <h2 className="mt-2 font-display text-2xl font-semibold" style={{ color: text }}>
              Pre-check before you submit.
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: muted }}>
              Upload required slots, see what is still missing, and run a GSTIN pre-check against the demo registry. You cannot edit scores or audit records — those stay with the officer.
            </p>
            <button type="button" onClick={() => navigate('/login?role=vendor')}
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: '#F97316' }}>
              Open vendor portal <IconArrow />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          SOURCES
      ══════════════════════════════════════ */}
      <section id="sources" style={{ backgroundColor: body, borderBottom: `1px solid ${border}` }} className="py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-8">
          <p className="eyebrow">Regulatory coverage</p>
          <h2 className="mt-2 font-display text-3xl font-semibold" style={{ color: text }}>
            13+ verification sources
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: muted }}>
            Prototype responses are synthetic. Unavailable sources are labelled "unable to verify", never treated as automatic failure.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {SOURCES.map((s) => (
              <span key={s} style={{ border: `1px solid ${border}`, backgroundColor: cardBg, borderRadius: 4, padding: '5px 14px', fontSize: 13, color: muted, boxShadow: isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FAQ
      ══════════════════════════════════════ */}
      <section style={{ backgroundColor: altBody, borderBottom: `1px solid ${border}` }} className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-2 font-display text-3xl font-semibold" style={{ color: text }}>
            Straight answers for evaluators.
          </h2>
          <div className="mt-8" style={{ borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}` }}>
            {FAQ.map((item, i) => (
              <div key={item.q} style={{ borderBottom: i < FAQ.length - 1 ? `1px solid ${border}` : 'none' }}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-semibold" style={{ color: text }}>{item.q}</span>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%',
                    border: `1px solid ${border}`, backgroundColor: cardBg,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, flexShrink: 0, color: muted,
                  }}>
                    {openFaq === i ? '–' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p className="pb-4 text-sm leading-relaxed" style={{ color: muted }}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA — dark navy section
      ══════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #1a2b3c 0%, #0f1f30 100%)', position: 'relative', overflow: 'hidden' }} className="py-16 text-white">
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-8">
          <h2 className="font-display text-3xl font-semibold text-white">Ready to run the demo?</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Sign in as an officer or vendor. The full pipeline — OCR, portal checks, scoring — uses the synthetic dataset.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/login?role=officer"
              className="inline-flex items-center rounded px-7 py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: '#F97316' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#EA580C'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#F97316'; }}>
              Officer sign in
            </Link>
            <Link to="/login?role=vendor"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}
              className="inline-flex items-center rounded px-7 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">
              Vendor sign in
            </Link>
          </div>
          <p className="mt-5 text-xs" style={{ color: 'rgba(255,255,255,0.28)' }}>
            AI recommendation is advisory. Final qualification/disqualification rests with the Procurement Officer.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#0a1020', borderTop: '1px solid rgba(255,255,255,0.07)' }} className="py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand col */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <BrandMark size={28} />
                <span className="font-display font-semibold text-white">SatyaBid</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                AI-powered bid compliance verification for GeM procurement. Decision support — not automated awards.
              </p>
            </div>
            {/* Product col */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Product</p>
              <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {[
                  { label: 'Bid Verification', to: '/app/bid-verification' },
                  { label: 'Requirements',     to: '/app/tenders' },
                  { label: 'Evidence Viewer',  to: '/app/bid-verification' },
                  { label: 'Reports',          to: '/app/reports' },
                  { label: 'Audit Trail',      to: '/app/audit-trail' },
                ].map((l) => (
                  <div key={l.label}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></div>
                ))}
              </div>
            </div>
            {/* Roles col */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Roles</p>
              <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {[
                  { label: 'Officer Workspace', to: '/login?role=officer' },
                  { label: 'Vendor Portal',     to: '/login?role=vendor' },
                  { label: 'Human Review',      to: '/app/human-review' },
                  { label: 'Auditor View',      to: '/app/auditor' },
                  { label: 'System Health',     to: '/app/system-health' },
                ].map((l) => (
                  <div key={l.label}><Link to={l.to} className="hover:text-white transition-colors">{l.label}</Link></div>
                ))}
              </div>
            </div>
            {/* Resources col */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Resources</p>
              <div className="space-y-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <div><a href="#workflow" className="hover:text-white transition-colors">How it works</a></div>
                <div><a href="#sources"  className="hover:text-white transition-colors">Verification sources</a></div>
                <div><a href="#product"  className="hover:text-white transition-colors">Capabilities</a></div>
                <div><a href="#officers" className="hover:text-white transition-colors">For officers</a></div>
                <div><a href="#vendors"  className="hover:text-white transition-colors">For vendors</a></div>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: 40, paddingTop: 20 }}
            className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
              © 2026 SatyaBid · AI-Powered GeM Bid Compliance Verification
            </p>
            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.28)' }}>
              Prototype interface — verification data is synthetic. Final qualification remains with the procurement officer.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
