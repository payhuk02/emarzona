import type { ComponentType } from 'react';

/** Styles partagés navigation sidebar (thème clair) */
export const NAV_LINK_ACTIVE =
  '!text-primary font-bold bg-primary/10 rounded-lg shadow-sm [&_*]:!text-primary [&_svg]:!text-primary [&_span]:!text-primary transition-all duration-300';

export const NAV_LINK_INACTIVE =
  'text-muted-foreground hover:bg-sidebar-accent hover:!text-foreground hover:translate-x-1 rounded-lg [&_svg]:!text-muted-foreground hover:[&_svg]:!text-foreground [&_span]:!text-muted-foreground hover:[&_span]:!text-foreground transition-all duration-300';

export type SidebarNavEntry = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  sectionLabel: string;
};
