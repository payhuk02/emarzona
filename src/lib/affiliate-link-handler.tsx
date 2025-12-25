/**
 * Composant pour gérer les liens d'affiliation dans les URLs
 * À utiliser dans les pages de produits pour tracker les clics d'affiliation
 */
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackAffiliateClick } from './affiliation-tracking';
import { logger } from './logger';

interface AffiliateLinkHandlerProps {
  productId: string;
}

/**
 * Composant qui détecte les paramètres d'affiliation dans l'URL et track les clics
 * Usage: <AffiliateLinkHandler productId={product.id} />
 */
export const AffiliateLinkHandler = ({ productId }: AffiliateLinkHandlerProps) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const affiliateLinkId = searchParams.get('aff');
    const utmSource = searchParams.get('utm_source');
    const utmMedium = searchParams.get('utm_medium');
    const utmCampaign = searchParams.get('utm_campaign');

    // Si pas de paramètre d'affiliation, ne rien faire
    if (!affiliateLinkId) {
      return;
    }

    // Track le clic d'affiliation
    const trackClick = async () => {
      try {
        const metadata: Record<string, unknown> = {
          referer_url: document.referrer || window.location.href,
          user_agent: navigator.userAgent,
        };

        if (utmSource) metadata.utm_source = utmSource;
        if (utmMedium) metadata.utm_medium = utmMedium;
        if (utmCampaign) metadata.utm_campaign = utmCampaign;

        const result = await trackAffiliateClick(affiliateLinkId, productId, metadata);

        if (result.success) {
          logger.log('Affiliate click tracked successfully', {
            affiliateLinkId,
            productId,
            trackingCookie: result.tracking_cookie,
          });
        } else {
          logger.warn('Failed to track affiliate click', {
            affiliateLinkId,
            productId,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error('Error tracking affiliate click', { error, affiliateLinkId, productId });
      }
    };

    trackClick();
  }, [searchParams, productId]);

  // Ce composant ne rend rien
  return null;
};







