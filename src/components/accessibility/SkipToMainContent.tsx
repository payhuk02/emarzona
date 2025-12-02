/**
 * Skip to Main Content Link
 * Permet aux utilisateurs de navigation clavier de sauter directement au contenu principal
 * Conforme WCAG 2.1 AA - Critère 2.4.1 (Bypass Blocks)
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const SkipToMainContent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Réinitialiser la visibilité lors du changement de route
    setIsVisible(false);
  }, [location.pathname]);

  const handleFocus = () => {
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.querySelector('#main-content');
    
    if (mainContent) {
      // Ajouter tabindex pour permettre le focus
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
      
      // Scroll en douceur vers le contenu principal
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Retirer le focus après un court délai pour éviter le focus visible permanent
      setTimeout(() => {
        mainContent.removeAttribute('tabindex');
      }, 1000);
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2
        focus:bg-primary focus:text-primary-foreground
        focus:rounded-md focus:shadow-lg
        focus:font-semibold focus:text-sm
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        transition-all duration-200
        ${isVisible ? 'block' : ''}
      `}
      aria-label="Aller au contenu principal"
    >
      Aller au contenu principal
    </a>
  );
};

