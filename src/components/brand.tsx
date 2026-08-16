import logoAsset from "@/assets/logo-emporio.asset.json";

export function LicuriLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Logo Empório do Licuri"
      className={className}
      aria-hidden
    />
  );
}

export function LicuriBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LicuriLogo className="h-10 w-auto" />
      <div className="leading-none hidden sm:block">
        <div className="font-display text-xl font-bold tracking-wide text-[var(--coffee)]">
          EMPÓRIO DO LICURI
        </div>
        {!compact && (
          <div className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Natural • Tradição • Energia
          </div>
        )}
      </div>
    </div>
  );
}

