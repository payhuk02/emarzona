/**
 * Hooks pour gérer les collections d'œuvres d'artiste
 * Collections thématiques, galeries, séries
 * Date : 4 Février 2025
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface ArtistCollection {
  id: string;
  store_id: string;
  artist_product_id: string | null;
  collection_name: string;
  collection_slug: string;
  collection_description: string | null;
  collection_short_description: string | null;
  collection_type: 'thematic' | 'chronological' | 'series' | 'exhibition' | 'custom';
  cover_image_url: string | null;
  cover_image_alt: string | null;
  display_order: number;
  is_featured: boolean;
  is_public: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  product_id: string;
  artist_product_id: string;
  display_order: number;
  is_featured_in_collection: boolean;
  collection_notes: string | null;
  added_at: string;
}

export interface CollectionWithItems extends ArtistCollection {
  items_count?: number;
  items?: CollectionItem[];
}

export interface CreateCollectionData {
  store_id: string;
  artist_product_id?: string;
  collection_name: string;
  collection_slug: string;
  collection_description?: string;
  collection_short_description?: string;
  collection_type: 'thematic' | 'chronological' | 'series' | 'exhibition' | 'custom';
  cover_image_url?: string;
  cover_image_alt?: string;
  display_order?: number;
  is_featured?: boolean;
  is_public?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string;
}

export interface AddItemToCollectionData {
  collection_id: string;
  product_id: string;
  artist_product_id: string;
  display_order?: number;
  is_featured_in_collection?: boolean;
  collection_notes?: string;
}

/**
 * Hook pour récupérer toutes les collections d'un store
 */
export const useStoreCollections = (
  storeId: string | undefined,
  includePrivate: boolean = false
) => {
  return useQuery({
    queryKey: ['store-collections', storeId, includePrivate],
    queryFn: async (): Promise<CollectionWithItems[]> => {
      if (!storeId) return [];

      const { data, error } = await supabase.rpc('get_store_collections', {
        p_store_id: storeId,
        p_include_private: includePrivate,
      });

      if (error) {
        if (error.code === '42883' || error.code === '42P01') {
          // Function or table doesn't exist
          return [];
        }
        throw error;
      }

      return (data || []) as CollectionWithItems[];
    },
    enabled: !!storeId,
  });
};

/**
 * Hook pour récupérer une collection spécifique avec ses items
 */
export const useCollection = (collectionId: string | undefined) => {
  return useQuery({
    queryKey: ['collection', collectionId],
    queryFn: async (): Promise<CollectionWithItems | null> => {
      if (!collectionId) return null;

      // Récupérer la collection
      const { data: collection, error: collectionError } = await supabase
        .from('artist_collections')
        .select('*')
        .eq('id', collectionId)
        .single();

      if (collectionError) {
        if (collectionError.code === 'PGRST116' || collectionError.code === '42P01') {
          return null;
        }
        throw collectionError;
      }

      // Récupérer les items
      const { data: items, error: itemsError } = await supabase
        .from('artist_collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true });

      if (itemsError && itemsError.code !== '42P01') {
        throw itemsError;
      }

      return {
        ...(collection as ArtistCollection),
        items: (items || []) as CollectionItem[],
        items_count: items?.length || 0,
      };
    },
    enabled: !!collectionId,
  });
};

/**
 * Hook pour récupérer les items d'une collection
 */
export const useCollectionItems = (collectionId: string | undefined) => {
  return useQuery({
    queryKey: ['collection-items', collectionId],
    queryFn: async (): Promise<CollectionItem[]> => {
      if (!collectionId) return [];

      const { data, error } = await supabase
        .from('artist_collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          return [];
        }
        throw error;
      }

      return (data || []) as CollectionItem[];
    },
    enabled: !!collectionId,
  });
};

/**
 * Hook pour créer une collection
 */
export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateCollectionData) => {
      const { data: collection, error } = await supabase
        .from('artist_collections')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return collection as ArtistCollection;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['store-collections', variables.store_id] });
      toast({
        title: 'Collection créée',
        description: 'La collection a été créée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de créer la collection',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour mettre à jour une collection
 */
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: UpdateCollectionData) => {
      const { id, ...updateData } = data;
      const { data: collection, error } = await supabase
        .from('artist_collections')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return collection as ArtistCollection;
    },
    onSuccess: collection => {
      queryClient.invalidateQueries({ queryKey: ['collection', collection.id] });
      queryClient.invalidateQueries({ queryKey: ['store-collections', collection.store_id] });
      toast({
        title: 'Collection mise à jour',
        description: 'La collection a été mise à jour avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de mettre à jour la collection',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour supprimer une collection
 */
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (collectionId: string) => {
      const { error } = await supabase.from('artist_collections').delete().eq('id', collectionId);

      if (error) throw error;
    },
    onSuccess: (_, collectionId) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      queryClient.invalidateQueries({ queryKey: ['store-collections'] });
      toast({
        title: 'Collection supprimée',
        description: 'La collection a été supprimée avec succès.',
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de supprimer la collection',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour ajouter une œuvre à une collection
 */
export const useAddItemToCollection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AddItemToCollectionData) => {
      const { data: item, error } = await supabase
        .from('artist_collection_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return item as CollectionItem;
    },
    onSuccess: item => {
      queryClient.invalidateQueries({ queryKey: ['collection', item.collection_id] });
      queryClient.invalidateQueries({ queryKey: ['collection-items', item.collection_id] });
      toast({
        title: 'Œuvre ajoutée',
        description: "L'œuvre a été ajoutée à la collection.",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible d'ajouter l'œuvre à la collection",
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour retirer une œuvre d'une collection
 */
export const useRemoveItemFromCollection = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ collectionId, itemId }: { collectionId: string; itemId: string }) => {
      const { error } = await supabase
        .from('artist_collection_items')
        .delete()
        .eq('id', itemId)
        .eq('collection_id', collectionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-items', variables.collectionId] });
      toast({
        title: 'Œuvre retirée',
        description: "L'œuvre a été retirée de la collection.",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || "Impossible de retirer l'œuvre de la collection",
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour réorganiser les items d'une collection
 */
export const useReorderCollectionItems = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      items,
    }: {
      collectionId: string;
      items: Array<{ id: string; display_order: number }>;
    }) => {
      // Mettre à jour chaque item
      const updates = items.map(item =>
        supabase
          .from('artist_collection_items')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
          .eq('collection_id', collectionId)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error).map(r => r.error);

      if (errors.length > 0) {
        throw errors[0];
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['collection', variables.collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-items', variables.collectionId] });
      toast({
        title: 'Ordre mis à jour',
        description: "L'ordre des œuvres a été mis à jour.",
      });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur',
        description: errorMessage || 'Impossible de réorganiser les œuvres',
        variant: 'destructive',
      });
    },
  });
};
