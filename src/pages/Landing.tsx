import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { SoftwareApplicationSchema } from '@/components/seo/SoftwareApplicationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { injectLandingCriticalCSS } from '@/lib/landing-critical-css';
import { ensureLandingPremiumLocale } from '@/i18n/landing-premium-loader';
import i18n from '@/i18n/config';
import {
  buildLandingHreflangAlternates,
  parseLandingLangFromSearch,
  resolveLandingPageSEO,
} from '@/lib/landing-seo';

/** Critical CSS only — do not preload below-the-fold carousel (steals LCP bandwidth). */
function useLandingAssets() {
  useEffect(() => {
    injectLandingCriticalCSS();
    document.documentElement.classList.add('lp-smooth-scroll');
    return () => {
      document.documentElement.classList.remove('lp-smooth-scroll');
    };
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
    const landingLang = langFromUrl ?? 'fr';

    ensureLandingPremiumLocale(landingLang)
      .then(async () => {
        if (i18n.language !== landingLang) {
          await i18n.changeLanguage(landingLang);
        }
        document.documentElement.lang = landingLang;
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        document.documentElement.lang = 'fr';
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [location.search]);

  if (!ready) {
    const langFromUrl = parseLandingLangFromSearch(location.search);
    const seo = resolveLandingPageSEO({ langFromUrl });
    return (
      <>
        <SEOMeta
          title={seo.title}
          description={seo.description}
          keywords={seo.keywords}
          url={seo.url}
          canonical={seo.canonical}
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
  const location = useLocation();
  const langFromUrl = parseLandingLangFromSearch(location.search);
  const seo = resolveLandingPageSEO({
    langFromUrl,
    translated: langFromUrl
      ? { title: t('seo.title'), description: t('seo.description') }
      : undefined,
  });

  return (
    <>
      <SEOMeta
        title={seo.title}
        description={seo.description}
        keywords={seo.keywords}
        url={seo.url}
        canonical={seo.canonical}
        imageAlt={seo.imageAlt}
        hreflangAlternates={hreflangAlternates}
      />
      <WebsiteSchema />
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <PremiumLandingPage />
    </>
  );
}

export default Landing;
