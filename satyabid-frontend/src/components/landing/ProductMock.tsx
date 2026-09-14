import React from 'react';

/**
 * Static dashboard illustration for the landing page hero.
 * Shows a realistic compliance result to communicate the product at a glance.
 * Not a live iframe — all data is illustrative / synthetic.
 */
export function ProductMock() {
  const checks = [
    { label: 'GST registration',       status: 'verified',  conf: '98%', source: 'GST Portal' },
    { label: 'PAN / Income Tax',        status: 'verified',  conf: '97%', source: 'PAN Portal' },
    { label: 'Make in India ≥ 50%',    status: 'verified',  conf: '94%', source: 'Declaration' },
    { label: 'ISO 9001 validity',       status: 'review',    conf: '71%', source: 'Certificate' },
    { label: 'OEM authorization',       status: 'missing',   conf: '99%', source: '—' },
    { label: 'Udyam / MSME claim',      status: 'verified',  conf: '96%', source: 'Udyam Portal' },
  ];

  const statusStyle: Record<string, { dot: string; label: string; text: string }> = {
    verified: { dot: '#16a34a', label: 'Verified',     text: '#16a34a' },
    review:   { dot: '#d97706', label: 'Needs review', text: '#d97706' },
    missing:  { dot: '#dc2626', label: 'Missing',      text: '#dc2626' },
  };

  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      {/* Browser chrome */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        }}
      >
        {/* Tab bar */}
        <div style={{ backgroundColor: '#1e2e44', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'inline-block' }} />
          <div style={{
            marginLeft: 8, flex: 1,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '2px 10px',
            fontSize: 10, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'monospace',
          }}>
            satyabid · Compliance Result
          </div>
        </div>

        {/* App content */}
        <div style={{ backgroundColor: '#0f1e35', display: 'grid', gridTemplateColumns: '96px 1fr' }}>
          {/* Sidebar */}
          <div style={{ backgroundColor: '#0b1628', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '12px 8px' }}>
            <div style={{ marginBottom: 12, padding: '0 4px' }}>
              <div style={{ width: 36, height: 6, borderRadius: 3, backgroundColor: '#F97316', marginBottom: 4 }} />
              <div style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </div>
            {['Dashboard', 'Verification', 'Review', 'Reports', 'Audit'].map((item, i) => (
              <div key={item} style={{
                borderRadius: 4, padding: '5px 8px', marginBottom: 2,
                backgroundColor: i === 1 ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontSize: 9,
                color: i === 1 ? '#ffffff' : 'rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {i === 1 && <span style={{ width: 3, height: 12, backgroundColor: '#F97316', borderRadius: 2 }} />}
                {item}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div style={{ padding: 14, backgroundColor: '#f5f7fa' }}>
            {/* Page header */}
            <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, color: '#F97316', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 2, textTransform: 'uppercase' }}>
                  Compliance result
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2b3c' }}>
                  CPCL-TENDER-2026-089
                </div>
                <div style={{ fontSize: 9, color: '#6b7a8d', marginTop: 1 }}>
                  Apex Industrial Pipes Pvt Ltd
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 9, color: '#6b7a8d', marginBottom: 2 }}>Compliance score</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706', lineHeight: 1 }}>70%</div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3,
                  backgroundColor: '#fef3c7', color: '#92400e',
                  borderRadius: 3, padding: '2px 6px', fontSize: 9, fontWeight: 600,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#d97706' }} />
                  MEDIUM RISK
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5, marginBottom: 10 }}>
              {[
                { v: '6 / 9', l: 'Checks passed' },
                { v: '2', l: 'Need review' },
                { v: '1', l: 'Missing' },
              ].map((s) => (
                <div key={s.l} style={{
                  backgroundColor: '#fff', borderRadius: 4,
                  border: '1px solid #e2e8f0',
                  padding: '6px 8px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1a2b3c' }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: '#6b7a8d', marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Requirement rows */}
            <div style={{ backgroundColor: '#fff', borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 40px',
                padding: '4px 8px', backgroundColor: '#f0f4f8',
                fontSize: 7, fontWeight: 700, color: '#6b7a8d',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <span>Requirement</span>
                <span>Status</span>
                <span>Conf.</span>
              </div>

              {checks.map((c, i) => {
                const st = statusStyle[c.status];
                return (
                  <div key={c.label} style={{
                    display: 'grid', gridTemplateColumns: '1fr 70px 40px',
                    padding: '5px 8px',
                    borderBottom: i < checks.length - 1 ? '1px solid #f0f4f8' : 'none',
                    backgroundColor: i % 2 === 0 ? '#fff' : '#fafbfc',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 9, color: '#1a2b3c', fontWeight: 500 }}>{c.label}</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 3,
                      fontSize: 8, fontWeight: 600, color: st.text,
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot }} />
                      {st.label}
                    </span>
                    <span style={{ fontSize: 8, color: '#6b7a8d' }}>{c.conf}</span>
                  </div>
                );
              })}
            </div>

            {/* AI recommendation strip */}
            <div style={{
              marginTop: 8, borderRadius: 4, padding: '6px 8px',
              backgroundColor: '#fff7ed',
              border: '1px solid rgba(249,115,22,0.25)',
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#c2410c', marginBottom: 2 }}>
                AI RECOMMENDATION
              </div>
              <div style={{ fontSize: 8, color: '#7c2d12', lineHeight: 1.4 }}>
                Conditional — 2 items need manual review. Final decision rests with the officer.
              </div>
            </div>

            {/* Footer note */}
            <div style={{ marginTop: 6, fontSize: 7, color: '#9aafbf', textAlign: 'center' }}>
              Prototype interface — synthetic verification data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
