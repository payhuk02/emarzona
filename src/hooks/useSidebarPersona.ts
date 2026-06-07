import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SidebarPersona } from '@/config/navigation.types';

const SIDEBAR_PERSONA_KEY = 'sidebarPersona';

export function detectPersonaFromPath(pathname: string, isAdmin: boolean): SidebarPersona {
  if (pathname.startsWith('/admin') && isAdmin) return 'admin';
  if (pathname.startsWith('/account') || pathname.startsWith('/checkout/multi-store')) {
    return 'buyer';
  }
  return 'seller';
}

function readStoredPersona(): SidebarPersona | null {
  try {
    const stored = localStorage.getItem(SIDEBAR_PERSONA_KEY);
    if (stored === 'seller' || stored === 'buyer' || stored === 'admin') return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function useSidebarPersona(isAdmin: boolean) {
  const location = useLocation();
  const [manualPersona, setManualPersona] = useState<SidebarPersona | null>(() =>
    readStoredPersona()
  );

  const persona = manualPersona ?? detectPersonaFromPath(location.pathname, isAdmin);

  useEffect(() => {
    if (manualPersona !== null) return;
    // Auto-detect only when user has not pinned a persona
  }, [location.pathname, isAdmin, manualPersona]);

  const setPersona = useCallback(
    (next: SidebarPersona) => {
      if (next === 'admin' && !isAdmin) return;
      setManualPersona(next);
      try {
        localStorage.setItem(SIDEBAR_PERSONA_KEY, next);
      } catch {
        /* ignore */
      }
    },
    [isAdmin]
  );

  const resetPersona = useCallback(() => {
    setManualPersona(null);
    try {
      localStorage.removeItem(SIDEBAR_PERSONA_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { persona, setPersona, resetPersona, isManualPersona: manualPersona !== null };
}
