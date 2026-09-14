import React from 'react';

/* ─────────────────────────────────────────────
   Card
   ───────────────────────────────────────────── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-line bg-surface-card shadow-card dark:bg-[#0f1e35] dark:border-[#1e2d47] ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 dark:border-[#1e2d47]">
      <div>
        <h3 className="font-display text-[17px] font-semibold text-ink-heading dark:text-slate-100">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-secondary dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PageHeader
   ───────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between dark:border-[#1e2d47]">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-display-md font-semibold text-ink-heading dark:text-slate-100">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-secondary dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   StatBox
   ───────────────────────────────────────────── */
export function StatBox({
  label,
  value,
  tone = 'neutral',
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  tone?: 'neutral' | 'good' | 'bad' | 'warn';
  hint?: string;
  icon?: string;
}) {
  const toneClass = {
    neutral: 'text-ink-heading dark:text-slate-100',
    good:    'text-status-verified',
    bad:     'text-status-fail',
    warn:    'text-status-review',
  }[tone];

  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-slate-500">{label}</p>
        {icon && <span className="text-base opacity-60">{icon}</span>}
      </div>
      <p className={`mt-2 font-display text-display-md font-semibold leading-none ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink-muted dark:text-slate-500">{hint}</p>}
    </Card>
  );
}

/* ─────────────────────────────────────────────
   StatusBadge
   ───────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; className: string; dot: string }> = {
  // Engine statuses
  PASS:             { label: 'Pass',           className: 'bg-status-verified/10 text-status-verified', dot: 'bg-status-verified' },
  FAIL:             { label: 'Fail',           className: 'bg-status-fail/10 text-status-fail',         dot: 'bg-status-fail' },
  CRITICAL:         { label: 'Critical',       className: 'bg-status-fail text-white',                  dot: 'bg-white' },
  WARNING:          { label: 'Warning',        className: 'bg-status-review/10 text-status-review',     dot: 'bg-status-review' },
  INFO:             { label: 'Info',           className: 'bg-status-info/10 text-status-info',         dot: 'bg-status-info' },
  // Compliance check statuses
  verified:         { label: 'Verified',       className: 'bg-status-verified/10 text-status-verified', dot: 'bg-status-verified' },
  non_compliant:    { label: 'Non-compliant',  className: 'bg-status-fail/10 text-status-fail',         dot: 'bg-status-fail' },
  missing:          { label: 'Missing',        className: 'bg-status-fail/10 text-status-fail',         dot: 'bg-status-fail' },
  expired:          { label: 'Expired',        className: 'bg-status-fail/10 text-status-fail',         dot: 'bg-status-fail' },
  inconsistent:     { label: 'Inconsistent',   className: 'bg-status-review/10 text-status-review',     dot: 'bg-status-review' },
  manual_review:    { label: 'Needs review',   className: 'bg-status-review/10 text-status-review',     dot: 'bg-status-review' },
  unable_to_verify: { label: 'Unable to verify', className: 'bg-navy-900/10 text-ink-secondary',        dot: 'bg-ink-muted' },
  not_applicable:   { label: 'Not applicable', className: 'bg-navy-900/10 text-ink-secondary',          dot: 'bg-ink-muted' },
  info:             { label: 'Info',           className: 'bg-status-info/10 text-status-info',         dot: 'bg-status-info' },
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_');
  const meta = STATUS_MAP[key] || STATUS_MAP[status] || {
    label: status || 'Unknown',
    className: 'bg-navy-900/10 text-ink-secondary',
    dot: 'bg-ink-muted',
  };
  return (
    <span className={`status-chip ${meta.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   RiskBadge
   ───────────────────────────────────────────── */
export function RiskBadge({ level }: { level?: string }) {
  const l = (level || 'UNKNOWN').toUpperCase();
  const styles: Record<string, string> = {
    LOW:      'bg-status-verified/10 text-status-verified',
    MEDIUM:   'bg-status-review/10 text-status-review',
    HIGH:     'bg-status-fail/10 text-status-fail',
    CRITICAL: 'bg-status-fail text-white',
    UNKNOWN:  'bg-navy-900/10 text-ink-secondary dark:text-slate-400',
  };
  return <span className={`status-chip font-semibold ${styles[l] || styles.UNKNOWN}`}>{l}</span>;
}

/* ─────────────────────────────────────────────
   Button
   ───────────────────────────────────────────── */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning';
  size?: 'sm' | 'md';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-500';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };
  const variants: Record<string, string> = {
    primary:   'bg-saffron-500 text-white hover:bg-saffron-600 shadow-sm',
    secondary: 'bg-navy-900 text-white hover:bg-navy-800',
    ghost:     'bg-transparent text-ink-heading hover:bg-navy-900/5 border border-line dark:text-slate-200 dark:hover:bg-white/5 dark:border-[#1e2d47]',
    danger:    'bg-status-fail text-white hover:bg-status-fail/90',
    warning:   'bg-status-review text-white hover:bg-status-review/90',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────
   EmptyState
   ───────────────────────────────────────────── */
export function EmptyState({ title, body, icon }: { title: string; body: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-navy-900/[0.02] px-6 py-12 text-center dark:border-[#1e2d47] dark:bg-white/[0.02]">
      {icon && <span className="text-3xl opacity-40">{icon}</span>}
      <p className="font-medium text-ink-heading dark:text-slate-200">{title}</p>
      <p className="max-w-md text-sm text-ink-secondary dark:text-slate-400">{body}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   InlineError
   ───────────────────────────────────────────── */
export function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-status-fail/25 bg-status-fail/5 px-4 py-3 text-sm text-status-fail">
      <span className="mt-0.5 shrink-0">⚠</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   InlineSuccess
   ───────────────────────────────────────────── */
export function InlineSuccess({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-status-verified/25 bg-status-verified/5 px-4 py-3 text-sm text-status-verified">
      <span className="mt-0.5 shrink-0">✓</span>
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Loader
   ───────────────────────────────────────────── */
export function Loader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-surface-card px-4 py-3 text-sm text-ink-secondary dark:bg-[#0f1e35] dark:border-[#1e2d47] dark:text-slate-400">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-navy-900/20 border-t-saffron-500 dark:border-white/10" />
      {label}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Table primitives
   ───────────────────────────────────────────── */
export function Table({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-line dark:border-[#1e2d47] ${className}`}>
      <table className="data-table">{children}</table>
    </div>
  );
}

export function THead({ columns }: { columns: React.ReactNode[] }) {
  return (
    <thead>
      <tr>
        {columns.map((c, i) => (
          <th key={i}>{c}</th>
        ))}
      </tr>
    </thead>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

/* ─────────────────────────────────────────────
   Eyebrow
   ───────────────────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/* ─────────────────────────────────────────────
   Modal — generic overlay dialog
   ───────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`relative z-10 w-full ${maxWidth} rounded-xl border border-line bg-surface-card shadow-elevated dark:bg-[#0f1e35] dark:border-[#1e2d47]`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-[#1e2d47]">
            <h2 className="font-display text-[17px] font-semibold text-ink-heading dark:text-slate-100">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted hover:bg-navy-900/5 hover:text-ink-secondary dark:hover:bg-white/5 dark:text-slate-500"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ConfirmDialog — Approve / Decline / Block
   ───────────────────────────────────────────── */
export type ConfirmAction = 'approve' | 'decline' | 'block';

export function ConfirmDialog({
  open,
  onClose,
  action,
  targetName,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  action: ConfirmAction;
  targetName: string;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const meta = {
    approve: {
      title: 'Approve bid',
      body: 'You are about to approve this bid. This action will be recorded in the audit trail.',
      confirmLabel: 'Confirm approval',
      variant: 'primary' as const,
      requireReason: false,
      icon: '✓',
    },
    decline: {
      title: 'Decline bid',
      body: 'You are declining this bid. Please provide a reason for your decision.',
      confirmLabel: 'Confirm decline',
      variant: 'danger' as const,
      requireReason: true,
      icon: '✕',
    },
    block: {
      title: 'Block vendor',
      body: 'Blocking this vendor will flag them as ineligible for future participation. This is an irreversible action in the prototype. Please confirm and provide a reason.',
      confirmLabel: 'Confirm block',
      variant: 'danger' as const,
      requireReason: true,
      icon: '⊘',
    },
  }[action];

  const handleConfirm = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 500));
    onConfirm(reason);
    setReason('');
    setBusy(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={meta.title}>
      <div className="space-y-4">
        {action === 'block' && (
          <div className="flex items-start gap-3 rounded-md border border-status-fail/25 bg-status-fail/5 px-3 py-3 text-sm text-status-fail">
            <span className="mt-0.5 text-base">⚠</span>
            <p>This action will flag <strong>{targetName}</strong> as blocked in the demo session. Blocking is not automatic disqualification — the Procurement Officer's final decision is always required.</p>
          </div>
        )}
        <p className="text-sm text-ink-secondary dark:text-slate-400">
          {meta.body}
        </p>
        <div className="rounded-md border border-line bg-surface-secondary px-3 py-2.5 dark:bg-[#0a1628] dark:border-[#1e2d47]">
          <p className="text-xs font-medium text-ink-secondary dark:text-slate-400">Target</p>
          <p className="mt-0.5 text-sm font-semibold text-ink-heading dark:text-slate-100">{targetName}</p>
        </div>
        {meta.requireReason && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-secondary dark:text-slate-400">
              Reason {action === 'block' ? '(required)' : '(optional)'}
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-line bg-surface-card px-3 py-2 text-sm text-ink-heading outline-none transition-colors focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100"
              placeholder={`Enter reason for ${action}…`}
            />
          </label>
        )}
        <div className="flex items-center justify-end gap-3 border-t border-line pt-3 dark:border-[#1e2d47]">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant={meta.variant}
            onClick={handleConfirm}
            disabled={busy || (meta.requireReason && action === 'block' && !reason.trim())}
            className="flex items-center gap-2"
          >
            {busy && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            )}
            {meta.icon} {meta.confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
