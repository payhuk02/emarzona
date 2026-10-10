import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { WebsiteSchema } from '@/components/seo/WebsiteSchema';
import { OrganizationSchema } from '@/components/seo/OrganizationSchema';
import { SoftwareApplicationSchema } from '@/components/seo/SoftwareApplicationSchema';
import { PremiumLandingPage } from '@/components/landing/premium/PremiumLandingPage';
import { useLandingPremiumT } from '@/hooks/useLandingPremiumT';
import { injectLandingCriticalCSS } from '@/lib/landing-critical-css';
import {
  ensureLandingPremiumLocale,
  isLandingPremiumLocaleLoaded,
} from '@/i18n/landing-premium-loader';
import i18n from '@/i18n/config';
import {
  buildLandingHreflangAlternates,
  parseLandingLangFromSearch,
  resolveLandingPageSEO,
} from '@/lib/landing-seo';

/** Critical CSS only — no continuous smooth-scroll (hurts scroll fluidity). */
function useLandingAssets() {
  useEffect(() => {
    injectLandingCriticalCSS();
  }, []);
}

function LandingShell() {
  return (
    <div
      className="landing-premium min-h-screen bg-[#08080a] aria-busy-skeleton"
      aria-busy="true"
      data-busy-quiet
      aria-label="Chargement de la page d'accueil"
    />
  );
}

function resolveLandingLang(search: string): string {
  return parseLandingLangFromSearch(search) ?? 'fr';
}

const Landing = () => {
  const location = useLocation();
  const landingLang = resolveLandingLang(location.search);
  // FR/EN already in initial i18n bundle — paint immediately (no empty shell flash)
  const [ready, setReady] = useState(() => isLandingPremiumLocaleLoaded(landingLang));
  useLandingAssets();

  const hreflangAlternates = useMemo(() => buildLandingHreflangAlternates(), []);

  useEffect(() => {
    let cancelled = false;
    const lang = resolveLandingLang(location.search);

    if (isLandingPremiumLocaleLoaded(lang)) {
      if (i18n.language !== lang) {
        void i18n.changeLanguage(lang).then(() => {
          if (!cancelled) {
            document.documentElement.lang = lang;
            setReady(true);
          }
        });
      } else {
        document.documentElement.lang = lang;
        setReady(true);
      }
      return () => {
        cancelled = true;
      };
    }

    setReady(false);
    ensureLandingPremiumLocale(lang)
      .then(async () => {
        if (i18n.language !== lang) {
          await i18n.changeLanguage(lang);
        }
        document.documentElement.lang = lang;
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
