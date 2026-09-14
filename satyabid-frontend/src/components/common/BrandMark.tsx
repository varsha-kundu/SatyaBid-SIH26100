import React from 'react';

/**
 * Original brand mark: a 24-spoke wheel motif (referencing the wheel found
 * on the national flag, redrawn from scratch as a simple line mark) sitting
 * inside a tricolour arc. This is an independent SatyaBid identity — it is
 * not a reproduction of the national emblem, the GeM logo, or any official
 * insignia.
 */
export function BrandMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  const spokes = Array.from({ length: 24 });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="SatyaBid">
      <defs>
        <linearGradient id="sb-arc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E87516" />
          <stop offset="50%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#6FA36A" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="none" stroke="url(#sb-arc)" strokeWidth="3" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="#062A35" strokeWidth="1.4" />
      <circle cx="32" cy="32" r="3.2" fill="#062A35" />
      {spokes.map((_, i) => {
        const angle = (i * 360) / spokes.length;
        const rad = (angle * Math.PI) / 180;
        const x2 = 32 + 20 * Math.cos(rad);
        const y2 = 32 + 20 * Math.sin(rad);
        return <line key={i} x1="32" y1="32" x2={x2} y2={y2} stroke="#062A35" strokeWidth="1" />;
      })}
    </svg>
  );
}
