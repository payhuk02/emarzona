import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  SIDEBAR_PREF_KEYS,
  getSidebarPrefsUserId,
  hasSidebarJsonPref,
  readSidebarJsonPref,
  setSidebarPrefsUserId,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';
import { useAuth } from '@/contexts/AuthContext';
import { resolveNavPersona } from '@/config/navigation.persona';
import type { SidebarPersona } from '@/config/navigation.types';

export { detectPersonaFromPath, resolveNavPersona } from '@/config/navigation.persona';

function isSidebarPersona(value: unknown): value is SidebarPersona {
  return value === 'seller' || value === 'buyer' || value === 'admin';
}

function migrateLegacyPersona(userId: string | null): SidebarPersona | null {
  try {
    const legacy = localStorage.getItem(SIDEBAR_PREF_KEYS.persona);
    if (!isSidebarPersona(legacy)) return null;
    writeSidebarJsonPref(SIDEBAR_PREF_KEYS.persona, legacy, userId);
    localStorage.removeItem(SIDEBAR_PREF_KEYS.persona);
    return legacy;
  } catch {
    return null;
  }
}

export function readStoredPersona(userId = getSidebarPrefsUserId()): SidebarPersona | null {
  const scopedKey = `${SIDEBAR_PREF_KEYS.persona}:${userId ?? 'guest'}`;
  try {
    const scopedRaw = localStorage.getItem(scopedKey);
    if (scopedRaw !== null) {
      try {
        const parsed = JSON.parse(scopedRaw) as unknown;
        if (isSidebarPersona(parsed)) return parsed;
      } catch {
        if (isSidebarPersona(scopedRaw)) {
          writeSidebarJsonPref(SIDEBAR_PREF_KEYS.persona, scopedRaw, userId);
          return scopedRaw;
        }
      }
    }
  } catch {
    /* ignore */
  }

  const fromPref = readSidebarJsonPref<unknown>(SIDEBAR_PREF_KEYS.persona, userId);
  if (isSidebarPersona(fromPref)) return fromPref;
  return migrateLegacyPersona(userId);
}

export function persistSidebarPersona(
  next: SidebarPersona,
  userId = getSidebarPrefsUserId()
): void {
  writeSidebarJsonPref(SIDEBAR_PREF_KEYS.persona, next, userId);
}

export function useSidebarPersona(isAdmin: boolean) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const location = useLocation();
  const [manualPersona, setManualPersona] = useState<SidebarPersona | null>(() =>
    readStoredPersona(userId)
  );

  useEffect(() => {
    setSidebarPrefsUserId(userId);
    setManualPersona(readStoredPersona(userId));
  }, [userId]);

  const persona = resolveNavPersona(location.pathname, isAdmin, manualPersona);

  const setPersona = useCallback(
    (next: SidebarPersona) => {
      if (next === 'admin' && !isAdmin) return;
      setManualPersona(next);
      persistSidebarPersona(next, userId);
    },
    [isAdmin, userId]
  );

  const resetPersona = useCallback(() => {
    setManualPersona(null);
    try {
      const scopedKey = `${SIDEBAR_PREF_KEYS.persona}:${userId ?? 'guest'}`;
      localStorage.removeItem(scopedKey);
      localStorage.removeItem(SIDEBAR_PREF_KEYS.persona);
    } catch {
      /* ignore */
    }
  }, [userId]);

  return {
    persona,
    setPersona,
    resetPersona,
    pinnedPersona: manualPersona,
    isManualPersona: manualPersona !== null,
    needsPersonaOnboarding: !hasSidebarJsonPref(SIDEBAR_PREF_KEYS.personaOnboarded, userId),
  };
}
