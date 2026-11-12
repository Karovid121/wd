export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label="Nexora">
      <defs>
        <linearGradient id="nexora-logo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f7bff" />
          <stop offset="1" stopColor="#37d6e6" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#nexora-logo)" />
      <path
        d="M15 34V14l18 20V14"
        fill="none"
        stroke="#0b0c11"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
