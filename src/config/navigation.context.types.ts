import type { ComponentType } from 'react';
import type { NavItem, SidebarPersona } from '@/config/navigation.types';

export type ContextSidebarGroupConfig = {
  groupKey: string;
  defaultLabel: string;
  paths: string[];
};

export type StaticContextNavItem = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  tab?: string;
};

export type ContextSidebarConfig = {
  id: string;
  sectionKey: string;
  additionalSectionKeys?: string[];
  rootPath: string;
  ariaLabel: string;
  breadcrumbSectionKey?: string;
  includePaths?: string[];
  excludePaths?: string[];
  groups?: ContextSidebarGroupConfig[];
  collapsibleGroups?: boolean;
  persona?: SidebarPersona;
  enablePlanLock?: boolean;
  activeMatch?: 'path' | 'tab';
  staticItems?: StaticContextNavItem[];
  /** Merged with menu items (e.g. settings tab links) */
  supplementStaticItems?: StaticContextNavItem[];
};

export type ContextSidebarNavGroup = {
  groupKey: string;
  label: string;
  items: NavItem[];
};

export type ContextSidebarNavResult = {
  sectionLabel: string;
  rootPath: string;
  items: NavItem[];
  groups: ContextSidebarNavGroup[] | null;
};
