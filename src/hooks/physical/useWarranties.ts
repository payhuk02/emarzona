/**
 * Warranties Management Hooks
 * Date: 27 Janvier 2025
 * 
 * Hooks pour gérer les garanties, enregistrements et réclamations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// =====================================================
// TYPES
// =====================================================

export interface ProductWarranty {
  id: string;
  store_id: string;
  product_id: string;
  variant_id?: string;
  warranty_type: 'manufacturer' | 'store' | 'extended' | 'international';
  warranty_name: string;
  description?: string;
  duration_months: number;
  starts_from: 'purchase' | 'manufacture' | 'delivery';
  coverage_type: 'full' | 'parts_only' | 'labor_only' | 'partial';
  coverage_details: Record<string, any>;
  conditions?: string;
  exclusions?: string;
  requires_registration: boolean;
  requires_invoice: boolean;
  transferable: boolean;
  transfer_fee: number;
  is_active: boolean;
  is_default: boolean;
  terms_url?: string;
  support_contact?: string;
  support_email?: string;
  support_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyRegistration {
  id: string;
  warranty_id: string;
  order_id: string;
  order_item_id?: string;
  user_id: string;
  product_id: string;
  variant_id?: string;
  registration_number: string;
  serial_number?: string;
  purchase_date: string;
  purchase_price?: number;
  invoice_url?: string;
  warranty_start_date: string;
  warranty_end_date: string;
  is_expired: boolean;
  status: 'active' | 'expired' | 'cancelled' | 'transferred';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: Record<string, any>;
  registration_data: Record<string, any>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WarrantyClaim {
  id: string;
  registration_id: string;
  user_id: string;
  store_id: string;
  claim_number: string;
  claim_type: 'repair' | 'replacement' | 'refund' | 'credit';
  description: string;
  issue_category?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  submitted_date: string;
  review_date?: string;
  approved_date?: string;
  completed_date?: string;
  reviewed_by?: string;
  approved_by?: string;
  resolution?: string;
  resolution_notes?: string;
  cost_covered: number;
  customer_cost: number;
  photos: string[];
  documents: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// HOOKS - QUERIES
// =====================================================

/**
 * useProductWarranties - Récupère les garanties d'un produit
 */
export const useProductWarranties = (productId?: string, variantId?: string) => {
  return useQuery({
    queryKey: ['product-warranties', productId, variantId],
    queryFn: async () => {
      if (!productId) throw new Error('Product ID manquant');

      let query = supabase
        .from('product_warranties')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true);

      if (variantId) {
        query = query.or(`variant_id.is.null,variant_id.eq.${variantId}`);
      } else {
        query = query.is('variant_id', null);
      }

      query = query.order('is_default', { ascending: false })
        .order('duration_months', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching product warranties', { error, productId });
        throw error;
      }

      return (data || []) as ProductWarranty[];
    },
    enabled: !!productId,
  });
};

/**
 * useWarrantyRegistrations - Récupère les enregistrements de garantie
 */
export const useWarrantyRegistrations = (userId?: string, filters?: {
  status?: WarrantyRegistration['status'];
  expired?: boolean;
}) => {
  return useQuery({
    queryKey: ['warranty-registrations', userId, filters],
    queryFn: async () => {
      if (!userId) throw new Error('User ID manquant');

      let query = supabase
        .from('warranty_registrations')
        .select(`
          *,
          warranty:product_warranties (
            id,
            warranty_name,
            warranty_type,
            duration_months
          ),
          product:products (
            id,
            name,
            image_url
          )
        `)
        .eq('user_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.expired !== undefined) {
        query = query.eq('is_expired', filters.expired);
      }

      query = query.order('warranty_start_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching warranty registrations', { error, userId });
        throw error;
      }

      return (data || []) as WarrantyRegistration[];
    },
    enabled: !!userId,
  });
};

/**
 * useWarrantyClaims - Récupère les réclamations
 */
export const useWarrantyClaims = (userId?: string, filters?: {
  status?: WarrantyClaim['status'];
  storeId?: string;
}) => {
  return useQuery({
    queryKey: ['warranty-claims', userId, filters],
    queryFn: async () => {
      if (!userId) throw new Error('User ID manquant');

      let query = supabase
        .from('warranty_claims')
        .select(`
          *,
          registration:warranty_registrations (
            id,
            registration_number,
            product:products (id, name)
          )
        `)
        .eq('user_id', userId);

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.storeId) {
        query = query.eq('store_id', filters.storeId);
      }

      query = query.order('submitted_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching warranty claims', { error, userId });
        throw error;
      }

      return (data || []) as WarrantyClaim[];
    },
    enabled: !!userId,
  });
};

// =====================================================
// HOOKS - MUTATIONS
// =====================================================

/**
 * useRegisterWarranty - Enregistrer une garantie
 */
export const useRegisterWarranty = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      warrantyId,
      orderId,
      orderItemId,
      productId,
      variantId,
      serialNumber,
      purchaseDate,
      purchasePrice,
      invoiceUrl,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
    }: {
      warrantyId: string;
      orderId: string;
      orderItemId?: string;
      productId: string;
      variantId?: string;
      serialNumber?: string;
      purchaseDate: string;
      purchasePrice?: number;
      invoiceUrl?: string;
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      customerAddress?: Record<string, any>;
    }) => {
      // Générer numéro d'enregistrement
      const { data: registrationNumber, error: regNumberError } = await supabase.rpc('generate_warranty_registration_number');
      if (regNumberError) throw regNumberError;

      // Récupérer la garantie pour calculer les dates
      const { data: warranty, error: warrantyError } = await supabase
        .from('product_warranties')
        .select('duration_months, starts_from')
        .eq('id', warrantyId)
        .single();

      if (warrantyError) throw warrantyError;

      // Calculer dates
      const startDate = new Date(purchaseDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + warranty.duration_months);

      // Récupérer user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Créer enregistrement
      const { data, error } = await supabase
        .from('warranty_registrations')
        .insert({
          warranty_id: warrantyId,
          order_id: orderId,
          order_item_id: orderItemId,
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          registration_number: registrationNumber,
          serial_number: serialNumber,
          purchase_date: purchaseDate,
          purchase_price: purchasePrice,
          invoice_url: invoiceUrl,
          warranty_start_date: startDate.toISOString(),
          warranty_end_date: endDate.toISOString(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_address: customerAddress,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error registering warranty', { error });
        throw error;
      }

      return data as WarrantyRegistration;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-registrations', data.user_id] });
      toast({
        title: '✅ Garantie enregistrée',
        description: `Votre garantie ${data.registration_number} a été enregistrée`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useRegisterWarranty', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'enregistrer la garantie',
        variant: 'destructive',
      });
    },
  });
};

/**
 * useCreateWarrantyClaim - Créer une réclamation
 */
export const useCreateWarrantyClaim = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      registrationId,
      storeId,
      claimType,
      description,
      issueCategory,
      photos,
      documents,
      priority,
    }: {
      registrationId: string;
      storeId: string;
      claimType: WarrantyClaim['claim_type'];
      description: string;
      issueCategory?: string;
      photos?: string[];
      documents?: string[];
      priority?: WarrantyClaim['priority'];
    }) => {
      // Générer numéro de réclamation
      const { data: claimNumber, error: claimNumberError } = await supabase.rpc('generate_warranty_claim_number');
      if (claimNumberError) throw claimNumberError;

      // Récupérer user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Créer réclamation
      const { data, error } = await supabase
        .from('warranty_claims')
        .insert({
          registration_id: registrationId,
          user_id: user.id,
          store_id: storeId,
          claim_number: claimNumber,
          claim_type: claimType,
          description,
          issue_category: issueCategory,
          status: 'submitted',
          photos: photos || [],
          documents: documents || [],
          priority: priority || 'normal',
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating warranty claim', { error });
        throw error;
      }

      return data as WarrantyClaim;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['warranty-claims', data.user_id] });
      toast({
        title: '✅ Réclamation créée',
        description: `Votre réclamation ${data.claim_number} a été soumise`,
      });
    },
    onError: (error: any) => {
      logger.error('Error in useCreateWarrantyClaim', { error });
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la réclamation',
        variant: 'destructive',
      });
    },
  });
};

