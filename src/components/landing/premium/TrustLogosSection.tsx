import { usePremiumReveal } from './usePremiumReveal';

const logos = ['ARTIFY', 'Eduka', 'DigitalPro', 'Maison K.', 'Studio N.', 'AfriCommerce'];

export function TrustLogosSection() {
  const { ref, className } = usePremiumReveal();

  return (
    <section className="border-y border-[var(--lp-border-light)] bg-[var(--lp-surface)] py-14">
      <div
        ref={ref}
        className={`mx-auto max-w-7xl px-5 text-center lg:px-8 lp-reveal ${className}`}
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--lp-text-muted)]">
          Ils nous font confiance
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map(name => (
            <span
              key={name}
              className="text-lg font-semibold tracking-tight text-[var(--lp-text)]/25 sm:text-xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
