import React from 'react';

type IconProps = { className?: string };

export function IconDocument({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3.5h7.2L19 8.3V20.5H7V3.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 3.5V8.3h5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 12.5h7M9.5 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconShield({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.5 19.5 6.5v5.2c0 4.3-2.9 7.4-7.5 9.3-4.6-1.9-7.5-5-7.5-9.3V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="m8.8 12.2 2.2 2.2 4.4-4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconScale({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16M6 20h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 7H5.5L4 11.5 5.5 12c.8-1.2 1.9-1.8 3.3-1.8S11 10.8 11.8 12L13.3 11.5 12 7ZM12 7h6.5L20 11.5 18.5 12c-.8-1.2-1.9-1.8-3.3-1.8S12.2 10.8 11.4 12L9.9 11.5 12 7Z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconUsers({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 18.5c.4-2.8 2.4-4.3 4.5-4.3s4.1 1.5 4.5 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="2.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.8 18.5c-.3-2.1-1.6-3.3-3.3-3.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconAudit({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 5.5h10.5L19 9v11.5H5V5.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 5.5V9H19M8 13h8M8 16.5h5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconAlert({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4.2 20.7 19.5H3.3L12 4.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.8" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconArrow({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12.5 8 8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
