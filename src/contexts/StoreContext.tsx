import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

// Import des types depuis useStores pour éviter la duplication
import type { Store as StoreType } from '@/hooks/useStores';

// Utiliser directement StoreType au lieu de créer une interface vide
export type Store = StoreType;

interface StoreContextType {
  stores: Store[];
  selectedStoreId: string | null;
  selectedStore: Store | null;
  loading: boolean;
  error: string | null;
  setSelectedStoreId: (storeId: string | null) => void;
  switchStore: (storeId: string) => void;
  refreshStores: () => Promise<void>;
  canCreateStore: () => boolean;
  getRemainingStores: () => number;
}

const StoreContext = createContext<StoreContextType>({
  stores: [],
  selectedStoreId: null,
  selectedStore: null,
  loading: true,
  error: null,
  setSelectedStoreId: () => {},
  switchStore: () => {},
  refreshStores: async () => {},
  canCreateStore: () => false,
  getRemainingStores: () => 0,
});

const MAX_STORES_PER_USER = 3;
const STORAGE_KEY = 'selectedStoreId';

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la boutique sélectionnée depuis localStorage
  const getStoredStoreId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      logger.warn('Failed to read selectedStoreId from localStorage', e);
      return null;
    }
  }, []);

  // Sauvegarder la boutique sélectionnée dans localStorage
  const saveStoreIdToStorage = useCallback((storeId: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (storeId) {
        localStorage.setItem(STORAGE_KEY, storeId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      logger.warn('Failed to save selectedStoreId to localStorage', e);
    }
  }, []);

  // Charger toutes les boutiques de l'utilisateur
  const fetchStores = useCallback(async () => {
    if (!user) {
      setStores([]);
      setSelectedStoreIdState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const storesData = (data || []) as Store[];
      setStores(storesData);

      // Si aucune boutique n'est sélectionnée, essayer de récupérer depuis localStorage
      if (storesData.length > 0) {
        const storedStoreId = getStoredStoreId();
        const validStoreId =
          storedStoreId && storesData.some(s => s.id === storedStoreId)
            ? storedStoreId
            : storesData[0].id; // Utiliser la première boutique par défaut

        setSelectedStoreIdState(validStoreId);
        saveStoreIdToStorage(validStoreId);
      } else {
        setSelectedStoreIdState(null);
        saveStoreIdToStorage(null);
      }
    } catch (err: unknown) {
      logger.error('Error fetching stores', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du chargement des boutiques';
      setError(errorMessage);
      setStores([]);
      setSelectedStoreIdState(null);
    } finally {
      setLoading(false);
    }
  }, [user, getStoredStoreId, saveStoreIdToStorage]);

  // ✅ FIX: Charger les boutiques de manière plus stable
  useEffect(() => {
    if (!authLoading && user?.id) {
      logger.info('🔄 [StoreContext] Chargement initial des boutiques pour user:', user.id);
      fetchStores();
    } else if (!authLoading && !user) {
      // Utilisateur déconnecté
      setStores([]);
      setSelectedStoreIdState(null);
      setLoading(false);
      setError(null);
    }
  }, [authLoading, user?.id]); // ✅ FIX: Dépendance simplifiée, pas fetchStores

  // Calculer la boutique sélectionnée
  const selectedStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) || null : null;

  // ✅ FIX: Fonction pour définir la boutique sélectionnée avec moins de dépendances
  const setSelectedStoreId = useCallback(
    (storeId: string | null) => {
      logger.info('🔄 [StoreContext] Changement de boutique', {
        oldStoreId: selectedStoreId,
        newStoreId: storeId,
        storesCount: stores.length,
      });

      // ✅ FIX: Validation plus stricte et avec retry
      const validateAndSet = () => {
        if (storeId && !stores.some(s => s.id === storeId)) {
          logger.warn('Tentative de sélectionner une boutique inexistante, retry dans 100ms', { storeId, availableStores: stores.map(s => s.id) });

          // Retry après un court délai si les stores ne sont pas encore chargés
          setTimeout(() => {
            if (stores.some(s => s.id === storeId)) {
              logger.info('✅ [StoreContext] Retry réussi, boutique trouvée');
              setSelectedStoreIdState(storeId);
              saveStoreIdToStorage(storeId);
            } else {
              logger.error('❌ [StoreContext] Retry échoué, boutique toujours introuvable');
            }
          }, 100);
          return;
        }

        setSelectedStoreIdState(storeId);
        saveStoreIdToStorage(storeId);
      };

      validateAndSet();
    },
    [selectedStoreId, stores, saveStoreIdToStorage]
  );

  // Fonction pour changer de boutique
  const switchStore = useCallback(
    (storeId: string) => {
      setSelectedStoreId(storeId);
    },
    [setSelectedStoreId]
  );

  // Fonction pour rafraîchir la liste des boutiques
  const refreshStores = useCallback(async () => {
    await fetchStores();
  }, [fetchStores]);

  // Fonction pour vérifier si l'utilisateur peut créer une boutique
  const canCreateStore = useCallback(() => {
    return stores.length < MAX_STORES_PER_USER;
  }, [stores.length]);

  // Fonction pour obtenir le nombre de boutiques restantes
  const getRemainingStores = useCallback(() => {
    return Math.max(0, MAX_STORES_PER_USER - stores.length);
  }, [stores.length]);

  // ✅ FIX: Écouter les changements de localStorage sans dépendances problématiques
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== selectedStoreId) {
        const newStoreId = e.newValue;
        logger.info('🔄 [StoreContext] Changement détecté depuis autre onglet:', newStoreId);

        // ✅ FIX: Validation simplifiée et sécurisée
        if (newStoreId) {
          // Ne pas changer immédiatement, laisser la logique normale gérer
          // Cela évite les boucles potentielles
          setTimeout(() => {
            if (stores.some(s => s.id === newStoreId)) {
              logger.info('✅ [StoreContext] Boutique validée, application du changement');
              setSelectedStoreIdState(newStoreId);
            } else {
              logger.warn('⚠️ [StoreContext] Boutique invalide depuis autre onglet');
            }
          }, 100);
        } else {
          setSelectedStoreIdState(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // ✅ FIX: Aucune dépendance pour éviter les re-créations répétées

  const value: StoreContextType = {
    stores,
    selectedStoreId,
    selectedStore,
    loading: loading || authLoading,
    error,
    setSelectedStoreId,
    switchStore,
    refreshStores,
    canCreateStore,
    getRemainingStores,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
