/**
 * SkipLink Component - Accessibilité
 * Date: 31 Janvier 2025
 * 
 * Composant pour le lien "Skip to main content" pour la navigation clavier
 * Conforme WCAG 2.1 Level AA
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

export const SkipLink = ({ 
  href = '#main-content', 
  label = 'Aller au contenu principal',
  className 
}: SkipLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Focus automatique sur le skip link au chargement si navigation clavier détectée
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && linkRef.current) {
        // Premier Tab - focus sur le skip link
        linkRef.current.focus();
      }
    };

    // Écouter uniquement le premier Tab
    document.addEventListener('keydown', handleKeyDown, { once: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target instanceof HTMLElement) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Annoncer pour les lecteurs d'écran
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = 'Vous êtes maintenant dans le contenu principal';
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 3000);
    }
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onClick={handleClick}
      className={cn(
        // Screen reader only par défaut
        'sr-only',
        // Visible au focus
        'focus:not-sr-only',
        'focus:absolute',
        'focus:top-4',
        'focus:left-4',
        'focus:z-[9999]',
        'focus:px-6',
        'focus:py-3',
        'focus:bg-primary',
        'focus:text-primary-foreground',
        'focus:rounded-lg',
        'focus:shadow-lg',
        'focus:ring-2',
        'focus:ring-ring',
        'focus:ring-offset-2',
        'focus:ring-offset-background',
        'focus:outline-none',
        'focus:font-semibold',
        'focus:transition-all',
        'focus:duration-200',
        // Styles supplémentaires
        className
      )}
      aria-label={label}
    >
      {label}
    </a>
  );
};

