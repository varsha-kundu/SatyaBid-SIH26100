import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SAMPLE_BIDS } from '../services/api/apiClient';
import { Card, CardHeader, Button } from '../components/common/UI';
import { IconDocument } from '../components/common/Icons';

const BID_META: Record<string, { vendor: string; pages: number; confidence: string }> = {
  'bid_form_bid_apx_2026_089.pdf': { vendor: 'Apex Industrial Pipes Pvt Ltd',         pages: 24, confidence: 'High' },
  'bid_form_bid_bhv_2026_089.pdf': { vendor: 'Bharat Heavy Valves Ltd',                pages: 18, confidence: 'High' },
  'bid_form_bid_epc_2026_089.pdf': { vendor: 'Eastern Precision Components Pvt Ltd',   pages: 21, confidence: 'High' },
  'bid_form_bid_sec_2026_089.pdf': { vendor: 'Shadow Engineering Consortium',           pages: 14, confidence: 'Medium' },
  'bid_form_bid_waf_2026_089.pdf': { vendor: 'Western Auto Forge Pvt Ltd',             pages: 11, confidence: 'Medium' },
  'bid_form_bid_zna_2026_089.pdf': { vendor: 'Zenith Nano Alloys Pvt Ltd',             pages: 17, confidence: 'High' },
};

const CONFIDENCE_STYLE: Record<string, string> = {
  High:   'bg-status-verified/10 text-status-verified',
  Medium: 'bg-status-review/10 text-status-review',
  Low:    'bg-status-fail/10 text-status-fail',
};

export function Documents() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader
        title="Document center"
        subtitle="Sample bid PDFs seeded in the backend — click a row to verify that bid"
      />
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Vendor</th>
              <th className="hidden sm:table-cell">Pages</th>
              <th className="hidden md:table-cell">OCR confidence</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_BIDS.map((name) => {
              const meta = BID_META[name];
              return (
                <tr key={name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <IconDocument className="h-4 w-4 shrink-0 text-ink-muted dark:text-slate-500" />
                      <span className="font-mono text-xs text-ink-heading dark:text-slate-200">{name}</span>
                    </div>
                  </td>
                  <td className="text-sm text-ink-secondary dark:text-slate-400">
                    {meta?.vendor ?? '—'}
                  </td>
                  <td className="hidden text-sm text-ink-secondary dark:text-slate-400 sm:table-cell">
                    {meta?.pages ?? '—'}
                  </td>
                  <td className="hidden md:table-cell">
                    {meta?.confidence ? (
                      <span className={`status-chip ${CONFIDENCE_STYLE[meta.confidence] ?? ''}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {meta.confidence}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/app/bid-verification')}
                    >
                      Verify →
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-5 py-3 text-xs text-ink-muted dark:border-[#1e2d47] dark:text-slate-600">
        <strong>Prototype:</strong> files are served from <code>dummy_dataset/sample_bids/</code>.
        Click <em>Verify →</em> to open the full extraction and compliance pipeline for that bid.
      </p>
    </Card>
  );
}
