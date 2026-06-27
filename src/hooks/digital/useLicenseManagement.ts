/**
 * useLicenseManagement - Hook pour la gestion complète des licences de produits digitaux
 *
 * Fonctionnalités :
 * - Génération automatique de licences
 * - Validation de licences
 * - Activation/Désactivation sur devices
 * - Tracking des activations
 * - Gestion des expirations
 * - Transfert de licences
 * - Historique complet
 *
 * @example
 * ```tsx
 * const {
 *   generateLicense,
 *   validateLicense,
 *   activateLicense,
 *   licenses,
 *   loading
 * } = useLicenseManagement(productId);
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  fetchCanonicalLicensesForProduct,
  resolveDigitalProductId,
  validateDigitalLicenseForActivation,
} from '@/lib/digital/license-management-adapter';
import { logger } from '@/lib/logger';

const DIGITAL_LICENSE_ACTIVATION_FIELDS =
  'id, license_id, device_id, device_name, device_type, os_name, ip_address, activated_at, is_active';

// ============================================================================
// TYPES
// ============================================================================

export type LicenseType = 'single' | 'multi' | 'unlimited' | 'subscription';
export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'suspended' | 'transferred';
export type ActivationStatus = 'active' | 'deactivated' | 'revoked';

export interface DigitalProductLicense {
  id: string;
  product_id: string;
  order_id: string | null;
  customer_id: string | null;
  store_id: string;
  license_key: string;
  license_type: LicenseType;
  status: LicenseStatus;
  max_activations: number;
  current_activations: number;
  issued_at: string;
  activated_at: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  transferable: boolean;
  transferred_from: string | null;
  transferred_to: string | null;
  transferred_at: string | null;
  metadata: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseActivation {
  id: string;
  license_id: string;
  device_name: string | null;
  device_fingerprint: string | null;
  ip_address: string | null;
  user_agent: string | null;
  location: Record<string, unknown> | null;
  status: ActivationStatus;
  activated_at: string;
  last_seen_at: string;
  deactivated_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LicenseEvent {
  id: string;
  license_id: string;
  activation_id: string | null;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  triggered_by: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface GenerateLicenseOptions {
  product_id: string;
  store_id: string; // Required
  order_id?: string;
  customer_id?: string;
  license_type?: LicenseType;
  max_activations?: number;
  expires_at?: Date | null;
  transferable?: boolean;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export interface ActivateLicenseOptions {
  license_key: string;
  device_name?: string;
  device_fingerprint: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  message?: string;
  license?: DigitalProductLicense;
  can_activate?: boolean;
  already_activated?: boolean;
  current_activations?: number;
  max_activations?: number;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useLicenseManagement = (productId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ============================================================================
  // QUERIES
  // ============================================================================

  // Récupérer toutes les licences d'un produit
  const {
    data: licenses = [],
    isLoading: loadingLicenses,
    error: licensesError,
  } = useQuery({
    queryKey: ['digital-licenses', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('store_id')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      return fetchCanonicalLicensesForProduct(productId, product.store_id);
    },
    enabled: !!productId,
  });

  // Récupérer les activations d'une licence
  const useActivations = (licenseId?: string) => {
    return useQuery({
      queryKey: ['license-activations', licenseId],
      queryFn: async () => {
        if (!licenseId) return [];

        const { data, error } = await supabase
          .from('digital_license_activations')
          .select(DIGITAL_LICENSE_ACTIVATION_FIELDS)
          .eq('license_id', licenseId)
          .order('activated_at', { ascending: false });

        if (error) throw error;
        return data as LicenseActivation[];
      },
      enabled: !!licenseId,
    });
  };

  // Récupérer l'historique d'une licence
  const useEvents = (licenseId?: string) => {
    return useQuery({
      queryKey: ['license-events', licenseId],
      queryFn: async () => [] as LicenseEvent[],
      enabled: false,
    });
  };

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Générer une nouvelle licence
  const generateLicenseMutation = useMutation({
    mutationFn: async (options: GenerateLicenseOptions) => {
      // Générer la clé de licence
      const { data: keyData, error: keyError } = await supabase.rpc('generate_license_key');
      if (keyError) throw keyError;
      const licenseKey = keyData as string;

      const digitalProductId = await resolveDigitalProductId(options.product_id);
      if (!digitalProductId) {
        throw new Error('Produit digital introuvable');
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Connexion requise pour générer une licence');
      }

      const { data, error } = await supabase
        .from('digital_licenses')
        .insert({
          digital_product_id: digitalProductId,
          user_id: user.id,
          order_id: options.order_id || null,
          license_key: licenseKey,
          license_type: options.license_type || 'single',
          max_activations: options.max_activations || 1,
          expires_at: options.expires_at?.toISOString() || null,
          status: 'active',
          customer_email:
            typeof options.metadata?.email === 'string' ? options.metadata.email : null,
          internal_notes: options.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...(data as Record<string, unknown>),
        product_id: options.product_id,
        store_id: options.store_id,
        license_key: licenseKey,
      } as DigitalProductLicense;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      toast({
        title: '✅ Licence générée',
        description: `Clé : ${data.license_key}`,
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Impossible de générer la licence',
        variant: 'destructive',
      });
    },
  });

  // Valider une licence
  const validateLicenseMutation = useMutation({
    mutationFn: async ({
      licenseKey,
      deviceFingerprint,
    }: {
      licenseKey: string;
      deviceFingerprint?: string;
    }) => {
      return validateDigitalLicenseForActivation(licenseKey, deviceFingerprint);
    },
  });

  // Activer une licence sur un device
  const activateLicenseMutation = useMutation({
    mutationFn: async (options: ActivateLicenseOptions) => {
      // D'abord valider
      const validation = await validateLicenseMutation.mutateAsync({
        licenseKey: options.license_key,
        deviceFingerprint: options.device_fingerprint,
      });

      if (!validation.valid) {
        throw new Error(validation.message || 'Licence invalide');
      }

      if (validation.already_activated) {
        return { success: true, already_activated: true };
      }

      if (!validation.can_activate) {
        throw new Error("Limite d'activations atteinte");
      }

      // Récupérer l'IP du client
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Créer l'activation
      const { data, error } = await supabase
        .from('digital_license_activations')
        .insert({
          license_id: validation.license!.id,
          device_name: options.device_name || null,
          device_id: options.device_fingerprint,
          ip_address: ip,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('digital_licenses')
        .update({
          current_activations: validation.license!.current_activations + 1,
          activated_at: validation.license!.activated_at || new Date().toISOString(),
          status: 'active',
        })
        .eq('id', validation.license!.id);

      // Déclencher webhook pour activation de licence (en arrière-plan) - Système unifié
      if (validation.license?.store_id) {
        import('@/lib/webhooks/unified-webhook-service')
          .then(({ triggerUnifiedWebhook }) => {
            triggerUnifiedWebhook(
              validation.license.store_id,
              'digital_product.license_activated',
              {
                license_id: validation.license.id,
                product_id: validation.license.digital_product_id || '',
                customer_id: validation.license.user_id,
                license_key: validation.license.license_key,
                license_type: validation.license.license_type || 'standard',
                activation_id: data.id,
                device_name: options.device_name,
              },
              data.id
            ).catch(error => {
              logger.error('Error triggering license_activated webhook', { error });
            });
          })
          .catch(error => {
            logger.error('Error loading unified webhook service', { error });
          });
      }

      return { success: true, activation: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-activations'] });
      toast({
        title: '✅ Licence activée',
        description: 'Votre licence a été activée avec succès',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '❌ Activation échouée',
        description: error instanceof Error ? error.message : "Impossible d'activer la licence",
        variant: 'destructive',
      });
    },
  });

  // Désactiver une activation
  const deactivateActivationMutation = useMutation({
    mutationFn: async (activationId: string) => {
      // Mettre à jour l'activation
      const { data: activation, error: activationError } = await supabase
        .from('digital_license_activations')
        .update({
          is_active: false,
        })
        .eq('id', activationId)
        .select()
        .single();

      if (activationError) throw activationError;

      const { data: license, error: licenseError } = await supabase
        .from('digital_licenses')
        .select('current_activations')
        .eq('id', activation.license_id)
        .single();

      if (licenseError) throw licenseError;

      await supabase
        .from('digital_licenses')
        .update({
          current_activations: Math.max(0, license.current_activations - 1),
        })
        .eq('id', activation.license_id);

      return activation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-activations'] });
      toast({
        title: '✅ Activation désactivée',
        description: "L'activation a été désactivée avec succès",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : "Impossible de désactiver l'activation",
        variant: 'destructive',
      });
    },
  });

  // Révoquer une licence
  const revokeLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .update({ status: 'revoked' })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      toast({
        title: '✅ Licence révoquée',
        description: 'La licence a été révoquée avec succès',
      });
    },
    onError: (error: unknown) => {
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Impossible de révoquer la licence',
        variant: 'destructive',
      });
    },
  });

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Data
    licenses,
    loadingLicenses,
    licensesError,

    // Hooks pour activations et événements
    useActivations,
    useEvents,

    // Actions
    generateLicense: generateLicenseMutation.mutateAsync,
    validateLicense: validateLicenseMutation.mutateAsync,
    activateLicense: activateLicenseMutation.mutateAsync,
    deactivateActivation: deactivateActivationMutation.mutateAsync,
    revokeLicense: revokeLicenseMutation.mutateAsync,

    // Loading states
    isGenerating: generateLicenseMutation.isPending,
    isValidating: validateLicenseMutation.isPending,
    isActivating: activateLicenseMutation.isPending,
    isDeactivating: deactivateActivationMutation.isPending,
    isRevoking: revokeLicenseMutation.isPending,
  };
};

// ============================================================================
// UTILITAIRES
// ============================================================================

/**
 * Génère un device fingerprint simple (côté client)
 * Pour une vraie production, utiliser une librairie comme FingerprintJS
 */
export const generateDeviceFingerprint = (): string => {
  const data = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Simple hash (pour prod, utiliser une vraie fonction de hash)
  return btoa(JSON.stringify(data)).slice(0, 32);
};

/**
 * Formatte une clé de licence pour l'affichage
 */
export const formatLicenseKey = (key: string): string => {
  return key.replace(/(.{4})/g, '$1-').slice(0, -1);
};

/**
 * Vérifie si une licence est expirée
 */
export const isLicenseExpired = (license: DigitalProductLicense): boolean => {
  if (!license.expires_at) return false;
  return new Date(license.expires_at) < new Date();
};

/**
 * Calcule les jours restants avant expiration
 */
export const getDaysUntilExpiry = (license: DigitalProductLicense): number | null => {
  if (!license.expires_at) return null;
  const now = new Date();
  const expiry = new Date(license.expires_at);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
