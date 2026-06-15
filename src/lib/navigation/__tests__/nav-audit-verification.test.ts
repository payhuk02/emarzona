import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sidebarDe from '@/i18n/locales/sidebar-de.json';
import sidebarEn from '@/i18n/locales/sidebar-en.json';
import sidebarEs from '@/i18n/locales/sidebar-es.json';
import sidebarFr from '@/i18n/locales/sidebar-fr.json';
import sidebarPt from '@/i18n/locales/sidebar-pt.json';
import { StableDropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { StableDropdownMenu as StableReexport } from '@/components/ui/stable-dropdown-menu';
import {
  formatSearchShortcutKey,
  formatSidebarToggleShortcutKey,
  isSafeInternalNavUrl,
} from '@/lib/navigation/keyboard-shortcuts';
import {
  hasSidebarJsonPref,
  readSidebarJsonPref,
  setSidebarPrefsUserId,
  SIDEBAR_PREF_KEYS,
  writeSidebarJsonPref,
} from '@/lib/navigation/sidebar-prefs-storage';

const root = resolve(process.cwd());

const readSrc = (relativePath: string) => readFileSync(resolve(root, 'src', relativePath), 'utf8');

const locales = [sidebarFr, sidebarEn, sidebarDe, sidebarEs, sidebarPt] as const;

const requiredChromeKeys = [
  'commandPaletteSearchPlaceholder',
  'commandPaletteEmpty',
  'utilityBarAriaLabel',
  'shortcutToggleSidebar',
  'shortcutCommandPalette',
] as const;

const requiredNotificationKeys = [
  'title',
  'markAllRead',
  'settingsAriaLabel',
  'empty',
  'viewAll',
] as const;

describe('NAV audit verification (NAV-001 → NAV-010)', () => {
  describe('NAV-001 bottom nav mobile', () => {
    it('shows bottom nav on mobile without context-sidebar guard', () => {
      const app = readSrc('App.tsx');
      expect(app).toContain('shouldShowBottomNavigation');
      expect(app).toContain("import { cn } from '@/lib/utils'");
      expect(app).not.toContain('hasContextSidebarForPath');
      expect(app).toContain('<BottomNavigation position="bottom" />');
    });
  });

  describe('NAV-002 active state', () => {
    it('uses PREFIX_EXACT_ONLY_PATHS for hub routes', () => {
      const helpers = readSrc('config/navigation.helpers.ts');
      expect(helpers).toContain("PREFIX_EXACT_ONLY_PATHS = new Set(['/dashboard', '/account'])");
      expect(helpers).toContain("mode: NavActiveMatchMode = 'exact'");
    });

    it('prefix surfaces use prefix mode in code', () => {
      expect(readSrc('components/mobile/BottomNavigation.tsx')).toContain("'prefix'");
      expect(readSrc('components/layout/HorizontalContextNav.tsx')).toContain("'prefix'");
    });
  });

  describe('NAV-003 deprecated context sidebar', () => {
    it('removes legacy context sidebar components', () => {
      const removed = [
        'components/layout/SectionContextSidebar.tsx',
        'components/layout/BaseContextSidebar.tsx',
        'components/layout/ContextSidebarNavItem.tsx',
        'hooks/useContextSidebarNavigation.ts',
      ];
      for (const file of removed) {
        expect(existsSync(resolve(root, 'src', file))).toBe(false);
      }
    });

    it('does not export removed layout components', () => {
      const index = readSrc('components/layout/index.ts');
      expect(index).not.toContain('SectionContextSidebar');
      expect(index).not.toContain('BaseContextSidebar');
    });
  });

  describe('NAV-004 plan-lock unified', () => {
    it('centralizes plan lock in plan-lock-nav module', () => {
      expect(existsSync(resolve(root, 'src/lib/navigation/plan-lock-nav.ts'))).toBe(true);
      expect(readSrc('hooks/usePlanLockNavAction.ts')).toContain('notifyPlanLockedNav');
      expect(readSrc('lib/navigation/resolveNavItems.ts')).toContain('locked:');
    });

    it('surfaces use shared plan-lock hook', () => {
      for (const file of [
        'components/AppSidebar.tsx',
        'components/mobile/BottomNavigation.tsx',
        'components/layout/HorizontalContextNav.tsx',
      ]) {
        expect(readSrc(file)).toContain('usePlanLockNavAction');
      }
    });
  });

  describe('NAV-005 dropdown merge', () => {
    it('re-exports stable API from canonical dropdown-menu', () => {
      expect(StableDropdownMenu).toBe(StableReexport);
      expect(DropdownMenuItem).toBeDefined();
    });

    it('stable-dropdown-menu is a thin re-export', () => {
      const stable = readSrc('components/ui/stable-dropdown-menu.tsx');
      expect(stable).toContain("export * from './dropdown-menu'");
      expect(readSrc('components/ui/dropdown-menu.tsx')).toContain('StableDropdownMenu');
    });
  });

  describe('NAV-006 i18n palette + notifications', () => {
    it('defines required keys in all sidebar locales', () => {
      for (const locale of locales) {
        for (const key of requiredChromeKeys) {
          expect(locale.sidebar.chrome).toHaveProperty(key);
        }
        for (const key of requiredNotificationKeys) {
          expect(locale.sidebar.notifications).toHaveProperty(key);
        }
      }
    });

    it('uses i18n in palette and notification dropdown', () => {
      expect(readSrc('components/sidebar/SidebarNavCommandPalette.tsx')).toContain(
        'useTranslation'
      );
      expect(readSrc('components/notifications/NotificationDropdown.tsx')).toContain(
        'sidebar.notifications.title'
      );
    });
  });

  describe('NAV-007 namespaced sidebar prefs', () => {
    beforeEach(() => {
      localStorage.clear();
      setSidebarPrefsUserId('audit-user');
    });

    it('isolates prefs per user and migrates legacy keys', () => {
      localStorage.setItem(SIDEBAR_PREF_KEYS.pinnedUrls, JSON.stringify(['/legacy']));
      expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'audit-user')).toEqual([
        '/legacy',
      ]);

      writeSidebarJsonPref(SIDEBAR_PREF_KEYS.pinnedUrls, ['/scoped'], 'audit-user');
      setSidebarPrefsUserId('other-user');
      expect(readSidebarJsonPref<string[]>(SIDEBAR_PREF_KEYS.pinnedUrls, 'other-user')).toBeNull();
      expect(hasSidebarJsonPref(SIDEBAR_PREF_KEYS.pinnedUrls, 'audit-user')).toBe(true);
    });

    it('AppSidebar wires user-scoped storage', () => {
      const sidebar = readSrc('components/AppSidebar.tsx');
      expect(sidebar).toContain('useAuth');
      expect(sidebar).toContain('setSidebarPrefsUserId');
      expect(sidebar).toContain('readSidebarJsonPref');
      expect(sidebar).toContain('writeSidebarJsonPref');
    });
  });

  describe('NAV-008 dead code removed', () => {
    it('removes use-mobile-menu hook', () => {
      expect(existsSync(resolve(root, 'src/hooks/use-mobile-menu.tsx'))).toBe(false);
    });
  });

  describe('NAV-009 sidebar CSS', () => {
    it('avoids universal color override on sidebar descendants', () => {
      const css = readSrc('styles/sidebar-optimized.css');
      expect(css).not.toMatch(/\[data-sidebar='sidebar'\] \*,/);
      expect(css).toContain("[data-sidebar='menu-button']");
    });

    it('uses light sidebar theme in ui/sidebar', () => {
      const sidebar = readSrc('components/ui/sidebar.tsx');
      expect(sidebar).toContain('data-sidebar-theme="light"');
      expect(sidebar).toContain('text-sidebar-foreground');
      expect(sidebar).not.toContain('data-sidebar-theme="dark"');
    });
  });

  describe('NAV-010 keyboard shortcuts documented', () => {
    it('formats platform-aware shortcut labels', () => {
      expect(formatSearchShortcutKey()).toMatch(/^(⌘K|Ctrl\+K)$/);
      expect(formatSidebarToggleShortcutKey()).toMatch(/^(⌘B|Ctrl\+B)$/);
    });

    it('documents shortcuts in utility bar and sidebar trigger', () => {
      expect(readSrc('components/layout/UtilityBarHeader.tsx')).toContain(
        'formatSearchShortcutKey'
      );
      expect(readSrc('components/layout/UtilityBarHeader.tsx')).toContain(
        'formatSidebarToggleShortcutKey'
      );
      expect(readSrc('components/ui/sidebar.tsx')).toContain(
        'sidebar.chrome.shortcutToggleSidebar'
      );
    });

    it('validates internal notification action URLs', () => {
      expect(isSafeInternalNavUrl('/dashboard/orders')).toBe(true);
      expect(isSafeInternalNavUrl('//evil.com')).toBe(false);
      expect(isSafeInternalNavUrl('https://evil.com')).toBe(false);
      expect(isSafeInternalNavUrl('/javascript:alert(1)')).toBe(false);
    });
  });

  describe('buyer horizontal nav', () => {
    it('exposes buyer horizontal nav on account routes', () => {
      const horizontal = readSrc('config/navigation.horizontal.ts');
      expect(horizontal).toContain('BUYER_HORIZONTAL_NAV_SECTIONS');
      expect(horizontal).toContain('shouldShowBuyerHorizontalNav');
      expect(readSrc('components/layout/AppPageShell.tsx')).toContain('shouldShowHorizontalNav');
    });

    it('includes discovery domain and mega subgroups for buyer', () => {
      const horizontal = readSrc('config/navigation.horizontal.ts');
      expect(horizontal).toContain("domainKey: 'decouvrir'");
      expect(horizontal).toContain('BUYER_HORIZONTAL_MEGA_SUBGROUPS');
    });
  });
});
