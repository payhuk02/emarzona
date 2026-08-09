/** Arrière-plan premium — dégradés statiques (sans animation). */
export function PremiumPlatformHeroAmbient() {
  return (
    <div
      className="lp-platform-hero__ambient pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="lp-platform-hero__ambient-base absolute inset-0" />
      <div className="lp-platform-hero__ambient-grid absolute inset-0 opacity-[0.35]" />
    </div>
  );
}
