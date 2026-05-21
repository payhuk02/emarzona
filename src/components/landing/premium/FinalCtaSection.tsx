import { Link } from 'react-router-dom';
import { usePremiumReveal } from './usePremiumReveal';
import { EMARZONA_DEFAULT_LOGO } from '@/lib/brand/emarzona-logo';

export function FinalCtaSection() {
  const { ref: textRef, className: textReveal } = usePremiumReveal();

  return (
    <section className="lp-section-pad bg-[#08080a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#12121a] via-[#0e0e14] to-[#16161f] px-5 py-12 sm:rounded-3xl sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse 70% 80% at 100% 50%, rgba(124,92,255,0.15) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(242,145,36,0.08) 0%, transparent 50%)',
            }}
          />

          <div className="relative z-10 flex flex-col gap-10 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
            <div ref={textRef} className={`text-center lp-reveal ${textReveal} lg:text-left`}>
              <h2 className="lp-serif text-2xl text-white sm:text-3xl md:text-4xl lg:text-[2.75rem]">
                Prêt à tout vendre.
                <br />
                Partout. Avec Emarzona.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-[var(--lp-text-dim)] lg:mx-0">
                Rejoignez les créateurs et marques qui centralisent leurs ventes sur une
                infrastructure pensée pour l&apos;Afrique et le monde.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  to="/register"
                  className="lp-btn-gold inline-flex rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Démarrer gratuitement
                </Link>
                <a
                  href="mailto:contact@emarzona.com"
                  className="lp-btn-outline inline-flex rounded-full px-7 py-3.5 text-sm"
                >
                  Prendre rendez-vous
                </a>
              </div>
            </div>

            {/* Logo toujours affiché sur mobile */}
            <div className="relative z-10 flex min-h-[200px] w-full shrink-0 items-center justify-center sm:min-h-[240px] lg:min-h-[280px]">
              <div className="lp-cta-logo relative w-full max-w-[280px] sm:max-w-[320px]">
                <div
                  className="lp-cta-logo-glow pointer-events-none absolute inset-[-15%] rounded-full"
                  aria-hidden
                />
                <img
                  src={EMARZONA_DEFAULT_LOGO}
                  alt="Emarzona — plateforme e-commerce mondiale"
                  className="relative mx-auto block h-auto w-full max-w-[260px] object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.5)] sm:max-w-[300px]"
                  width={300}
                  height={300}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
