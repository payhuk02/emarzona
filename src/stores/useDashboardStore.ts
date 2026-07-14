import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DashboardState {
  // Navigation & Layout State
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Dashboard Context
  activeDashboardId: string | null;
  setActiveDashboardId: (id: string | null) => void;

  // Global Time Filter (used across widgets)
  globalPeriodFilter: '7d' | '30d' | '90d' | '12m' | 'all';
  setGlobalPeriodFilter: (period: '7d' | '30d' | '90d' | '12m' | 'all') => void;

  // Preferences
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    set => ({
      isSidebarCollapsed: false,
      setSidebarCollapsed: collapsed => set({ isSidebarCollapsed: collapsed }),
      toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

      activeDashboardId: null,
      setActiveDashboardId: id => set({ activeDashboardId: id }),

      globalPeriodFilter: '30d',
      setGlobalPeriodFilter: period => set({ globalPeriodFilter: period }),

      compactMode: false,
      setCompactMode: compact => set({ compactMode: compact }),
    }),
    {
      name: 'dashboard-preferences',
      partialize: state => ({
        isSidebarCollapsed: state.isSidebarCollapsed,
        globalPeriodFilter: state.globalPeriodFilter,
        compactMode: state.compactMode,
      }),
    }
  )
);
