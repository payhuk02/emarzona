import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

const AUTH_HERO_ALT =
  'Emarzona — Votre satisfaction, notre priorité. Paiement 100% sécurisé, livraison rapide, produits de qualité, support client 7j/7.';

export function AuthHeroPanel() {
  const { customizationData } = usePlatformCustomizationContext();
  const authHeroUrl = customizationData?.media?.images?.authHero?.trim() || '';

  return (
    <aside className="app-premium-auth-hero hidden lg:block" role="complementary">
      {authHeroUrl ? (
        <picture className="app-premium-auth-hero-picture">
          <img
            src={authHeroUrl}
            alt={AUTH_HERO_ALT}
            width={1024}
            height={1280}
            decoding="async"
            fetchPriority="high"
            loading="eager"
            className="app-premium-auth-hero-img"
          />
        </picture>
      ) : null}
      <div className="app-premium-auth-hero-overlay" />
      <div className="app-premium-auth-hero-edge" />
    </aside>
  );
}
