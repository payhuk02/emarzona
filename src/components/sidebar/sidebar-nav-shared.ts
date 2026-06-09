import type { ComponentType } from 'react';

/** Styles partagés navigation sidebar (thème clair) */
export const NAV_LINK_ACTIVE =
  '!text-foreground font-semibold border-l-[3px] border-primary bg-sidebar-accent [&_*]:!text-foreground [&_svg]:!text-foreground [&_span]:!text-foreground';

export const NAV_LINK_INACTIVE =
  'text-muted-foreground hover:bg-sidebar-accent hover:!text-foreground [&_svg]:!text-muted-foreground hover:[&_svg]:!text-foreground [&_span]:!text-muted-foreground hover:[&_span]:!text-foreground';

export type SidebarNavEntry = {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  sectionLabel: string;
};
