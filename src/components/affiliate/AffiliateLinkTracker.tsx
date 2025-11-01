/**
 * 🔗 Affiliate Link Tracker
 * Composant qui intercepte les liens d'affiliation et track les clics
 * Détecte le paramètre ?aff=CODE dans l'URL et appelle track_affiliate_click()
 */

import { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Fonction utilitaire pour définir un cookie
 */
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Fonction utilitaire pour obtenir un cookie
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Fonction pour obtenir l'adresse IP du client (via un service externe ou null)
 */
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    logger.debug('Could not fetch IP address', { error });
    return null;
  }
}

export function AffiliateLinkTracker() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const trackAffiliateClick = async () => {
      // Vérifier si un paramètre d'affiliation existe dans l'URL
      const affiliateCode = searchParams.get('aff') || searchParams.get('ref') || searchParams.get('affiliate');
      
      if (!affiliateCode) {
        return;
      }

      // Vérifier si ce clic n'a pas déjà été tracké (éviter les doublons)
      const alreadyTracked = sessionStorage.getItem(`aff_tracked_${affiliateCode}`);
      if (alreadyTracked) {
        logger.debug('Affiliate click already tracked for this session', { code: affiliateCode });
        return;
      }

      try {
        logger.info('Tracking affiliate click', { code: affiliateCode });

        // Obtenir les informations du client
        const ipAddress = await getClientIP();
        const userAgent = navigator.userAgent;
        const refererUrl = document.referrer || null;

        // Appeler la fonction SQL track_affiliate_click
        const { data, error } = await supabase.rpc('track_affiliate_click', {
          p_link_code: affiliateCode,
          p_ip_address: ipAddress,
          p_user_agent: userAgent,
          p_referer_url: refererUrl,
        });

        if (error) {
          logger.error('Error tracking affiliate click', { error: error.message, code: affiliateCode });
          return;
        }

        if (!data || !data.success) {
          logger.warn('Affiliate tracking failed', { 
            error: data?.error || 'Unknown error',
            code: affiliateCode 
          });
          return;
        }

        // Stocker le cookie de tracking
        if (data.tracking_cookie && data.expires_at) {
          const expiresDate = new Date(data.expires_at);
          const daysUntilExpiry = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          // Stocker le cookie principal de tracking
          setCookie('affiliate_tracking_cookie', data.tracking_cookie, daysUntilExpiry);
          
          // Stocker également les informations supplémentaires dans localStorage pour référence
          localStorage.setItem('affiliate_tracking_info', JSON.stringify({
            tracking_cookie: data.tracking_cookie,
            product_id: data.product_id,
            store_id: data.store_id,
            click_id: data.click_id,
            expires_at: data.expires_at,
            link_code: affiliateCode,
          }));

          logger.info('Affiliate click tracked successfully', {
            code: affiliateCode,
            click_id: data.click_id,
            expires_at: data.expires_at,
          });

          // Marquer comme tracké dans cette session
          sessionStorage.setItem(`aff_tracked_${affiliateCode}`, 'true');
        }

        // Si une URL de redirection est fournie, rediriger vers cette URL
        if (data.redirect_url && data.redirect_url !== window.location.href) {
          // Retirer les paramètres d'affiliation de l'URL actuelle avant de rediriger
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('aff');
          newSearchParams.delete('ref');
          newSearchParams.delete('affiliate');
          
          // Construire la nouvelle URL
          const newUrl = data.redirect_url.split('?')[0]; // Prendre seulement la base de l'URL
          const redirectParams = new URLSearchParams(newUrl.split('?')[1] || '');
          
          // Merger les paramètres existants (sauf les paramètres d'affiliation)
          redirectParams.forEach((value, key) => {
            if (!['aff', 'ref', 'affiliate'].includes(key)) {
              newSearchParams.set(key, value);
            }
          });

          const finalUrl = newSearchParams.toString() 
            ? `${newUrl.split('?')[0]}?${newSearchParams.toString()}`
            : newUrl.split('?')[0];

          // Rediriger vers l'URL du produit sans les paramètres d'affiliation dans l'URL
          window.history.replaceState({}, '', finalUrl);
        } else {
          // Simplement retirer les paramètres d'affiliation de l'URL
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete('aff');
          newSearchParams.delete('ref');
          newSearchParams.delete('affiliate');
          
          if (newSearchParams.toString()) {
            window.history.replaceState({}, '', `${location.pathname}?${newSearchParams.toString()}`);
          } else {
            window.history.replaceState({}, '', location.pathname);
          }
        }
      } catch (error: any) {
        logger.error('Unexpected error tracking affiliate click', {
          error: error.message,
          code: affiliateCode,
        });
      }
    };

    // Attendre un court délai pour s'assurer que la page est chargée
    const timeoutId = setTimeout(() => {
      trackAffiliateClick();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, searchParams, setSearchParams]);

  // Ce composant ne rend rien
  return null;
}

