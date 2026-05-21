import { Link } from 'react-router-dom';
import { usePremiumReveal } from './usePremiumReveal';
import { PremiumCtaGlobeVisual } from './PremiumCtaGlobeVisual';

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
                'radial-gradient(ellipse 70% 80% at 100% 50%, rgba(124,92,255,0.15) 0%, transparent 55%), radial-gradient(ellipse 50% 60% at 0% 100%, rgba(37,99,235,0.1) 0%, transparent 50%)',
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
                  className="lp-btn-primary inline-flex rounded-full px-7 py-3.5 text-sm font-semibold"
                >
                  Démarrer gratuitement
                </Link>
                <a
                  href="mailto:contact@emarzona.com"
                  className="lp-btn-primary inline-flex rounded-full border border-white/20 px-7 py-3.5 text-sm font-semibold"
                >
                  Prendre rendez-vous
                </a>
              </div>
            </div>

            <div
              className="relative z-10 flex w-full items-center justify-center overflow-visible py-3 sm:py-4"
              aria-label="Globe terrestre animé — vente internationale"
            >
              <PremiumCtaGlobeVisual />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
