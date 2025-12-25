/**
 * Lazy loader pour Recharts
 * Charge Recharts de manière asynchrone pour réduire le bundle initial
 */

let rechartsModule: typeof import('recharts') | null = null;

/**
 * Charge Recharts de manière asynchrone
 */
export const loadRecharts = async () => {
  if (!rechartsModule) {
    rechartsModule = await import('recharts');
  }
  return rechartsModule;
};

/**
 * Charge un composant spécifique de Recharts
 */
export const loadRechartsComponent = async <T extends keyof typeof import('recharts')>(
  componentName: T
): Promise<typeof import('recharts')[T]> => {
  const recharts = await loadRecharts();
  return recharts[componentName];
};

