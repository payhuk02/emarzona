/**
 * /pricing → section tarifs de la landing (/#tarifs).
 * Conserve des meta FR pour les crawlers avant redirection client.
 */
import { useEffect } from 'react';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { LANDING_CANONICAL_URL } from '@/lib/landing-seo';
import { PAGE_SEO_CONFIG } from '@/components/seo/PageSEOConfig';

const pricingSeo = PAGE_SEO_CONFIG['/pricing'];

export default function PricingRedirectPage() {
  useEffect(() => {
    const target = `${window.location.origin}/#tarifs`;
    window.location.replace(target);
  }, []);

  return (
    <SEOMeta
      title={pricingSeo.title}
      description={pricingSeo.description}
      keywords={pricingSeo.keywords}
      url={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com'}/pricing`}
      canonical={LANDING_CANONICAL_URL}
    />
  );
}
