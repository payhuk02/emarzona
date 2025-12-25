/**
 * Composant : CrispChat
 * Intégration Live Chat Crisp - Universel pour tous types de produits
 * Date : 27 octobre 2025
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initCrisp, setCrispUser, setCrispSessionData, configureCrispForRole, resetCrisp } from '@/lib/crisp';
import { useLocation } from 'react-router-dom';
import { logger } from '@/lib/logger';

export const CrispChat: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const CRISP_WEBSITE_ID = import.meta.env.VITE_CRISP_WEBSITE_ID;

  // Initialiser Crisp au montage
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) {
      logger.warn('VITE_CRISP_WEBSITE_ID non configuré. Live Chat désactivé.');
      return;
    }

    initCrisp(CRISP_WEBSITE_ID);
  }, [CRISP_WEBSITE_ID]);

  // Synchroniser l'utilisateur avec Crisp
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return;

    if (user) {
      // Utilisateur connecté
      setCrispUser({
        email: user.email,
        nickname: user.user_metadata?.name || user.email?.split('@')[0] || 'Utilisateur',
        avatar: user.user_metadata?.avatar_url,
      });

      // Déterminer le rôle (simplifié, ajuster selon votre logique)
      const role = user.user_metadata?.role || 'buyer';
      configureCrispForRole(role);

      setCrispSessionData({
        user_id: user.id,
        locale: navigator.language || 'fr',
      });
    } else {
      // Visiteur non connecté
      configureCrispForRole('visitor');
      setCrispSessionData({
        locale: navigator.language || 'fr',
      });
    }
  }, [user, CRISP_WEBSITE_ID]);

  // Réinitialiser lors du logout
  useEffect(() => {
    if (!CRISP_WEBSITE_ID) return;

    return () => {
      if (!user) {
        resetCrisp();
      }
    };
  }, [user, CRISP_WEBSITE_ID]);

  // Tracking de la page actuelle
  useEffect(() => {
    if (!CRISP_WEBSITE_ID || !window.$crisp) return;

    // Envoyer l'événement de navigation
    window.$crisp.push(['set', 'session:event', [['page_view', { path: location.pathname }]]]);
  }, [location.pathname, CRISP_WEBSITE_ID]);

  // Composant invisible (Crisp se charge tout seul)
  return null;
};

