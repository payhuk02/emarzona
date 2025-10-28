/**
 * Hook pour forcer l'activation du 2FA pour les utilisateurs admin
 * 
 * Vérifie si :
 * 1. L'utilisateur est admin/superadmin
 * 2. Le 2FA est activé ou non
 * 3. Force la redirection vers Settings si 2FA manquant
 * 
 * @module useRequire2FA
 */

import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Require2FAResult {
  /** Le 2FA est-il activé ? */
  is2FAEnabled: boolean;
  /** L'utilisateur doit-il activer le 2FA ? */
  requires2FA: boolean;
  /** Chargement en cours */
  isLoading: boolean;
  /** Jours restants avant obligation (grace period) */
  daysRemaining: number | null;
}

const GRACE_PERIOD_DAYS = 7; // 7 jours pour activer le 2FA
const WHITELISTED_ROUTES = [
  '/dashboard/settings',
  '/logout',
  '/profile'
];

/**
 * Hook principal pour vérifier et forcer le 2FA
 * 
 * @param options Configuration optionnelle
 * @returns État du 2FA et obligations
 * 
 * @example
 * ```tsx
 * function AdminDashboard() {
 *   const { requires2FA, daysRemaining } = useRequire2FA();
 *   
 *   if (requires2FA && daysRemaining === 0) {
 *     // Utilisateur sera redirigé automatiquement
 *     return <RequireTwoFactorAuthBanner />;
 *   }
 *   
 *   return <Dashboard />
 * }
 * ```
 */
export function useRequire2FA(options?: {
  /** Désactiver la redirection automatique */
  disableRedirect?: boolean;
  /** Grace period personnalisée en jours */
  gracePeriodDays?: number;
  /** Callback lorsque 2FA manquant */
  onRequire2FA?: () => void;
}): Require2FAResult {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hasShownWarning, setHasShownWarning] = useState(false);

  const gracePeriod = options?.gracePeriodDays ?? GRACE_PERIOD_DAYS;

  useEffect(() => {
    checkTwoFactorStatus();
  }, [user, profile]);

  const checkTwoFactorStatus = async () => {
    if (!user || !profile) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Vérifier si l'utilisateur est admin
      const isAdmin = profile.role === 'admin' || profile.role === 'superadmin';
      
      if (!isAdmin) {
        // Pas admin, 2FA pas obligatoire
        setRequires2FA(false);
        setIsLoading(false);
        return;
      }

      // 2. Vérifier si le 2FA est activé via Supabase MFA
      const { data: { factors }, error } = await supabase.auth.mfa.listFactors();
      
      if (error) {
        console.error('[useRequire2FA] Error checking MFA factors:', error);
        setIsLoading(false);
        return;
      }

      // Vérifier s'il y a au moins un facteur vérifié
      const hasVerifiedFactor = factors?.some(
        (factor: any) => factor.status === 'verified'
      ) || false;

      setIs2FAEnabled(hasVerifiedFactor);

      // 3. Si pas de 2FA, calculer la grace period
      if (!hasVerifiedFactor) {
        const accountCreatedAt = new Date(profile.created_at || user.created_at);
        const now = new Date();
        const daysSinceCreation = Math.floor(
          (now.getTime() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        const remaining = Math.max(0, gracePeriod - daysSinceCreation);
        setDaysRemaining(remaining);

        // 4. Déterminer si on doit forcer le 2FA
        const shouldRequire = remaining === 0;
        setRequires2FA(shouldRequire);

        // 5. Afficher avertissement si nécessaire
        if (remaining > 0 && remaining <= 3 && !hasShownWarning) {
          showWarningToast(remaining);
          setHasShownWarning(true);
        }

        // 6. Forcer redirection si grace period expirée
        if (shouldRequire && !options?.disableRedirect) {
          handleRequiredRedirect();
        }

        // 7. Callback custom
        if (shouldRequire && options?.onRequire2FA) {
          options.onRequire2FA();
        }
      } else {
        setDaysRemaining(null);
        setRequires2FA(false);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('[useRequire2FA] Unexpected error:', error);
      setIsLoading(false);
    }
  };

  const showWarningToast = (days: number) => {
    toast({
      title: '⚠️ Activation 2FA requise',
      description: `Vous devez activer l'authentification à deux facteurs dans ${days} jour${days > 1 ? 's' : ''}. Accédez aux paramètres de sécurité.`,
      variant: 'destructive',
      duration: 10000,
    });
  };

  const handleRequiredRedirect = () => {
    // Ne pas rediriger si déjà sur une route whitelistée
    const isWhitelisted = WHITELISTED_ROUTES.some(route => 
      location.pathname.startsWith(route)
    );

    if (isWhitelisted) {
      return;
    }

    // Afficher notification
    toast({
      title: '🔒 2FA Obligatoire',
      description: 'Vous devez activer l\'authentification à deux facteurs pour accéder à cette page.',
      variant: 'destructive',
      duration: 0, // Persistent
    });

    // Rediriger vers Settings avec tab security
    setTimeout(() => {
      navigate('/dashboard/settings?tab=security&action=enable2fa');
    }, 1000);
  };

  return {
    is2FAEnabled,
    requires2FA,
    isLoading,
    daysRemaining,
  };
}

/**
 * Hook simplifié pour vérifier uniquement si 2FA est activé
 */
export function useIs2FAEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { data: { factors } } = await supabase.auth.mfa.listFactors();
      const hasVerified = factors?.some((f: any) => f.status === 'verified') || false;
      setIsEnabled(hasVerified);
    } catch (error) {
      console.error('[useIs2FAEnabled] Error:', error);
    }
  };

  return isEnabled;
}

