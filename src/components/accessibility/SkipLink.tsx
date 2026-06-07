/**
 * Skip link — navigation clavier vers #main-content (WCAG 2.4.1)
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  label?: string;
  className?: string;
}

function findMainContent(preferredId: string): HTMLElement | null {
  const byId = document.getElementById(preferredId.replace(/^#/, ''));
  if (byId) return byId;

  return (
    document.querySelector<HTMLElement>('main[role="main"]') ??
    document.querySelector<HTMLElement>('#main-content') ??
    document.querySelector<HTMLElement>('main')
  );
}

export const SkipLink = ({
  href = '#main-content',
  label = 'Aller au contenu principal',
  className,
}: SkipLinkProps) => {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const location = useLocation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && linkRef.current) {
        linkRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, { once: true });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = findMainContent(href);
    if (!target) return;

    target.setAttribute('tabindex', '-1');
    target.focus();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = 'Vous êtes maintenant dans le contenu principal';
    document.body.appendChild(announcement);

    window.setTimeout(() => {
      target.removeAttribute('tabindex');
      announcement.remove();
    }, 1000);
  };

  return (
    <a
      ref={linkRef}
      href={href}
      onClick={handleClick}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg focus:font-semibold focus:text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'transition-all duration-200',
        className
      )}
      aria-label={label}
    >
      {label}
    </a>
  );
};

/** @deprecated Utiliser SkipLink — alias conservé pour compatibilité interne */
export const SkipToMainContent = SkipLink;
