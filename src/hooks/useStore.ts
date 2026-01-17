import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
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
  created_at: string;
  updated_at: string;
}

export const useStore = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const {
    selectedStoreId,
    selectedStore: contextStore,
    loading: contextLoading,
  } = useStoreContext();
  const { toast } = useToast();

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

    // Si un domaine personnalisé est configuré, utiliser le format sous-domaine
    if (store.custom_domain) {
      return `https://${store.subdomain || store.slug}.${store.custom_domain}`;
    }

    // Utiliser le format myemarzona.shop pour les boutiques
    // Le subdomain est généré automatiquement lors de la création
    if (store.subdomain) {
      return `https://${store.subdomain}.myemarzona.shop`;
    }

    // Fallback: utiliser le slug si subdomain n'est pas encore généré
    // (peut arriver si la migration n'a pas été appliquée)
    return `https://${store.slug}.myemarzona.shop`;
  };

  const getProductUrl = (productSlug: string): string => {
    if (!store) return '';

    // Utiliser le format myemarzona.shop
    const subdomain = store.subdomain || store.slug;
    if (store.custom_domain) {
      return `https://${subdomain}.${store.custom_domain}/products/${productSlug}`;
    }
    return `https://${subdomain}.myemarzona.shop/products/${productSlug}`;
  };

  const fetchStore = useCallback(async () => {
    // ✅ FIX: Vérifications de sécurité supplémentaires pour éviter les requêtes inutiles
    if (!user || !user.id) {
      logger.warn('❌ [useStore] fetchStore appelé sans utilisateur valide');
      setStore(null);
      setLoading(false);
      return;
    }

    try {
      logger.info('🔍 [useStore] fetchStore appelé', {
        userId: user.id,
        selectedStoreId,
        contextStoreId: contextStore?.id,
      });

      setLoading(true);

      // Utiliser la boutique du contexte si disponible et valide
      if (contextStore && contextStore.id && contextStore.user_id === user.id) {
        logger.info('✅ [useStore] Utilisation de la boutique du contexte:', contextStore.id);
        setStore(contextStore);
        setLoading(false);
        return;
      }

      // Si pas de boutique sélectionnée mais un ID valide
      if (selectedStoreId && selectedStoreId.trim()) {
        logger.info('📡 [useStore] Récupération depuis DB:', selectedStoreId);

        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('id', selectedStoreId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          logger.error('❌ [useStore] Erreur DB:', error);
          setStore(null);
        } else {
          logger.info('✅ [useStore] Boutique récupérée:', data.id);
          setStore(data);
        }
      } else {
        logger.info('⚠️ [useStore] Aucune boutique sélectionnée');
        setStore(null);
      }
    } catch (error) {
      logger.error('💥 [useStore] Exception:', error);
      setStore(null);
      // Éviter les toasts répétés en cas d'erreur
      if (!store) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger votre boutique',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedStoreId, contextStore?.id, toast]); // ✅ Dépendances simplifiées

  const createStore = async (name: string, description?: string) => {
    try {
      if (!user) throw new Error('Non authentifié');

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

      const slug = generateSlug(name);

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
      const { data, error } = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          name,
          slug,
          description: description || null,
          // subdomain sera généré automatiquement par le trigger auto_generate_subdomain
        })
        .select()
        .limit(1);

      if (error) throw error;

      setStore(data && data.length > 0 ? data[0] : null);
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
      const updateData: Partial<Store> = { ...(sanitizedUpdates as Partial<Store>) };

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

      const { data, error } = await supabase
        .from('stores')
        .update(updateData)
        .eq('id', store.id)
        .select()
        .limit(1);

      if (error) throw error;

      setStore(data && data.length > 0 ? data[0] : store);
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

  // ✅ FIX: Éviter les requêtes répétées avec un debounce et des conditions plus strictes
  useEffect(() => {
    // Ne pas exécuter si encore en chargement
    if (authLoading || contextLoading) {
      logger.info('⏳ [useStore] En attente de l\'auth et du contexte...');
      return;
    }

    // Ne pas exécuter si pas d'utilisateur
    if (!user) {
      logger.info('❌ [useStore] Pas d\'utilisateur, pas de requête');
      setStore(null);
      setLoading(false);
      return;
    }

    // Éviter les requêtes répétées pour la même boutique
    if (contextStore && store?.id === contextStore.id) {
      logger.info('✅ [useStore] Boutique déjà chargée depuis le contexte');
      setStore(contextStore);
      setLoading(false);
      return;
    }

    logger.info('🔄 [useStore] Exécution de fetchStore');
    fetchStore();
  }, [user?.id, selectedStoreId]); // ✅ Dépendances simplifiées pour éviter les re-renders inutiles

  return {
    store,
    loading: loading || authLoading || contextLoading, // Attendre que l'auth, le contexte ET le store soient chargés
    createStore,
    updateStore,
    refreshStore: fetchStore,
    getStoreUrl,
    getProductUrl,
    generateSlug,
    checkSlugAvailability,
  };
};
