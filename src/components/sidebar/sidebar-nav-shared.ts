import type { LucideIcon } from 'lucide-react';

/** Styles partagés navigation sidebar */
export const NAV_LINK_ACTIVE =
  '!text-white font-semibold border-l-[3px] border-[#d4af37] bg-white/[0.08] [&_*]:!text-white [&_svg]:!text-white [&_span]:!text-white';

export const NAV_LINK_INACTIVE =
  '!text-white hover:bg-white/[0.08] hover:!text-white [&_svg]:!text-white [&_span]:!text-white opacity-90';

export type SidebarNavEntry = {
  title: string;
  url: string;
  icon: LucideIcon;
  sectionLabel: string;
};
