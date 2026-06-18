import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { injectLandingCriticalCSS } from '@/lib/landing-critical-css';
import { ensureLandingPremiumLocale } from '@/i18n/landing-premium-loader';
import i18n from '@/i18n/config';
import {
  getLandingSEO,
  buildLandingHreflangAlternates,
  parseLandingLangFromSearch,
} from '@/lib/landing-seo';
import heroGlobeWebpSm from '@/assets/landing/hero-globe-320.webp';

const LANDING_FONTS_ID = 'landing-premium-fonts';
const LANDING_FONTS_PRELOAD_ID = 'landing-premium-fonts-preload';
const HERO_GLOBE_PRELOAD_ID = 'landing-hero-globe-preload';
const LANDING_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap';

function useLandingAssets() {
  useEffect(() => {
    injectLandingCriticalCSS();

    if (!document.getElementById(LANDING_FONTS_PRELOAD_ID)) {
      const preload = document.createElement('link');
      preload.id = LANDING_FONTS_PRELOAD_ID;
      preload.rel = 'preload';
      preload.as = 'style';
      preload.href = LANDING_FONTS_HREF;
      document.head.appendChild(preload);
    }

    if (!document.getElementById(LANDING_FONTS_ID)) {
      const link = document.createElement('link');
      link.id = LANDING_FONTS_ID;
      link.rel = 'stylesheet';
      link.href = LANDING_FONTS_HREF;
      link.media = 'print';
      link.onload = () => {
        link.media = 'all';
      };
      document.head.appendChild(link);
    }

    if (!document.getElementById(HERO_GLOBE_PRELOAD_ID)) {
      const imgPreload = document.createElement('link');
      imgPreload.id = HERO_GLOBE_PRELOAD_ID;
      imgPreload.rel = 'preload';
      imgPreload.as = 'image';
      imgPreload.href = heroGlobeWebpSm;
      imgPreload.type = 'image/webp';
      document.head.appendChild(imgPreload);
    }
  }, []);
}

function LandingShell() {
  return (
    <div
      className="landing-premium min-h-screen bg-[#08080a]"
      aria-busy="true"
      aria-label="Chargement de la page d'accueil"
    />
  );
}

const Landing = () => {
  const [ready, setReady] = useState(false);
  const location = useLocation();
  useLandingAssets();

  const hreflangAlternates = useMemo(() => buildLandingHreflangAlternates(), []);

  useEffect(() => {
    let cancelled = false;
    const langFromUrl = parseLandingLangFromSearch(location.search);

    ensureLandingPremiumLocale(langFromUrl ?? undefined)
      .then(async () => {
        if (langFromUrl && i18n.language !== langFromUrl) {
          await i18n.changeLanguage(langFromUrl);
          document.documentElement.lang = langFromUrl;
        }
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  if (!ready) {
    const seo = getLandingSEO();
    return (
      <>
        <SEOMeta
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
          url={seo.url}
          imageAlt={seo.imageAlt}
          hreflangAlternates={hreflangAlternates}
        />
        <LandingShell />
      </>
    );
  }

  return <LandingContent hreflangAlternates={hreflangAlternates} />;
};

function LandingContent({
  hreflangAlternates,
}: {
  hreflangAlternates: ReturnType<typeof buildLandingHreflangAlternates>;
}) {
  const { t } = useLandingPremiumT();
  const seo = getLandingSEO({
    title: t('seo.title'),
    description: t('seo.description'),
  });

  return (
    <>
      <SEOMeta
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        url={seo.url}
        imageAlt={seo.imageAlt}
        hreflangAlternates={hreflangAlternates}
      />
      <WebsiteSchema />
      <OrganizationSchema />
      <PremiumLandingPage />
    </>
  );
}

export default Landing;
