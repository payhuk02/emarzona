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

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  metadata: Record<string, any>;
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
  location: Record<string, any> | null;
  status: ActivationStatus;
  activated_at: string;
  last_seen_at: string;
  deactivated_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LicenseEvent {
  id: string;
  license_id: string;
  activation_id: string | null;
  event_type: string;
  description: string | null;
  metadata: Record<string, any>;
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
  metadata?: Record<string, any>;
  notes?: string;
}

export interface ActivateLicenseOptions {
  license_key: string;
  device_name?: string;
  device_fingerprint: string;
  metadata?: Record<string, any>;
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

      const { data, error } = await supabase
        .from('digital_product_licenses')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalProductLicense[];
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
          .from('license_activations')
          .select('*')
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
      queryFn: async () => {
        if (!licenseId) return [];

        const { data, error } = await supabase
          .from('license_events')
          .select('*')
          .eq('license_id', licenseId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data as LicenseEvent[];
      },
      enabled: !!licenseId,
    });
  };

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  // Générer une nouvelle licence
  const generateLicenseMutation = useMutation({
    mutationFn: async (options: GenerateLicenseOptions) => {
      // Générer la clé de licence
      const { data: keyData, error: keyError } = await supabase.rpc(
        'generate_license_key'
      );

      if (keyError) throw keyError;

      const licenseKey = keyData as string;

      // Créer la licence
      const { data, error } = await supabase
        .from('digital_product_licenses')
        .insert({
          product_id: options.product_id,
          order_id: options.order_id || null,
          customer_id: options.customer_id || null,
          store_id: options.store_id, // Doit être fourni
          license_key: licenseKey,
          license_type: options.license_type || 'single',
          max_activations: options.max_activations || 1,
          expires_at: options.expires_at?.toISOString() || null,
          transferable: options.transferable || false,
          metadata: options.metadata || {},
          notes: options.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Créer un événement
      await supabase.from('license_events').insert({
        license_id: data.id,
        event_type: 'issued',
        description: 'Licence générée',
        metadata: { method: 'manual' },
      });

      return data as DigitalProductLicense;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      toast({
        title: '✅ Licence générée',
        description: `Clé : ${data.license_key}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de générer la licence',
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
      const { data, error } = await supabase.rpc('validate_license', {
        p_license_key: licenseKey,
        p_device_fingerprint: deviceFingerprint || null,
      });

      if (error) throw error;
      return data as ValidationResult;
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
        throw new Error('Limite d\'activations atteinte');
      }

      // Récupérer l'IP du client
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Créer l'activation
      const { data, error } = await supabase
        .from('license_activations')
        .insert({
          license_id: validation.license!.id,
          device_name: options.device_name || null,
          device_fingerprint: options.device_fingerprint,
          ip_address: ip,
          user_agent: navigator.userAgent,
          metadata: options.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Incrémenter le compteur d'activations
      await supabase
        .from('digital_product_licenses')
        .update({
          current_activations: validation.license!.current_activations + 1,
          activated_at: validation.license!.activated_at || new Date().toISOString(),
          last_used_at: new Date().toISOString(),
        })
        .eq('id', validation.license!.id);

      // Créer un événement
      await supabase.from('license_events').insert({
        license_id: validation.license!.id,
        activation_id: data.id,
        event_type: 'activated',
        description: `Activé sur ${options.device_name || 'un appareil'}`,
        ip_address: ip,
        user_agent: navigator.userAgent,
      });

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
    onError: (error: any) => {
      toast({
        title: '❌ Activation échouée',
        description: error.message || 'Impossible d\'activer la licence',
        variant: 'destructive',
      });
    },
  });

  // Désactiver une activation
  const deactivateActivationMutation = useMutation({
    mutationFn: async (activationId: string) => {
      // Mettre à jour l'activation
      const { data: activation, error: activationError } = await supabase
        .from('license_activations')
        .update({
          status: 'deactivated',
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', activationId)
        .select()
        .single();

      if (activationError) throw activationError;

      // Décrémenter le compteur
      const { data: license, error: licenseError } = await supabase
        .from('digital_product_licenses')
        .select('current_activations')
        .eq('id', activation.license_id)
        .single();

      if (licenseError) throw licenseError;

      await supabase
        .from('digital_product_licenses')
        .update({
          current_activations: Math.max(0, license.current_activations - 1),
        })
        .eq('id', activation.license_id);

      // Créer un événement
      await supabase.from('license_events').insert({
        license_id: activation.license_id,
        activation_id: activationId,
        event_type: 'deactivated',
        description: 'Activation désactivée',
      });

      return activation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      queryClient.invalidateQueries({ queryKey: ['license-activations'] });
      toast({
        title: '✅ Activation désactivée',
        description: 'L\'activation a été désactivée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de désactiver l\'activation',
        variant: 'destructive',
      });
    },
  });

  // Révoquer une licence
  const revokeLicenseMutation = useMutation({
    mutationFn: async (licenseId: string) => {
      const { data, error } = await supabase
        .from('digital_product_licenses')
        .update({ status: 'revoked' })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) throw error;

      // Créer un événement
      await supabase.from('license_events').insert({
        license_id: licenseId,
        event_type: 'revoked',
        description: 'Licence révoquée',
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['digital-licenses'] });
      toast({
        title: '✅ Licence révoquée',
        description: 'La licence a été révoquée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de révoquer la licence',
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

