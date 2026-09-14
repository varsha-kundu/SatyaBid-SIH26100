import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, Button, StatusBadge } from '../components/common/UI';
import { DEMO_NIT_CLAUSES } from '../utils/complianceUi';

const CATEGORY_COLORS: Record<string, string> = {
  Financial:    'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Eligibility:  'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  Statutory:    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Technical:    'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Declarations: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Social:       'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  Integrity:    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const TENDER_META = {
  id:         'CPCL-TENDER-2026-089',
  title:      'Supply of High-Pressure Seamless Steel Pipes',
  issuer:     'Chennai Petroleum Corporation Ltd (CPCL)',
  deadline:   '30 September 2026',
  value:      '₹ 4.20 Crore (estimated)',
  emd:        '₹ 8,40,000',
  category:   'Manufacturing / Industrial Supplies',
  note:       'Synthetic demo NIT — all requirements and thresholds are illustrative only.',
};

export function Tenders() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(DEMO_NIT_CLAUSES.map((c) => c.category)))];
  const filtered = selectedCategory === 'All'
    ? DEMO_NIT_CLAUSES
    : DEMO_NIT_CLAUSES.filter((c) => c.category === selectedCategory);

  const mandatoryCount  = DEMO_NIT_CLAUSES.filter((c) => c.mandatory).length;
  const optionalCount   = DEMO_NIT_CLAUSES.filter((c) => !c.mandatory).length;

  return (
    <div className="space-y-5">
      {/* Tender header card */}
      <Card>
        <div className="px-5 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Notice inviting tender</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-ink-heading dark:text-slate-100">
                {TENDER_META.title}
              </h2>
              <p className="mt-0.5 text-sm text-ink-secondary dark:text-slate-400">
                {TENDER_META.id} · {TENDER_META.issuer}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/app/bid-verification')}
            >
              Verify a bid →
            </Button>
          </div>

          {/* Meta grid */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Estimated value', value: TENDER_META.value },
              { label: 'EMD (bid security)', value: TENDER_META.emd },
              { label: 'Closing date', value: TENDER_META.deadline },
              { label: 'Category', value: TENDER_META.category },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-line bg-surface-secondary px-3 py-2.5 dark:border-[#1e2d47] dark:bg-[#0a1628]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">{m.label}</p>
                <p className="mt-0.5 text-sm font-medium text-ink-heading dark:text-slate-100">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Counts + prototype note */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-status-fail/10 px-2.5 py-1 text-xs font-semibold text-status-fail">
              {mandatoryCount} mandatory
            </span>
            <span className="rounded-full bg-navy-900/8 px-2.5 py-1 text-xs font-medium text-ink-secondary dark:bg-white/8 dark:text-slate-400">
              {optionalCount} optional
            </span>
            <span className="rounded-full bg-saffron-500/10 px-2.5 py-1 text-xs font-medium text-saffron-700 dark:text-saffron-400">
              Prototype · Synthetic NIT
            </span>
          </div>
        </div>
      </Card>

      {/* Requirements table */}
      <Card>
        <CardHeader
          title="Eligibility &amp; compliance requirements"
          subtitle={`${filtered.length} requirement${filtered.length !== 1 ? 's' : ''} shown`}
          action={
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-navy-900 text-white dark:bg-saffron-500'
                      : 'bg-surface-secondary text-ink-secondary hover:bg-navy-900/10 dark:bg-[#142038] dark:text-slate-400 dark:hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          }
        />

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[28%]">Requirement</th>
                <th className="hidden sm:table-cell w-[10%]">Category</th>
                <th className="w-[8%]">Type</th>
                <th className="hidden md:table-cell w-[14%]">Threshold / evidence</th>
                <th className="hidden lg:table-cell">Tender clause</th>
                <th className="hidden xl:table-cell w-[18%]">Verification rule</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id}>
                  <td>
                    <p className="font-medium text-ink-heading dark:text-slate-100">{req.title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-ink-muted dark:text-slate-500">{req.id}</p>
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      CATEGORY_COLORS[req.category] ?? 'bg-surface-secondary text-ink-secondary'
                    }`}>
                      {req.category}
                    </span>
                  </td>
                  <td>
                    {req.mandatory ? (
                      <span className="inline-flex rounded-full bg-status-fail/10 px-2 py-0.5 text-[11px] font-semibold text-status-fail">
                        Mandatory
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-navy-900/8 px-2 py-0.5 text-[11px] text-ink-muted dark:bg-white/8 dark:text-slate-500">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="hidden md:table-cell">
                    <p className="text-xs font-semibold text-ink-heading dark:text-slate-100">{req.threshold}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted dark:text-slate-500">{req.evidence}</p>
                  </td>
                  <td className="hidden lg:table-cell max-w-xs text-xs leading-relaxed text-ink-secondary dark:text-slate-400">
                    {req.clause}
                  </td>
                  <td className="hidden xl:table-cell text-xs text-ink-secondary dark:text-slate-400">
                    {req.rule}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Prototype note */}
      <p className="text-xs text-ink-muted dark:text-slate-600">
        <strong>Prototype:</strong> {TENDER_META.note} Connect a real NIT parser to populate this from an uploaded PDF.
      </p>
    </div>
  );
}
