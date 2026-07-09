import authHero from '@/assets/auth/auth-hero.webp';
import authHero640 from '@/assets/auth/auth-hero-640w.webp';
import authHero1280 from '@/assets/auth/auth-hero-1280w.webp';
import { usePlatformCustomizationContext } from '@/contexts/PlatformCustomizationContext';

const AUTH_HERO_ALT =
  'Emarzona — Votre satisfaction, notre priorité. Paiement 100% sécurisé, livraison rapide, produits de qualité, support client 7j/7.';

const AUTH_HERO_SRCSET = `${authHero640} 640w, ${authHero} 1024w, ${authHero1280} 1280w`;

export function AuthHeroPanel() {
  const { customizationData } = usePlatformCustomizationContext();
  const customAuthHeroUrl = customizationData?.media?.images?.authHero as string | undefined;

  // Use custom image if available, fallback to static images
  const imgSrc = customAuthHeroUrl || authHero;
  const srcSet = customAuthHeroUrl
    ? undefined // No srcset for custom image yet
    : AUTH_HERO_SRCSET;

  return (
    <aside className="app-premium-auth-hero hidden lg:block" role="complementary">
      <picture className="app-premium-auth-hero-picture">
        {!customAuthHeroUrl && <source type="image/webp" srcSet={AUTH_HERO_SRCSET} sizes="56vw" />}
        <img
          src={imgSrc}
          srcSet={srcSet}
          sizes={srcSet ? '56vw' : undefined}
          alt={AUTH_HERO_ALT}
          width={1024}
          height={1280}
          decoding="async"
          fetchPriority="high"
          loading="eager"
          className="app-premium-auth-hero-img"
        />
      </picture>
      <div className="app-premium-auth-hero-overlay" />
      <div className="app-premium-auth-hero-edge" />
    </aside>
  );
}
