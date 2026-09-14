import type { ComplianceCheckResult, ComplianceResponse } from '../types';

export const PAPER_STATUSES = [
  'verified',
  'non_compliant',
  'missing',
  'expired',
  'inconsistent',
  'not_applicable',
  'unable_to_verify',
  'manual_review',
] as const;

export type PaperStatus = (typeof PAPER_STATUSES)[number];

export function paperStatus(raw: unknown): PaperStatus {
  const s = String(raw || '').toLowerCase().replace(/\s+/g, '_');
  if (s === 'pass' || s === 'verified' || s === 'compliant') return 'verified';
  if (s === 'fail' || s === 'non_compliant' || s === 'non-compliant') return 'non_compliant';
  if (s === 'critical') return 'non_compliant';
  if (s === 'missing') return 'missing';
  if (s === 'expired') return 'expired';
  if (s === 'inconsistent' || s === 'mismatch') return 'inconsistent';
  if (s === 'warning' || s === 'manual_review' || s === 'review' || s.includes('review')) return 'manual_review';
  if (s === 'unable_to_verify' || s === 'unknown' || s === 'info') return 'unable_to_verify';
  if (s === 'not_applicable' || s === 'n/a' || s === 'na') return 'not_applicable';
  return 'manual_review';
}

export function checkLabel(c: ComplianceCheckResult, i: number): string {
  return String(c.check || c.requirement || `Requirement ${i + 1}`);
}

export function checkMessage(c: ComplianceCheckResult): string {
  return String(c.message ?? c.reason ?? c.evidence ?? '—');
}

export function isGapStatus(status: PaperStatus): boolean {
  return ['non_compliant', 'missing', 'expired', 'inconsistent', 'unable_to_verify', 'manual_review'].includes(status);
}

export function checksOf(result: ComplianceResponse): ComplianceCheckResult[] {
  return Array.isArray(result.checks) ? result.checks : [];
}

export const DEMO_NIT_CLAUSES = [
  {
    id: 'turnover',
    title: 'Minimum annual turnover',
    category: 'Financial',
    mandatory: true,
    threshold: '₹10 crore',
    evidence: 'ITR / audited financials',
    rule: 'Declared turnover ≥ tender minimum',
    clause: 'Bidder shall have a minimum average annual turnover of ₹10 crore in the last three financial years.',
  },
  {
    id: 'experience',
    title: 'Prior experience',
    category: 'Eligibility',
    mandatory: true,
    threshold: '> 5 years',
    evidence: 'Work orders / experience certificates',
    rule: 'Years of similar supply ≥ 5',
    clause: 'Bidder must have supplied similar high-pressure piping for at least five years.',
  },
  {
    id: 'gst',
    title: 'GST registration',
    category: 'Statutory',
    mandatory: true,
    threshold: 'Active GSTIN',
    evidence: 'GST certificate',
    rule: 'Portal status = Active',
    clause: 'Valid GST registration in the name of the bidding entity is mandatory.',
  },
  {
    id: 'pan',
    title: 'PAN / Income Tax',
    category: 'Statutory',
    mandatory: true,
    threshold: 'Active PAN, ITR filed',
    evidence: 'PAN card + ITR',
    rule: 'PAN active and latest return filed',
    clause: 'PAN of the bidder must be active and latest ITR filed.',
  },
  {
    id: 'local',
    title: 'Make in India / local content',
    category: 'Declarations',
    mandatory: true,
    threshold: '≥ 50%',
    evidence: 'Local-content declaration',
    rule: 'Declared local content ≥ 50%',
    clause: 'Minimum 50% local content as per Make in India policy.',
  },
  {
    id: 'iso',
    title: 'ISO 9001',
    category: 'Technical',
    mandatory: true,
    threshold: 'Valid certificate',
    evidence: 'ISO 9001 certificate',
    rule: 'Certificate not expired',
    clause: 'Valid ISO 9001 quality-management certification is required.',
  },
  {
    id: 'bis',
    title: 'BIS certification',
    category: 'Technical',
    mandatory: true,
    threshold: 'Valid BIS',
    evidence: 'BIS licence',
    rule: 'Certificate present and valid',
    clause: 'Products shall conform to applicable BIS standards.',
  },
  {
    id: 'msme',
    title: 'MSME / Udyam (exemption)',
    category: 'Social',
    mandatory: false,
    threshold: 'If claimed, valid Udyam',
    evidence: 'Udyam certificate',
    rule: 'If exemption claimed, Udyam must verify',
    clause: 'MSME exemption from EMD is allowed where a valid Udyam registration is produced.',
  },
  {
    id: 'debarment',
    title: 'Integrity / debarment',
    category: 'Integrity',
    mandatory: true,
    threshold: 'Not debarred',
    evidence: 'Debarment registry',
    rule: 'No active debarment match',
    clause: 'Bidder shall not be debarred or blacklisted by any Central / State / PSU organisation.',
  },
];
