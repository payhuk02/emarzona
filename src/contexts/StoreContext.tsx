import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';

// Import des types depuis useStores pour éviter la duplication
import type { Store as StoreType, StoreOpeningHours, StoreLegalPages, StoreMarketingContent } from '@/hooks/useStores';

export interface Store extends StoreType {
  // Tous les champs sont hérités de StoreType qui inclut maintenant tous les nouveaux champs de la Phase 1
}

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
        const validStoreId = storedStoreId && storesData.some(s => s.id === storedStoreId)
          ? storedStoreId
          : storesData[0].id; // Utiliser la première boutique par défaut

        setSelectedStoreIdState(validStoreId);
        saveStoreIdToStorage(validStoreId);
      } else {
        setSelectedStoreIdState(null);
        saveStoreIdToStorage(null);
      }
    } catch (err: any) {
      logger.error('Error fetching stores', err);
      setError(err.message || 'Erreur lors du chargement des boutiques');
      setStores([]);
      setSelectedStoreIdState(null);
    } finally {
      setLoading(false);
    }
  }, [user, getStoredStoreId, saveStoreIdToStorage]);

  // Charger les boutiques au chargement et quand l'utilisateur change
  useEffect(() => {
    if (!authLoading) {
      fetchStores();
    }
  }, [authLoading, fetchStores]);

  // Calculer la boutique sélectionnée
  const selectedStore = selectedStoreId
    ? stores.find(s => s.id === selectedStoreId) || null
    : null;

  // Fonction pour définir la boutique sélectionnée
  const setSelectedStoreId = useCallback((storeId: string | null) => {
    logger.info('🔄 [StoreContext] Changement de boutique', {
      oldStoreId: selectedStoreId,
      newStoreId: storeId,
    });

    // Vérifier que la boutique existe
    if (storeId && !stores.some(s => s.id === storeId)) {
      logger.warn('Tentative de sélectionner une boutique inexistante', { storeId });
      return;
    }

    setSelectedStoreIdState(storeId);
    saveStoreIdToStorage(storeId);

    // Synchroniser avec les autres onglets (optionnel)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEY,
        newValue: storeId,
      }));
    }
  }, [selectedStoreId, stores, saveStoreIdToStorage]);

  // Fonction pour changer de boutique
  const switchStore = useCallback((storeId: string) => {
    setSelectedStoreId(storeId);
  }, [setSelectedStoreId]);

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

  // Écouter les changements de localStorage depuis d'autres onglets
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue !== selectedStoreId) {
        const newStoreId = e.newValue;
        if (newStoreId && stores.some(s => s.id === newStoreId)) {
          setSelectedStoreIdState(newStoreId);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [selectedStoreId, stores]);

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

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
};

