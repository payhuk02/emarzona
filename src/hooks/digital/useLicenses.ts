/**
 * Digital Licenses Hooks - Professional
 * Date: 27 octobre 2025
 * 
 * Système de gestion des licenses professionnel
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export interface DigitalLicense {
  id: string;
  digital_product_id: string;
  user_id: string;
  license_key: string;
  license_type: 'single' | 'multi' | 'unlimited' | 'subscription' | 'lifetime';
  status: 'active' | 'suspended' | 'expired' | 'revoked' | 'pending';
  max_activations: number;
  current_activations: number;
  activation_history: any[];
  issued_at: string;
  activated_at: string | null;
  expires_at: string | null;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicenseActivation {
  id: string;
  license_id: string;
  device_id: string;
  device_name: string | null;
  device_type: string | null;
  os_name: string | null;
  ip_address: string;
  activated_at: string;
  is_active: boolean;
}

// =====================================================
// QUERY KEYS
// =====================================================

export const licenseKeys = {
  all: ['licenses'] as const,
  lists: () => [...licenseKeys.all, 'list'] as const,
  list: (filters: any) => [...licenseKeys.lists(), filters] as const,
  detail: (id: string) => [...licenseKeys.all, 'detail', id] as const,
  userLicenses: (userId: string) => [...licenseKeys.all, 'user', userId] as const,
  productLicenses: (productId: string) => [...licenseKeys.all, 'product', productId] as const,
  activations: (licenseId: string) => [...licenseKeys.detail(licenseId), 'activations'] as const,
};

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * Get user's licenses
 */
export const useUserLicenses = () => {
  return useQuery({
    queryKey: licenseKeys.userLicenses('current'),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('digital_licenses')
        .select(`
          *,
          digital_product:digital_products (
            id,
            digital_type,
            product:products (
              id,
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (DigitalLicense & { digital_product: any })[];
    },
  });
};

/**
 * Get specific license
 */
export const useLicense = (licenseId: string) => {
  return useQuery({
    queryKey: licenseKeys.detail(licenseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .select(`
          *,
          digital_product:digital_products (
            *,
            product:products (*)
          )
        `)
        .eq('id', licenseId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!licenseId,
  });
};

/**
 * Get license activations
 */
export const useLicenseActivations = (licenseId: string) => {
  return useQuery({
    queryKey: licenseKeys.activations(licenseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_license_activations')
        .select('*')
        .eq('license_id', licenseId)
        .order('activated_at', { ascending: false });

      if (error) throw error;
      return data as LicenseActivation[];
    },
    enabled: !!licenseId,
  });
};

/**
 * Get licenses for a product (for store owners)
 */
export const useProductLicenses = (digitalProductId: string) => {
  return useQuery({
    queryKey: licenseKeys.productLicenses(digitalProductId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DigitalLicense[];
    },
    enabled: !!digitalProductId,
  });
};

/**
 * Validate license key
 */
export const useValidateLicense = (licenseKey: string) => {
  return useQuery({
    queryKey: ['validate-license', licenseKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_licenses')
        .select('*')
        .eq('license_key', licenseKey)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { valid: false, reason: 'Invalid license key' };
        }
        throw error;
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return { valid: false, reason: 'License expired', license: data };
      }

      // Check status
      if (data.status !== 'active') {
        return { valid: false, reason: `License ${data.status}`, license: data };
      }

      // Check activations
      if (data.max_activations !== -1 && data.current_activations >= data.max_activations) {
        return { valid: false, reason: 'Max activations reached', license: data };
      }

      return { valid: true, license: data };
    },
    enabled: !!licenseKey && licenseKey.length > 0,
    staleTime: 0, // Always fresh validation
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * Generate license key
 */
function generateLicenseKey(format: string = 'XXXX-XXXX-XXXX-XXXX'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return format.replace(/X/g, () => chars[Math.floor(Math.random() * chars.length)]);
}

/**
 * Create license
 */
export const useCreateLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      digitalProductId: string;
      userId: string;
      licenseType: DigitalLicense['license_type'];
      maxActivations?: number;
      expiresIn?: number; // days
      customerEmail?: string;
    }) => {
      const licenseKey = generateLicenseKey();
      const expiresAt = data.expiresIn 
        ? new Date(Date.now() + data.expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { data: result, error } = await supabase
        .from('digital_licenses')
        .insert({
          digital_product_id: data.digitalProductId,
          user_id: data.userId,
          license_key: licenseKey,
          license_type: data.licenseType,
          max_activations: data.maxActivations || 1,
          expires_at: expiresAt,
          customer_email: data.customerEmail,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: licenseKeys.productLicenses(data.digital_product_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: licenseKeys.userLicenses(data.user_id) 
      });
      toast({
        title: 'Succès',
        description: 'License créée avec succès',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Activate license on a device
 */
export const useActivateLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      licenseKey: string;
      deviceId: string;
      deviceName?: string;
      deviceType?: string;
      osName?: string;
      osVersion?: string;
    }) => {
      // Validate license first
      const { data: license, error: licenseError } = await supabase
        .from('digital_licenses')
        .select('*')
        .eq('license_key', data.licenseKey)
        .single();

      if (licenseError) throw new Error('Invalid license key');

      // Check if can activate
      if (license.status !== 'active') {
        throw new Error(`License is ${license.status}`);
      }

      if (license.max_activations !== -1 && 
          license.current_activations >= license.max_activations) {
        throw new Error('Maximum activations reached');
      }

      // Check if device already activated
      const { data: existing } = await supabase
        .from('digital_license_activations')
        .select('id')
        .eq('license_id', license.id)
        .eq('device_id', data.deviceId)
        .eq('is_active', true)
        .single();

      if (existing) {
        // Just update last_validated
        await supabase
          .from('digital_license_activations')
          .update({ last_validated_at: new Date().toISOString() })
          .eq('id', existing.id);

        return { alreadyActivated: true, license };
      }

      // Get IP (simplified - in production use proper service)
      const ipAddress = '0.0.0.0'; // TODO: Get real IP

      // Create activation
      const { data: activation, error: activationError } = await supabase
        .from('digital_license_activations')
        .insert({
          license_id: license.id,
          device_id: data.deviceId,
          device_name: data.deviceName,
          device_type: data.deviceType,
          os_name: data.osName,
          os_version: data.osVersion,
          ip_address: ipAddress,
          is_active: true,
        })
        .select()
        .single();

      if (activationError) throw activationError;

      // Update license current_activations
      await supabase
        .from('digital_licenses')
        .update({
          current_activations: license.current_activations + 1,
          activated_at: license.activated_at || new Date().toISOString(),
        })
        .eq('id', license.id);

      return { activation, license };
    },
    onSuccess: (data) => {
      if (!data.alreadyActivated) {
        queryClient.invalidateQueries({ 
          queryKey: licenseKeys.detail(data.license.id) 
        });
        queryClient.invalidateQueries({ 
          queryKey: licenseKeys.activations(data.license.id) 
        });
        toast({
          title: 'Succès',
          description: 'License activée sur cet appareil',
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'activation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Deactivate license on a device
 */
export const useDeactivateLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      licenseId: string;
      activationId: string;
    }) => {
      // Deactivate
      const { error: deactivateError } = await supabase
        .from('digital_license_activations')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', params.activationId);

      if (deactivateError) throw deactivateError;

      // Update license current_activations
      const { data: license } = await supabase
        .from('digital_licenses')
        .select('current_activations')
        .eq('id', params.licenseId)
        .single();

      if (license) {
        await supabase
          .from('digital_licenses')
          .update({
            current_activations: Math.max(0, license.current_activations - 1),
          })
          .eq('id', params.licenseId);
      }
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ 
        queryKey: licenseKeys.detail(params.licenseId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: licenseKeys.activations(params.licenseId) 
      });
      toast({
        title: 'Succès',
        description: 'License désactivée sur cet appareil',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Revoke license (admin action)
 */
export const useRevokeLicense = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      licenseId: string;
      reason?: string;
    }) => {
      const { error } = await supabase
        .from('digital_licenses')
        .update({
          status: 'revoked',
          internal_notes: params.reason,
        })
        .eq('id', params.licenseId);

      if (error) throw error;

      // Deactivate all activations
      await supabase
        .from('digital_license_activations')
        .update({
          is_active: false,
          deactivation_reason: 'License revoked',
        })
        .eq('license_id', params.licenseId)
        .eq('is_active', true);
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ 
        queryKey: licenseKeys.detail(params.licenseId) 
      });
      toast({
        title: 'Succès',
        description: 'License révoquée',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};


