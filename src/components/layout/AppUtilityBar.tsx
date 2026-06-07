/**
 * Barre utilitaire (langue + déconnexion) — intégrée en haut de la zone contenu,
 * sans chevaucher les headers de page.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { UserUtilityActions } from '@/components/layout/UserUtilityActions';
import { cn } from '@/lib/utils';

function findMainElement(): HTMLElement | null {
  const byId = document.getElementById('main-content');
  if (byId) return byId;

  const byRole = document.querySelector<HTMLElement>('main[role="main"]');
  if (byRole) return byRole;

  const flexMain = document.querySelector<HTMLElement>(
    '.flex.min-h-screen > main, .flex.min-h-screen.w-full > main'
  );
  return flexMain ?? null;
}

const UTILITY_BAR_ATTR = 'data-app-utility-bar';

type AppUtilityBarProps = {
  className?: string;
};

export function AppUtilityBar({ className }: AppUtilityBarProps) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let host: HTMLElement | null = null;
    let cancelled = false;
    let attempts = 0;

    const attach = () => {
      if (cancelled) return;

      const main = findMainElement();
      if (!main) {
        if (attempts++ < 30) requestAnimationFrame(attach);
        return;
      }

      host = main.querySelector<HTMLElement>(`[${UTILITY_BAR_ATTR}]`);
      if (!host) {
        host = document.createElement('div');
        host.setAttribute(UTILITY_BAR_ATTR, '');
        main.insertBefore(host, main.firstChild);
      }

      setSlot(host);
    };

    attach();

    return () => {
      cancelled = true;
      host?.remove();
      setSlot(null);
    };
  }, []);

  if (!slot) return null;

  return createPortal(
    <div
      className={cn(
        'sticky top-0 z-30 flex min-h-11 sm:min-h-12 items-center justify-end gap-1.5 sm:gap-2',
        'border-b border-border/40 bg-background/90 backdrop-blur-xl',
        'px-3 sm:px-4 lg:px-6 shadow-[0_1px_0_0_hsl(var(--border)/0.35)]',
        className
      )}
      role="toolbar"
      aria-label="Actions utilisateur"
    >
      <UserUtilityActions variant="shell" />
    </div>,
    slot
  );
}
