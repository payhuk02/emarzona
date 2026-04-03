/**
 * Hook pour gérer le clavier mobile virtuel
 * 
 * Détecte l'ouverture/fermeture du clavier virtuel et ajuste le positionnement
 * des éléments (Select, Dropdown, etc.) pour éviter qu'ils soient masqués.
 * 
 * @example
 * ```tsx
 * const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard();
 * 
 * // Ajuster le positionnement
 * <SelectContent
 *   style={{
 *     marginBottom: isKeyboardOpen ? `${keyboardHeight}px` : 0,
 *   }}
 * />
 * ```
 */

import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface UseMobileKeyboardReturn {
  /**
   * Indique si le clavier virtuel est ouvert
   */
  isKeyboardOpen: boolean;
  /**
   * Hauteur du clavier virtuel (en pixels)
   */
  keyboardHeight: number;
  /**
   * Indique si l'API Visual Viewport est disponible
   */
  isVisualViewportSupported: boolean;
}

/**
 * Hook pour détecter et gérer le clavier mobile virtuel
 */
export function useMobileKeyboard(): UseMobileKeyboardReturn {
  const isMobile = useIsMobile();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isVisualViewportSupported, setIsVisualViewportSupported] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      return;
    }

    // Vérifier si l'API Visual Viewport est disponible
    const hasVisualViewport = typeof window !== 'undefined' && 'visualViewport' in window;
    setIsVisualViewportSupported(hasVisualViewport);

    if (!hasVisualViewport) {
      // Fallback: Utiliser la différence entre window.innerHeight et window.outerHeight
      const handleResize = () => {
        const heightDiff = window.outerHeight - window.innerHeight;
        const threshold = 150; // Seuil pour considérer que le clavier est ouvert
        
        if (heightDiff > threshold) {
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDiff);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Vérifier immédiatement

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }

    // Utiliser l'API Visual Viewport (plus précise)
    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      return;
    }

    const handleViewportChange = () => {
      if (!visualViewport) return;

      const viewportHeight = visualViewport.height;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      const threshold = 150; // Seuil pour considérer que le clavier est ouvert

      if (heightDiff > threshold) {
        setIsKeyboardOpen(true);
        setKeyboardHeight(heightDiff);
      } else {
        setIsKeyboardOpen(false);
        setKeyboardHeight(0);
      }
    };

    visualViewport.addEventListener('resize', handleViewportChange);
    visualViewport.addEventListener('scroll', handleViewportChange);

    // Vérifier immédiatement
    handleViewportChange();

    return () => {
      visualViewport.removeEventListener('resize', handleViewportChange);
      visualViewport.removeEventListener('scroll', handleViewportChange);
    };
  }, [isMobile]);

  return {
    isKeyboardOpen,
    keyboardHeight,
    isVisualViewportSupported,
  };
}







