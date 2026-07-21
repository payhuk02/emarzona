import { useCallback } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import type { Database, Json } from '@/integrations/supabase/types';

type StoreUpdate = Database['public']['Tables']['stores']['Update'];
import { buildStoreCreateDefaults } from '@/lib/commerce/store-create-defaults';
import { STORE_COMMERCE_TYPES } from '@/constants/store-commerce-types';
import { fetchStoreById, mapStoreRow, storeQueryKeys } from '@/lib/store/store-query';

export interface CreateStoreParams {
  name: string;
  commerce_type: StoreCommerceType;
  description?: string;
  slug?: string;
}

function assertValidCommerceType(value: unknown): StoreCommerceType {
  if (typeof value === 'string' && (STORE_COMMERCE_TYPES as readonly string[]).includes(value)) {
    return value as StoreCommerceType;
  }
  throw new Error('Le type de boutique (commerce_type) est obligatoire.');
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  subdomain?: string | null;
  description: string | null;
  default_currency?: string;
  custom_domain: string | null;
  domain_status: string | null;
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  domain_error_message: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  info_message?: string | null;
  info_message_color?: string | null;
  info_message_font?: string | null;
  metadata?: Json | null;
  commerce_type?: StoreCommerceType | null;
  created_at: string;
  updated_at: string;
}

export const useStore = () => {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { stores, selectedStoreId, loading: contextLoading } = useStoreContext();
  const { toast } = useToast();

  const hasKnownStore = !!selectedStoreId && stores.some(entry => entry.id === selectedStoreId);

  const queryEnabled = !!user?.id && !authLoading && !contextLoading && hasKnownStore;

  const {
    data: store = null,
    isLoading: queryLoading,
    isFetching: queryFetching,
    isError: queryError,
    refetch,
  } = useQuery({
    queryKey: storeQueryKeys.detail(user?.id ?? '', selectedStoreId ?? ''),
    queryFn: async () => {
      if (!user?.id || !selectedStoreId?.trim()) return null;
      return fetchStoreById(user.id, selectedStoreId);
    },
    enabled: queryEnabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const loading =
    authLoading ||
    contextLoading ||
    (!!user?.id && !hasKnownStore && stores.length === 0 && !queryError) ||
    (hasKnownStore && !store && (queryLoading || queryFetching) && !queryError);

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const checkSlugAvailability = async (slug: string, excludeStoreId?: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_store_slug_available', {
        check_slug: slug,
        exclude_store_id: excludeStoreId || null,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      logger.error('Error checking slug availability:', error);
      return false;
    }
  };

  // Fonction getStoreDomain supprimée (non utilisée)
  // Le domaine est maintenant toujours myemarzona.shop pour les boutiques

  const getStoreUrl = (): string => {
    if (!store) return '';

    // Si un domaine personnalisé est configuré
    if (store.custom_domain) {
      return `https://${store.custom_domain}`;
    }

    const storeSubdomain = store.subdomain || store.slug;
    return `https://${storeSubdomain}.myemarzona.shop`;
  };

  const getProductUrl = (productSlug: string): string => {
    if (!store) return '';

    if (store.custom_domain) {
      return `https://${store.custom_domain}/products/${productSlug}`;
    }
    const storeSubdomain = store.subdomain || store.slug;
    return `https://${storeSubdomain}.myemarzona.shop/products/${productSlug}`;
  };

  const refreshStore = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const createStore = async (params: CreateStoreParams) => {
    try {
      if (!user) throw new Error('Non authentifié');

      const name = params.name?.trim();
      if (!name) throw new Error('Le nom de la boutique est requis');

      const commerceType = assertValidCommerceType(params.commerce_type);

      // Vérifier la limite de 3 boutiques
      const { data: existingStores, error: checkError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id);

      if (checkError) {
        logger.error('Error checking existing stores:', checkError);
        throw checkError;
      }

      const storeCount = existingStores?.length || 0;
      if (storeCount >= 3) {
        toast({
          title: 'Limite atteinte',
          description:
            "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
          variant: 'destructive',
        });
        return false;
      }

      const slug = (params.slug?.trim() || generateSlug(name)).toLowerCase();

      // Vérifier disponibilité
      const isAvailable = await checkSlugAvailability(slug);
      if (!isAvailable) {
        toast({
          title: 'Nom indisponible',
          description: 'Ce nom de boutique est déjà utilisé. Essayez un autre nom.',
          variant: 'destructive',
        });
        return false;
      }

      // Le subdomain sera généré automatiquement par le trigger SQL
      // à partir du slug lors de l'insertion
      const verticalDefaults = buildStoreCreateDefaults(commerceType);
      const { data, error } = await supabase
        .from('stores')
        .insert({
          ...sanitizeStorePayload({
            ...verticalDefaults,
            name,
            slug,
            description: params.description?.trim() || null,
            commerce_type: commerceType,
            metadata: { commerce_type: commerceType },
            is_active: true,
          }),
          // Réinjecter user_id (exclu de sanitize volontairement pour les updates)
          user_id: user.id,
        })
        .select('id, name, slug, user_id, commerce_type, created_at')
        .limit(1);

      if (error) throw error;

      const created = mapStoreRow(data?.[0] ?? null);
      if (created && user?.id) {
        queryClient.setQueryData(storeQueryKeys.detail(user.id, created.id), created);
        queryClient.setQueryData(storeQueryKeys.firstForUser(user.id), created);
      }
      toast({
        title: 'Boutique créée !',
        description: `Votre boutique "${name}" est maintenant en ligne.`,
      });
      return true;
    } catch (error) {
      logger.error('Error creating store:', error);

      // Gérer l'erreur spécifique de limite de la base de données
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message?: string }).message;
        if (errorMessage && errorMessage.includes('Limite de 3 boutiques')) {
          toast({
            title: 'Limite atteinte',
            description:
              "Limite de 3 boutiques par utilisateur atteinte. Vous devez supprimer une boutique existante avant d'en créer une nouvelle.",
            variant: 'destructive',
          });
          return false;
        }
      }

      toast({
        title: 'Erreur',
        description: 'Impossible de créer votre boutique',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateStore = async (updates: Partial<Store> & Record<string, unknown>) => {
    if (!store) return false;

    try {
      // Nettoyer le payload pour ne garder que les colonnes réellement supportées
      const sanitizedUpdates = sanitizeStorePayload(updates as Record<string, unknown>);
      const updateData: Record<string, unknown> = { ...sanitizedUpdates };

      // Si le nom change, regénérer le slug
      if (updates.name && updates.name !== store.name) {
        const newSlug = generateSlug(updates.name);
        const isAvailable = await checkSlugAvailability(newSlug, store.id);

        if (!isAvailable) {
          toast({
            title: 'Nom indisponible',
            description: 'Ce nom de boutique est déjà utilisé.',
            variant: 'destructive',
          });
          return false;
        }

        updateData.slug = newSlug;
      }

      const { error } = await supabase
        .from('stores')
        .update(updateData as StoreUpdate)
        .eq('id', store.id);

      if (error) throw error;

      if (user?.id && store.id) {
        await queryClient.invalidateQueries({
          queryKey: storeQueryKeys.detail(user.id, store.id),
        });
      }
      toast({
        title: 'Boutique mise à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      return true;
    } catch (error) {
      logger.error('Error updating store:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre boutique',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    store,
    loading,
    hasStores: stores.length > 0,
    createStore,
    updateStore,
    refreshStore,
    getStoreUrl,
    getProductUrl,
    generateSlug,
    checkSlugAvailability,
  };
};
