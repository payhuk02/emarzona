import type { ComponentType } from 'react';

export type SidebarPersona = 'seller' | 'buyer' | 'admin';

/** primary = visible in compact sidebar; extended = command palette + context sidebars only */
export type NavTier = 'primary' | 'extended';

export type NavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  personas: SidebarPersona[];
  tier: NavTier;
  /** Wizard / create shortcuts grouped under section « Créer » */
  createGroup?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
  /** Section ouverte par défaut au premier chargement */
  defaultOpen?: boolean;
};

export type FlatNavEntry = NavItem & { sectionLabel: string };
