import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useStoreContext } from '@/contexts/StoreContext';
import { logger } from '@/lib/logger';
import { sanitizeStorePayload } from '@/lib/store-payload-utils';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import type { Json } from '@/integrations/supabase/types';

const STORE_FIELDS =
  'id, user_id, name, slug, subdomain, description, default_currency, custom_domain, domain_status, domain_verification_token, domain_verified_at, domain_error_message, logo_url, banner_url, info_message, info_message_color, info_message_font, metadata, created_at, updated_at';

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
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const hydratedStoreIdRef = useRef<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const {
    selectedStoreId,
    selectedStore: contextStore,
    loading: contextLoading,
    setSelectedStoreId,
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

      const isNewSelection = !selectedStoreId || hydratedStoreIdRef.current !== selectedStoreId;
      if (isNewSelection) {
        setLoading(true);
      }

      // Le contextStore du StoreContext ne contient que id/name/slug/created_at/updated_at
      // et manque les champs essentiels (description, logo_url, etc.)
      // On doit toujours faire un fetch DB pour avoir toutes les données
      // Si pas de boutique sélectionnée mais un ID valide
      if (selectedStoreId && selectedStoreId.trim()) {
        logger.info('📡 [useStore] Récupération depuis DB:', selectedStoreId);

        const { data, error } = await supabase
          .from('stores')
          .select(STORE_FIELDS)
          .eq('id', selectedStoreId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          logger.error('❌ [useStore] Erreur DB:', error);
          setStore(null);
        } else {
          logger.info('✅ [useStore] Boutique récupérée:', data.id);
          setStore(data);
          hydratedStoreIdRef.current = data.id;
        }
      } else {
        logger.info('⚠️ [useStore] Aucune boutique sélectionnée');
        setStore(null);
        hydratedStoreIdRef.current = null;
      }
    } catch (error) {
      logger.error('💥 [useStore] Exception:', error);
      setStore(null);
      hydratedStoreIdRef.current = null;
      toast({
        title: 'Erreur',
        description: 'Impossible de charger votre boutique',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedStoreId, contextStore?.id, toast]);

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

      const { data, error } = await (
        supabase as unknown as {
          from: (table: 'stores') => {
            update: (values: Record<string, unknown>) => {
              eq: (
                column: string,
                value: string
              ) => {
                select: () => {
                  limit: (count: number) => Promise<{ data: Store[] | null; error: unknown }>;
                };
              };
            };
          };
        }
      )
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

  // ✅ FIX: Gestion améliorée - cherche automatiquement la première boutique si aucune n'est sélectionnée
  useEffect(() => {
    // Attendre que tout soit chargé
    if (authLoading || contextLoading) {
      logger.debug('⏳ [useStore] En attente du chargement complet...');
      return;
    }

    // Pas d'utilisateur = pas de boutique
    if (!user?.id) {
      logger.debug('❌ [useStore] Aucun utilisateur authentifié');
      setStore(null);
      setLoading(false);
      return;
    }

    // Le contextStore du StoreContext ne contient que 5 champs basiques,
    // il faut toujours faire un fetch DB complet pour useStore
    // Ne pas utiliser contextStore comme raccourci ici

    // Charger depuis la DB si un ID est sélectionné
    if (selectedStoreId) {
      logger.info('🔄 [useStore] Chargement boutique DB:', selectedStoreId);
      fetchStore();
      return;
    }

    // ✅ FIX: Aucune boutique sélectionnée → chercher la première boutique de l'utilisateur
    logger.info('🔍 [useStore] Aucune boutique sélectionnée, recherche automatique...');
    setLoading(true);
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('stores')
          .select(STORE_FIELDS)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (fetchError) {
          logger.error('❌ [useStore] Erreur recherche auto:', fetchError);
          setStore(null);
        } else if (data && data.length > 0) {
          logger.info('✅ [useStore] Boutique trouvée automatiquement:', data[0].id);
          setStore(data[0]);
          hydratedStoreIdRef.current = data[0].id;
          // Mettre à jour le contexte via setSelectedStoreId (évite la désynchronisation)
          try {
            setSelectedStoreId(data[0].id);
          } catch (e) {
            // Context might not be ready yet
            logger.debug('Context sync failed during auto-select', e);
          }
        } else {
          logger.info('ℹ️ [useStore] Aucune boutique existante');
          setStore(null);
          hydratedStoreIdRef.current = null;
        }
      } catch (err) {
        logger.error('💥 [useStore] Exception recherche auto:', err);
        setStore(null);
        hydratedStoreIdRef.current = null;
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id, selectedStoreId, authLoading, contextLoading, fetchStore]); // Dépendances complètes

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
