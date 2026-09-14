// Central type definitions for everything the frontend receives from the
// Flask backend. These intentionally stay close to the API contract
// described by the backend team rather than inventing shapes — where the
// exact backend response shape is not yet confirmed, fields are marked
// optional/unknown-friendly so the UI degrades instead of guessing.

export type BackendStatus = 'checking' | 'online' | 'offline';

export type CheckStatus =
  | 'verified'
  | 'non_compliant'
  | 'missing'
  | 'expired'
  | 'inconsistent'
  | 'not_applicable'
  | 'unable_to_verify'
  | 'manual_review';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface Vendor {
  identifier: string;
  legal_name?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  udyam_registration_number?: string;
  [key: string]: unknown;
}

export interface TenderRequirement {
  id?: string;
  title?: string;
  category?: string;
  mandatory?: boolean;
  description?: string;
  threshold?: string | number;
  [key: string]: unknown;
}

export interface ComplianceCheckResult {
  requirement?: string;
  category?: string;
  status: CheckStatus | string;
  confidence?: number;
  evidence?: string;
  source?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface ComplianceResponse {
  source_file?: string;
  compliance_score?: number;
  risk_level?: RiskLevel | string;
  overall_status?: string;
  recommendation?: string;
  checks?: ComplianceCheckResult[];
  explanation?: string | Record<string, unknown>;
  [key: string]: unknown;
}

export interface ExtractedFields {
  gstin?: string;
  pan?: string;
  cin?: string;
  legal_name?: string;
  udyam_msme_registered?: string;
  udyam_registration_number?: string;
  startup_india_dpiit_recognized?: string;
  msme_exemption_claimed?: string;
  [key: string]: unknown;
}

export interface AuditEvent {
  timestamp?: string;
  actor?: string;
  action?: string;
  target?: string;
  result?: string;
  [key: string]: unknown;
}

export interface SampleBid {
  filename: string;
  label: string;
}

export interface ApiErrorShape {
  status: number | null;
  message: string;
  raw?: unknown;
}

// English plus all 22 languages of the Eighth Schedule of the Constitution of India.
export type Lang =
  | 'en'
  | 'as'
  | 'bn'
  | 'brx'
  | 'doi'
  | 'gu'
  | 'hi'
  | 'kn'
  | 'ks'
  | 'kok'
  | 'mai'
  | 'ml'
  | 'mni'
  | 'mr'
  | 'ne'
  | 'or'
  | 'pa'
  | 'sa'
  | 'sat'
  | 'sd'
  | 'ta'
  | 'te'
  | 'ur';

export interface LangMeta {
  code: Lang;
  nativeName: string;
  englishName: string;
  rtl?: boolean;
}
