/** Arrière-plan premium — dégradés, halos et particules (CSS pur). */
export function PremiumPlatformHeroAmbient() {
  return (
    <div
      className="lp-platform-hero__ambient pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <div className="lp-platform-hero__ambient-base absolute inset-0" />
      <div className="lp-platform-hero__ambient-orb lp-platform-hero__ambient-orb--1" />
      <div className="lp-platform-hero__ambient-orb lp-platform-hero__ambient-orb--2" />
      <div className="lp-platform-hero__ambient-orb lp-platform-hero__ambient-orb--3" />
      <div className="lp-platform-hero__ambient-grid absolute inset-0 opacity-[0.35]" />
      {Array.from({ length: 8 }).map((_, i) => (
        <span
          key={i}
          className={`lp-platform-hero__particle lp-platform-hero__particle--${i + 1}`}
        />
      ))}
    </div>
  );
}
