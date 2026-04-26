export function LicuriLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M24 6c-4 6-6 10-6 14a6 6 0 0 0 12 0c0-4-2-8-6-14Z" fill="currentColor" />
      <path
        d="M10 28c4-2 8-2 12 0M38 28c-4-2-8-2-12 0M14 36c4-2 8-2 10 0 2-2 6-2 10 0M18 42c3-1 5-1 6 0 1-1 3-1 6 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LicuriBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LicuriLogo className="h-8 w-8 text-[var(--clay)]" />
      <div className="leading-none">
        <div className="font-display text-xl font-bold tracking-wide text-[var(--coffee)]">
          LICURI HUB
        </div>
        {!compact && (
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Raízes que alimentam
          </div>
        )}
      </div>
    </div>
  );
}
