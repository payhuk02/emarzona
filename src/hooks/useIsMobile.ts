/**
 * Compat hook: `useIsMobile` historique.
 *
 * P1: On unifie la détection mobile sur le hook ShadCN (`src/hooks/use-mobile.tsx`)
 * utilisé par `Sidebar` et `VirtualizedProductGrid`.
 *
 * ✅ Objectif: éviter 3 implémentations différentes (et des divergences de comportement)
 * tout en gardant les imports existants (`@/hooks/useIsMobile`) compatibles.
 */

export { useIsMobile } from '@/hooks/use-mobile';






