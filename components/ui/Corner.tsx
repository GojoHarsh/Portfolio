/**
 * The folded corner: Harsh's mark. A dog-eared page corner, used in the
 * wordmark, the loader and the footer. Purely decorative.
 */
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M3 3h11l7 7v11H3Z" fill="currentColor" opacity="0.18" />
      <path d="M14 3v7h7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14 3l7 7h-7Z" className="fill-accent" />
      <path d="M3 3h11l7 7v11H3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}
