/**
 * Indique que le chrome boutique (thème / header / footer) est fourni par StorefrontAppLayout.
 * Les pages enfants évitent de remonter StoreThemeProvider + header/footer.
 */

import { createContext, useContext } from 'react';
import type { Store } from '@/hooks/useStores';

export type StorefrontShellContextValue = {
  chromeProvided: true;
  store: Store | null;
  storeLoading: boolean;
};

const StorefrontShellContext = createContext<StorefrontShellContextValue | null>(null);

export function StorefrontShellProvider({
  value,
  children,
}: {
  value: StorefrontShellContextValue;
  children: React.ReactNode;
}) {
  return (
    <StorefrontShellContext.Provider value={value}>{children}</StorefrontShellContext.Provider>
  );
}

/** null hors layout boutique (ex. prévisualisation dashboard). */
export function useStorefrontShell(): StorefrontShellContextValue | null {
  return useContext(StorefrontShellContext);
}
