import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { logger } from '@/lib/logger';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import {
  fallbackStoreQuota,
  fetchUserStoreQuota,
  type UserStoreQuota,
} from '@/lib/billing/user-store-quota';

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
  storeQuota: UserStoreQuota | null;
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
  storeQuota: null,
});

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
  const [selectedStoreId, setSelectedStoreIdState] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(stored) ? stored : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to avoid stale closures in setTimeout and storage event handlers
  const storesRef = useRef<Store[]>(stores);
  const selectedStoreIdRef = useRef<string | null>(selectedStoreId);
  const loadingRef = useRef(loading);
  const pendingSelectionRef = useRef<string | null>(null);
  useEffect(() => {
    storesRef.current = stores;
  }, [stores]);
  useEffect(() => {
    selectedStoreIdRef.current = selectedStoreId;
  }, [selectedStoreId]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Récupérer la boutique sélectionnée depuis localStorage (avec validation)
  const getStoredStoreId = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      // Valider que c'est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(stored)) {
        logger.warn('Invalid UUID in localStorage, cleaning up:', stored);
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return stored;
    } catch (e) {
      logger.warn('Failed to read selectedStoreId from localStorage, cleaning up', e);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (cleanupError) {
        logger.error('Failed to cleanup corrupted localStorage', cleanupError);
      }
      return null;
    }
  }, []);

  // Sauvegarder la boutique sélectionnée dans localStorage (avec validation)
  const saveStoreIdToStorage = useCallback((storeId: string | null) => {
    if (typeof window === 'undefined') return;
    try {
      if (storeId) {
        // Valider que c'est un UUID valide avant de sauvegarder
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(storeId)) {
          logger.error('Attempted to save invalid UUID to localStorage:', storeId);
          return;
        }
        localStorage.setItem(STORAGE_KEY, storeId);
        logger.debug('✅ Store ID saved to localStorage:', storeId);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        logger.debug('🗑️ Store ID removed from localStorage');
      }
    } catch (e) {
      logger.warn('Failed to save selectedStoreId to localStorage:', e);
      // Essayer de nettoyer en cas d'erreur
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (cleanupError) {
        logger.error('Failed to cleanup localStorage after save error:', cleanupError);
      }
    }
  }, []);

  // Charger toutes les boutiques de l'utilisateur
  const fetchStores = useCallback(async () => {
    if (!user?.id) {
      setStores([]);
      setSelectedStoreIdState(null);
      setLoading(false);
      return;
    }

    try {
      const isInitialLoad = storesRef.current.length === 0;
      if (isInitialLoad) {
        setLoading(true);
      }
      setError(null);

      const fetchWithTimeout = async <T,>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
      };

      // 1. Récupérer les IDs des boutiques où l'utilisateur est membre actif
      const memberStoresQuery = supabase
        .from('store_members')
        .select('store_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const { data: memberStores } = await fetchWithTimeout(memberStoresQuery, 8000).catch(() => ({
        data: [],
      }));

      const memberStoreIds = memberStores?.map(m => m.store_id) || [];

      // 2. Construire la requête avec le filtre explicite pour ne pas afficher
      // toutes les boutiques de la plateforme si l'utilisateur est admin
      let query = supabase
        .from('stores')
        .select('id,user_id,name,slug,created_at,updated_at,metadata,commerce_type');

      if (memberStoreIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},id.in.(${memberStoreIds.join(',')})`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await fetchWithTimeout(
        query.order('created_at', { ascending: true }),
        8000
      );

      if (fetchError) {
        throw fetchError;
      }

      const storesData = (data || []).map(row => ({
        ...row,
        commerce_type: resolveStoreCommerceTypeFromStore(
          row as { commerce_type?: unknown; metadata?: Record<string, unknown> | null }
        ),
      })) as Store[];
      setStores(storesData);

      if (storesData.length > 0) {
        const pendingId = pendingSelectionRef.current;
        pendingSelectionRef.current = null;

        const storedStoreId = getStoredStoreId();
        const currentId = selectedStoreIdRef.current;
        const candidateIds = [currentId, pendingId, storedStoreId, storesData[0].id].filter(
          Boolean
        ) as string[];
        const validStoreId =
          candidateIds.find(id => storesData.some(s => s.id === id)) ?? storesData[0].id;

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
      // Conserver la sélection courante sur erreur transitoire (évite flash onboarding)
      if (storesRef.current.length === 0) {
        setStores([]);
        setSelectedStoreIdState(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id, getStoredStoreId, saveStoreIdToStorage]);

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
  }, [authLoading, user?.id, fetchStores]); // Added missing deps

  // Calculer la boutique sélectionnée
  const selectedStore = selectedStoreId ? stores.find(s => s.id === selectedStoreId) || null : null;

  // ✅ FIX: Fonction pour définir la boutique sélectionnée avec moins de dépendances
  const setSelectedStoreId = useCallback(
    (storeId: string | null) => {
      if (storeId !== null || selectedStoreId !== null) {
        logger.debug('[StoreContext] Store selection change', {
          oldStoreId: selectedStoreId,
          newStoreId: storeId,
          storesCount: storesRef.current.length,
          loading: loadingRef.current,
        });
      }

      if (storeId === null) {
        pendingSelectionRef.current = null;
        setSelectedStoreIdState(null);
        saveStoreIdToStorage(null);
        return;
      }

      // Defer until fetchStores completes (e.g. React Query cache in useStore)
      if (loadingRef.current && storesRef.current.length === 0) {
        pendingSelectionRef.current = storeId;
        return;
      }

      if (!storesRef.current.some(s => s.id === storeId)) {
        logger.debug('[StoreContext] Ignored unknown store id', { storeId });
        return;
      }

      setSelectedStoreIdState(storeId);
      saveStoreIdToStorage(storeId);
    },
    [selectedStoreId, saveStoreIdToStorage]
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

  // Limite de création : boutiques possédées uniquement (pas les membres invités)
  const ownedStoreCount = stores.filter(store => store.user_id === user?.id).length;
  const [storeQuota, setStoreQuota] = useState<UserStoreQuota | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setStoreQuota(null);
      return;
    }

    let cancelled = false;
    void fetchUserStoreQuota(user.id)
      .then(quota => {
        if (!cancelled) setStoreQuota(quota);
      })
      .catch(() => {
        if (!cancelled) setStoreQuota(fallbackStoreQuota(ownedStoreCount));
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, ownedStoreCount]);

  const effectiveQuota = storeQuota ?? fallbackStoreQuota(ownedStoreCount);

  const canCreateStore = useCallback(() => {
    if (!user?.id) {
      return false;
    }
    return effectiveQuota.can_create;
  }, [effectiveQuota.can_create, user?.id]);

  const getRemainingStores = useCallback(() => {
    if (effectiveQuota.remaining_stores == null) {
      return Number.POSITIVE_INFINITY;
    }
    return effectiveQuota.remaining_stores;
  }, [effectiveQuota.remaining_stores]);

  // ✅ FIX: Écouter les changements de localStorage sans dépendances problématiques
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;

      const newStoreId = e.newValue;
      const currentStoreId = selectedStoreIdRef.current;

      // Ignore spurious cross-tab events (same value or repeated null clears)
      if (newStoreId === currentStoreId) return;

      logger.debug('[StoreContext] Cross-tab store selection change:', newStoreId);

      if (newStoreId) {
        if (storesRef.current.some(s => s.id === newStoreId)) {
          setSelectedStoreIdState(newStoreId);
        } else {
          logger.warn('[StoreContext] Ignored invalid store id from other tab');
        }
        return;
      }

      if (currentStoreId !== null) {
        setSelectedStoreIdState(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Stable listener – uses storesRef to avoid stale closure

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
    storeQuota: effectiveQuota,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};
