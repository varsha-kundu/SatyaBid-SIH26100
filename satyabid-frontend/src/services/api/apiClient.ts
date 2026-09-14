// Central API client. Every backend call in the app should go through here
// rather than being scattered across components.
//
// The Flask backend is the single source of truth. This file never invents
// data, never fabricates a compliance score, and never falls back to demo
// data silently — callers get either a real response or a typed error they
// can display honestly.

import type { ApiErrorShape } from '../../types';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const API_KEY = (import.meta as any).env?.VITE_API_KEY || 'SIH2026';

export class ApiError extends Error {
  status: number | null;
  raw?: unknown;
  constructor(shape: ApiErrorShape) {
    super(shape.message);
    this.status = shape.status;
    this.raw = shape.raw;
  }
}

function friendlyMessage(status: number | null, fallback: string): string {
  if (status === null) {
    return 'Backend service is unavailable. Please start the Flask backend and try again.';
  }
  if (status === 400) return 'The request was not accepted by the backend. Please check the submitted information.';
  if (status === 401 || status === 403) return 'The backend rejected this request. Check that the API key is configured correctly.';
  if (status === 404) return 'The requested record could not be found.';
  if (status >= 500) return 'The backend ran into an internal error while processing this request.';
  return fallback;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': API_KEY,
        ...(options.headers || {}),
      },
    });
  } catch (err) {
    throw new ApiError({ status: null, message: friendlyMessage(null, 'Network error'), raw: err });
  }

  if (!res.ok) {
    let raw: unknown = null;
    try {
      raw = await res.json();
    } catch {
      /* body wasn't JSON — ignore, we already have a status code */
    }
    throw new ApiError({ status: res.status, message: friendlyMessage(res.status, `Request failed (${res.status})`), raw });
  }

  // Some endpoints (e.g. health) may return empty bodies.
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new ApiError({ status: res.status, message: 'The backend returned a response the frontend could not understand.', raw: err });
  }
}

export const apiClient = {
  baseUrl: BASE_URL,

  health: () => request<{ status?: string; [k: string]: unknown }>('/health'),
  vendors: () => request<{ count: number; vendors: unknown[] }>('/vendors'),
  vendor: (identifier: string) => request<unknown>(`/vendor/${encodeURIComponent(identifier)}`),
  lookup: (identifier: string) => request<unknown>(`/lookup/${encodeURIComponent(identifier)}`),
  tenderRequirements: () => request<unknown[]>('/tender-requirements'),
  preVerify: (gstin: string) => request<unknown>(`/pre-verify/${encodeURIComponent(gstin)}`),

  verifyBid: (payload: unknown) => request<unknown>('/verify-bid', { method: 'POST', body: JSON.stringify(payload) }),
  verifyTender: (payload: unknown) => request<unknown>('/verify-tender', { method: 'POST', body: JSON.stringify(payload) }),
  verifyCompliance: (payload: { source_file: string; fields: Record<string, unknown> }) =>
    request<unknown>('/verify-compliance', { method: 'POST', body: JSON.stringify(payload) }),

  /** OCR-extract fields from a named sample bid PDF. */
  extractBid: (sourceFile: string) =>
    request<{
      source_file: string;
      entities: Record<string, string[]>;
      confidence: number;
      text_length: number;
      fields: Record<string, string>;
      note?: string;
    }>('/extract', { method: 'POST', body: JSON.stringify({ source_file: sourceFile }) }),

  gst: (gstin: string) => request<unknown>(`/gst/${encodeURIComponent(gstin)}`),
  pan: (pan: string) => request<unknown>(`/pan/${encodeURIComponent(pan)}`),
  cin: (cin: string) => request<unknown>(`/cin/${encodeURIComponent(cin)}`),
  udyam: (id: string) => request<unknown>(`/udyam/${encodeURIComponent(id)}`),
  startup: (id: string) => request<unknown>(`/startup/${encodeURIComponent(id)}`),
  nsic: (id: string) => request<unknown>(`/nsic/${encodeURIComponent(id)}`),
  epfo: (id: string) => request<unknown>(`/epfo/${encodeURIComponent(id)}`),
  esic: (id: string) => request<unknown>(`/esic/${encodeURIComponent(id)}`),
  digilocker: (id: string) => request<unknown>(`/digilocker/${encodeURIComponent(id)}`),
  makeInIndia: (id: string) => request<unknown>(`/make-in-india/${encodeURIComponent(id)}`),
  certifications: (id: string) => request<unknown>(`/certifications/${encodeURIComponent(id)}`),
  debarment: (id: string) => request<unknown>(`/debarment/${encodeURIComponent(id)}`),
  oem: (gstin: string) => request<unknown>(`/oem/${encodeURIComponent(gstin)}`),

  openapiSpec: () => request<unknown>('/openapi.json'),
};

export const SAMPLE_BIDS = [
  'bid_form_bid_apx_2026_089.pdf',
  'bid_form_bid_bhv_2026_089.pdf',
  'bid_form_bid_epc_2026_089.pdf',
  'bid_form_bid_sec_2026_089.pdf',
  'bid_form_bid_waf_2026_089.pdf',
  'bid_form_bid_zna_2026_089.pdf',
];
