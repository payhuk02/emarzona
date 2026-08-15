import { useMarketplaceFavoritesContext } from '@/contexts/MarketplaceFavoritesContext';
import {
  useMarketplaceFavoritesState,
  type MarketplaceFavoritesState,
} from '@/hooks/marketplace/useMarketplaceFavoritesState';

export type { MarketplaceFavoritesState };
export { useMarketplaceFavoritesState };

/**
 * Hook page-level pour les favoris marketplace (hors cartes).
 * Dans les cartes, utiliser `useMarketplaceFavoritesContext` pour éviter N+1.
 */
export function useMarketplaceFavorites(): MarketplaceFavoritesState {
  const shared = useMarketplaceFavoritesContext();
  const local = useMarketplaceFavoritesState();
  return shared ?? local;
}
