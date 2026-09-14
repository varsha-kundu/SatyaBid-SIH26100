import React, { useRef, useState } from 'react';
import {
  Card, CardHeader, Button, InlineError, InlineSuccess, Loader,
  StatusBadge, RiskBadge, EmptyState,
} from '../components/common/UI';
import { apiClient } from '../services/api/apiClient';
import { ApiError } from '../services/api/apiClient';
import { sessionStore } from '../services/sessionStore';
import { useAuth } from '../context/AuthContext';

/* ── Document slot definitions ── */
interface DocSlot {
  key: string;
  label: string;
  required: boolean;
  hint: string;
}

const DOC_SLOTS: DocSlot[] = [
  { key: 'pan',        label: 'PAN Card',                  required: true,  hint: 'Permanent Account Number card of the bidding entity.' },
  { key: 'gst',        label: 'GST Registration Certificate', required: true,  hint: 'Valid GST certificate showing active GSTIN.' },
  { key: 'itr',        label: 'ITR — 3 Years',             required: true,  hint: 'Income tax returns for the last 3 financial years.' },
  { key: 'experience', label: 'Experience Certificate',    required: true,  hint: 'Work orders or certificates proving ≥5 years similar supply.' },
  { key: 'turnover',   label: 'Turnover Certificate',      required: true,  hint: 'CA-certified turnover statement showing ≥₹10 Cr average.' },
  { key: 'iso',        label: 'ISO 9001 Certificate',      required: true,  hint: 'Valid ISO 9001 quality management certification.' },
  { key: 'udyam',      label: 'Udyam Registration',        required: false, hint: 'Required only if claiming MSME exemption from EMD.' },
  { key: 'oem',        label: 'OEM Authorization Letter',  required: false, hint: 'Required if bidding on behalf of original equipment manufacturer.' },
];

const STAGES = ['Draft', 'AI Checked', 'Submitted', 'Under Review', 'Approved'] as const;
type Stage = 0 | 1 | 2 | 3 | 4;

/* GSTIN → sample bid mapping for AI pre-check */
const GSTIN_TO_BID: Record<string, string> = {
  '07AAACA1234K1Z2': 'bid_form_bid_apx_2026_089.pdf',
  '27AABCB5678L1Z9': 'bid_form_bid_bhv_2026_089.pdf',
  '06AACCC9999M1Z4': 'bid_form_bid_sec_2026_089.pdf',
  '33AAACD4444N1Z1': 'bid_form_bid_zna_2026_089.pdf',
  '19AAAEE7777P1Z5': 'bid_form_bid_epc_2026_089.pdf',
  '24AAAFG8888Q1Z6': 'bid_form_bid_waf_2026_089.pdf',
};

export function VendorPortal() {
  const { user } = useAuth();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [bidStage, setBidStage]         = useState<Stage>(0);
  const [uploads, setUploads]           = useState<Record<string, File>>({});
  const [gstin, setGstin]               = useState('07AAACA1234K1Z2');

  const [preResult, setPreResult]       = useState<Record<string, unknown> | null>(null);
  const [preLoading, setPreLoading]     = useState(false);
  const [preError, setPreError]         = useState<string | null>(null);

  const [aiResult, setAiResult]         = useState<Record<string, unknown> | null>(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiError, setAiError]           = useState<string | null>(null);

  const [submitted, setSubmitted]       = useState(false);
  const [submitMsg, setSubmitMsg]       = useState<string | null>(null);

  /* ── Document completeness logic ── */
  const requiredSlots  = DOC_SLOTS.filter((d) => d.required);
  const missingRequired = requiredSlots.filter((d) => !uploads[d.key]);
  const uploadedCount  = DOC_SLOTS.filter((d) => uploads[d.key]).length;
  const canSubmit      = missingRequired.length === 0;
  const readinessPct   = Math.round((uploadedCount / DOC_SLOTS.length) * 100);

  const handleFile = (key: string, file?: File) => {
    if (!file) return;
    setUploads((prev) => ({ ...prev, [key]: file }));
  };

  /* Step 1 — pre-verify GSTIN */
  const runPreVerify = async () => {
    if (!gstin.trim()) return;
    setPreError(null);
    setPreLoading(true);
    try {
      const res = await apiClient.preVerify(gstin.trim());
      setPreResult(res as Record<string, unknown>);
    } catch (err) {
      setPreError(err instanceof ApiError ? err.message : 'Pre-verification failed.');
    } finally {
      setPreLoading(false);
    }
  };

  /* Step 2 — AI compliance pre-check */
  const runAiCheck = async () => {
    setAiError(null);
    setAiLoading(true);
    try {
      const sourceFile = GSTIN_TO_BID[gstin.trim().toUpperCase()] ?? 'bid_form_bid_apx_2026_089.pdf';
      const res = await apiClient.verifyCompliance({ source_file: sourceFile, fields: { gstin: gstin.trim() } }) as Record<string, unknown>;
      setAiResult(res);
      sessionStore.recordVerification(sourceFile, res as never);
      setBidStage(1);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : 'AI compliance check failed.');
    } finally {
      setAiLoading(false);
    }
  };

  /* Step 3 — submit */
  const submitBid = () => {
    setSubmitted(true);
    setSubmitMsg(`Bid for CPCL-TENDER-2026-089 submitted successfully. Current stage: ${STAGES[2]}.`);
    setBidStage(2);
    setTimeout(() => setBidStage(3), 1500);
  };

  return (
    <div className="space-y-5">
      {/* Vendor identity bar */}
      <div className="rounded-lg border border-line bg-surface-card px-5 py-4 shadow-card dark:bg-[#0f1e35] dark:border-[#1e2d47]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">Vendor portal</p>
            <p className="mt-0.5 font-display text-lg font-semibold text-ink-heading dark:text-slate-100">
              {user?.name ?? 'Vendor'}
            </p>
            <p className="text-xs text-ink-muted dark:text-slate-500">{user?.email ?? 'vendor@example.com'}</p>
          </div>
          <div className="rounded-md border border-line bg-surface-secondary px-3 py-2 dark:bg-[#0a1628] dark:border-[#1e2d47]">
            <p className="text-[10px] text-ink-muted dark:text-slate-500">Active tender</p>
            <p className="text-sm font-semibold text-ink-heading dark:text-slate-100">CPCL-TENDER-2026-089</p>
          </div>
        </div>
      </div>

      {/* Bid stage tracker */}
      <Card>
        <CardHeader title="Bid progression" subtitle="Track your submission through each stage" />
        <div className="overflow-x-auto px-5 py-5">
          <ol className="flex min-w-[500px] items-center">
            {STAGES.map((s, i) => (
              <React.Fragment key={s}>
                <li className="flex flex-col items-center gap-2 text-center">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    i < bidStage  ? 'border-status-verified bg-status-verified text-white'
                    : i === bidStage ? 'border-saffron-500 bg-saffron-50 text-saffron-700 dark:bg-saffron-500/15 dark:text-saffron-400'
                    : 'border-line text-ink-muted dark:border-[#1e2d47] dark:text-slate-500'
                  }`}>
                    {i < bidStage ? '✓' : i + 1}
                  </span>
                  <span className={`text-xs font-medium ${i <= bidStage ? 'text-ink-heading dark:text-slate-100' : 'text-ink-muted dark:text-slate-500'}`}>
                    {s}
                  </span>
                </li>
                {i < STAGES.length - 1 && (
                  <div className={`mx-2 flex-1 h-0.5 rounded ${i < bidStage ? 'bg-status-verified' : 'bg-line dark:bg-[#1e2d47]'}`} />
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </Card>

      {/* Step 1 — GSTIN pre-verify */}
      <Card>
        <CardHeader title="Step 1 — Pre-verify GSTIN" subtitle="Check your GSTIN before uploading documents" />
        <div className="space-y-3 p-5">
          <div className="flex gap-3">
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="Enter GSTIN…"
              className="flex-1 rounded-md border border-line px-3 py-2.5 font-mono text-sm outline-none transition-colors focus:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-100"
            />
            <Button onClick={runPreVerify} disabled={preLoading || !gstin.trim()}>
              {preLoading ? 'Checking…' : 'Pre-verify'}
            </Button>
          </div>
          {preLoading && <Loader label="Querying government portal registry…" />}
          {preError   && <InlineError message={preError} />}
          {preResult  && (
            <div className="rounded-md border border-line bg-surface-secondary p-4 dark:bg-[#0a1628] dark:border-[#1e2d47]">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-muted dark:text-slate-500">Pre-verification result</p>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-ink-secondary dark:text-slate-400">
                {JSON.stringify(preResult, null, 2)}
              </pre>
            </div>
          )}
          <p className="text-xs text-ink-muted dark:text-slate-600">
            Demo GSTINs: <code>07AAACA1234K1Z2</code> (compliant) · <code>06AACCC9999M1Z4</code> (debarred) · <code>33AAACD4444N1Z1</code> (turnover gap)
          </p>
        </div>
      </Card>

      {/* Step 2 — Document upload */}
      <Card>
        <CardHeader
          title="Step 2 — Upload bid documents"
          subtitle={`${uploadedCount} of ${DOC_SLOTS.length} documents uploaded`}
          action={
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                canSubmit ? 'bg-status-verified/10 text-status-verified' : 'bg-status-fail/10 text-status-fail'
              }`}>
                {canSubmit ? '✓ All required docs present' : `${missingRequired.length} required missing`}
              </span>
            </div>
          }
        />

        {/* ── Missing document warning ── */}
        {missingRequired.length > 0 && (
          <div className="mx-5 mb-1 mt-4 rounded-lg border border-status-fail/30 bg-status-fail/5 px-4 py-3 dark:bg-status-fail/10">
            <p className="text-sm font-semibold text-status-fail">
              ⚠ {missingRequired.length} mandatory document{missingRequired.length > 1 ? 's are' : ' is'} missing
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {missingRequired.map((d) => (
                <li key={d.key} className="flex items-center gap-2 text-xs text-status-fail">
                  <span>•</span>
                  <strong>{d.label}</strong>
                  <span className="text-status-fail/70">— {d.hint}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs font-medium text-status-fail">
              Ready to submit: NO — upload the missing mandatory documents before proceeding.
            </p>
          </div>
        )}

        {/* Readiness meter */}
        <div className="mx-5 my-4">
          <div className="flex items-center justify-between text-xs text-ink-muted dark:text-slate-500 mb-1">
            <span>Document readiness</span>
            <span className="font-semibold">{readinessPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-secondary dark:bg-[#142038]">
            <div
              className={`h-1.5 rounded-full transition-all ${canSubmit ? 'bg-status-verified' : 'bg-saffron-500'}`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>
        </div>

        {/* Document grid */}
        <div className="grid gap-3 p-5 pt-0 sm:grid-cols-2 lg:grid-cols-4">
          {DOC_SLOTS.map((slot) => {
            const file = uploads[slot.key];
            return (
              <div key={slot.key} className={`rounded-lg border p-3 transition-colors ${
                file
                  ? 'border-status-verified/40 bg-status-verified/5 dark:bg-status-verified/10'
                  : slot.required
                  ? 'border-dashed border-status-fail/40 bg-status-fail/5 dark:bg-status-fail/10'
                  : 'border-dashed border-line dark:border-[#1e2d47]'
              }`}>
                <div className="mb-1.5 flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-ink-heading dark:text-slate-100 leading-tight">
                    {slot.label}
                    {slot.required && <span className="ml-1 text-status-fail">*</span>}
                  </p>
                  {file
                    ? <span className="text-[10px] font-bold text-status-verified">✓</span>
                    : <span className={`text-[10px] font-medium ${slot.required ? 'text-status-fail' : 'text-ink-muted dark:text-slate-500'}`}>
                        {slot.required ? 'Required' : 'Optional'}
                      </span>
                  }
                </div>
                <p className="mb-2 text-[10px] leading-tight text-ink-muted dark:text-slate-500">{slot.hint}</p>
                {file ? (
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[10px] text-ink-muted dark:text-slate-500">{file.name}</p>
                    <button
                      type="button"
                      onClick={() => setUploads((p) => { const n = { ...p }; delete n[slot.key]; return n; })}
                      className="shrink-0 text-[10px] text-status-fail hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRefs.current[slot.key]?.click()}
                    className="w-full rounded-md border border-line bg-surface-secondary px-2 py-1.5 text-[11px] text-ink-secondary transition-colors hover:border-saffron-500 dark:bg-[#0a1628] dark:border-[#1e2d47] dark:text-slate-400"
                  >
                    Click to upload
                  </button>
                )}
                <input
                  ref={(el) => { fileRefs.current[slot.key] = el; }}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFile(slot.key, e.target.files?.[0])}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Step 3 — AI compliance pre-check */}
      <Card>
        <CardHeader title="Step 3 — AI compliance pre-check" subtitle="Optional but recommended before final submission" />
        <div className="space-y-3 p-5">
          {aiError   && <InlineError message={aiError} />}
          {aiResult ? (
            <div className="space-y-3">
              <InlineSuccess message="AI compliance pre-check complete." />
              <div className="flex flex-wrap gap-2">
                <RiskBadge level={String(aiResult.risk_level || '')} />
                <StatusBadge status={String(aiResult.overall_status || '')} />
                {typeof aiResult.compliance_score === 'number' && (
                  <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-ink-heading dark:bg-[#142038] dark:text-slate-100">
                    {aiResult.compliance_score as number}% compliance
                  </span>
                )}
              </div>
              {typeof aiResult.recommendation === 'string' && (
                <p className="rounded-md border border-line bg-surface-secondary px-4 py-3 text-sm leading-relaxed text-ink-secondary dark:border-[#1e2d47] dark:bg-[#0a1628] dark:text-slate-400">
                  {aiResult.recommendation}
                </p>
              )}
            </div>
          ) : (
            <Button variant="secondary" onClick={runAiCheck} disabled={aiLoading || !gstin.trim()}>
              {aiLoading ? 'Checking…' : 'Run AI compliance pre-check'}
            </Button>
          )}
          {aiLoading && <Loader label="Running compliance analysis against portal data…" />}
        </div>
      </Card>

      {/* Step 4 — Submit */}
      {!submitted ? (
        <Card>
          <CardHeader title="Step 4 — Submit bid" subtitle="Submit your complete bid package for officer review" />
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {canSubmit ? (
                <p className="text-sm font-medium text-status-verified">
                  ✓ All required documents present. Ready to submit.
                </p>
              ) : (
                <p className="text-sm font-medium text-status-fail">
                  ⚠ {missingRequired.length} required document{missingRequired.length > 1 ? 's' : ''} missing — cannot submit yet.
                </p>
              )}
            </div>
            <Button onClick={submitBid} disabled={!canSubmit}>
              Submit bid →
            </Button>
          </div>
          {!canSubmit && (
            <div className="border-t border-line px-5 py-3 dark:border-[#1e2d47]">
              <p className="text-xs font-medium text-status-fail">Missing mandatory documents:</p>
              <ul className="mt-1 space-y-0.5">
                {missingRequired.map((d) => (
                  <li key={d.key} className="text-xs text-status-fail">• {d.label}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader title="Bid submitted" subtitle="Your bid has been submitted for officer review" />
          <div className="p-5">
            {submitMsg && <InlineSuccess message={submitMsg} />}
            <p className="mt-3 text-sm text-ink-secondary dark:text-slate-400">
              You will be notified when the procurement officer reviews your submission. Track progress above.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
