import { createContext, useContext, type ReactNode } from 'react';
import {
  useMarketplaceFavoritesState,
  type MarketplaceFavoritesState,
} from '@/hooks/marketplace/useMarketplaceFavoritesState';

const MarketplaceFavoritesContext = createContext<MarketplaceFavoritesState | null>(null);

export function MarketplaceFavoritesProvider({ children }: { children: ReactNode }) {
  const value = useMarketplaceFavoritesState();
  return (
    <MarketplaceFavoritesContext.Provider value={value}>
      {children}
    </MarketplaceFavoritesContext.Provider>
  );
}

export function useMarketplaceFavoritesContext(): MarketplaceFavoritesState | null {
  return useContext(MarketplaceFavoritesContext);
}
