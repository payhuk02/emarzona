/**
 * Composant : CrispChat
 * Chargé uniquement après consentement cookies fonctionnel.
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  initCrisp,
  setCrispUser,
  setCrispSessionData,
  configureCrispForRole,
  resetCrisp,
} from '@/lib/crisp';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useCookiePreferences } from '@/hooks/useLegal';
import { hasFunctionalCookieConsent } from '@/lib/cookie-consent';

export const CrispChat: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { data: cookiePreferences } = useCookiePreferences(user?.id);
  const CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;
  const crispAllowed = hasFunctionalCookieConsent(cookiePreferences);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || !crispAllowed) return;
    initCrisp(CRISP_WEBSITE_ID);
  }, [CRISP_WEBSITE_ID, crispAllowed]);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || !crispAllowed) return;

    if (user) {
      setCrispUser({
        email: user.email,
        nickname: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
        avatar: user.user_metadata?.avatar_url,
      });

      const role = user.user_metadata?.role || 'buyer';
      configureCrispForRole(role);

      setCrispSessionData({
        user_id: user.id,
        locale: navigator.language || 'fr',
      });
    } else {
      configureCrispForRole('visitor');
      setCrispSessionData({
        locale: navigator.language || 'fr',
      });
    }
  }, [user, CRISP_WEBSITE_ID, crispAllowed]);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return;

    if (!crispAllowed) {
      resetCrisp();
      return;
    }

    return () => {
      if (!user) {
        resetCrisp();
      }
    };
  }, [user, CRISP_WEBSITE_ID, crispAllowed]);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || !crispAllowed || !window.$crisp) return;

    window.$crisp.push(['set', 'session:event', [['page_view', { path: location.pathname }]]]);
  }, [location.pathname, CRISP_WEBSITE_ID, crispAllowed]);

  useEffect(() => {
    if (!CRISP_WEBSITE_ID || crispAllowed) return;
    if (import.meta.env.DEV) {
      logger.debug('Crisp désactivé — consentement cookies fonctionnel non accordé.');
    }
  }, [CRISP_WEBSITE_ID, crispAllowed]);

  return null;
};
