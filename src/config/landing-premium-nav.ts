/**
 * Information architecture of the public landing navbar (PremiumNav).
 * Copy lives in i18n (`landingPremium.nav.mega.*`). Do not put vendor PSP names here.
 */
import type { LucideIcon } from 'lucide-react';
import {
  BadgePercent,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CircleHelp,
  FileText,
  GraduationCap,
  Layers,
  LifeBuoy,
  Link2,
  Mail,
  MessageCircle,
  Monitor,
  Package,
  Palette,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Truck,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';

export type LandingPremiumHrefKind = 'route' | 'hash';
export type LandingPremiumMegaId = 'solutions' | 'features' | 'resources';
export type LandingPremiumTopNavKey =
  | 'marketplace'
  | 'solutions'
  | 'features'
  | 'pricing'
  | 'resources';

export type LandingPremiumTopNavItem = {
  key: LandingPremiumTopNavKey;
  href: string;
  kind: LandingPremiumHrefKind;
  mega?: LandingPremiumMegaId;
};

export type LandingPremiumMegaLink = {
  key: string;
  href: string;
  kind: LandingPremiumHrefKind;
  icon: LucideIcon;
};

export type LandingPremiumMegaColumn = {
  key: string;
  items: LandingPremiumMegaLink[];
};

export type LandingPremiumMegaMenu = {
  id: LandingPremiumMegaId;
  triggerHref: string;
  triggerKind: LandingPremiumHrefKind;
  columns: LandingPremiumMegaColumn[];
  featured?: LandingPremiumMegaLink;
  footer?: LandingPremiumMegaLink;
};

export const LANDING_PREMIUM_TOP_NAV: readonly LandingPremiumTopNavItem[] = [
  { key: 'marketplace', href: '/marketplace', kind: 'route' },
  { key: 'solutions', href: '/#solutions', kind: 'hash', mega: 'solutions' },
  { key: 'features', href: '/#fonctionnalites', kind: 'hash', mega: 'features' },
  { key: 'pricing', href: '/#tarifs', kind: 'hash' },
  { key: 'resources', href: '/blog', kind: 'route', mega: 'resources' },
] as const;

const solutionsMenu: LandingPremiumMegaMenu = {
  id: 'solutions',
  triggerHref: '/#solutions',
  triggerKind: 'hash',
  columns: [
    {
      key: 'sellWays',
      items: [
        {
          key: 'physical',
          href: '/solutions/physical',
          kind: 'route',
          icon: Package,
        },
        {
          key: 'digital',
          href: '/solutions/digital',
          kind: 'route',
          icon: Monitor,
        },
        {
          key: 'service',
          href: '/solutions/services',
          kind: 'route',
          icon: Briefcase,
        },
        {
          key: 'courses',
          href: '/solutions/courses',
          kind: 'route',
          icon: GraduationCap,
        },
        {
          key: 'artist',
          href: '/solutions/artist',
          kind: 'route',
          icon: Palette,
        },
      ],
    },
  ],
  featured: {
    key: 'protect',
    href: '/solutions/protect',
    kind: 'route',
    icon: ShieldCheck,
  },
};

const featuresMenu: LandingPremiumMegaMenu = {
  id: 'features',
  triggerHref: '/#fonctionnalites',
  triggerKind: 'hash',
  columns: [
    {
      key: 'sell',
      items: [
        { key: 'storefront', href: '/features/storefront', kind: 'route', icon: Store },
        { key: 'onlinePay', href: '/features/checkout', kind: 'route', icon: Wallet },
        { key: 'whatsapp', href: '/features/whatsapp', kind: 'route', icon: MessageCircle },
        { key: 'cod', href: '/features/checkout', kind: 'route', icon: Truck },
        { key: 'guarantee', href: '/features/checkout', kind: 'route', icon: BadgePercent },
      ],
    },
    {
      key: 'grow',
      items: [
        { key: 'referral', href: '/features/referral', kind: 'route', icon: Users },
        { key: 'affiliate', href: '/features/affiliate', kind: 'route', icon: Link2 },
        { key: 'marketplace', href: '/marketplace', kind: 'route', icon: ShoppingBag },
        { key: 'email', href: '/features/email', kind: 'route', icon: Mail },
      ],
    },
    {
      key: 'operate',
      items: [
        { key: 'analytics', href: '/features/analytics', kind: 'route', icon: BarChart3 },
        { key: 'multiStore', href: '/features/multi-store', kind: 'route', icon: Layers },
        { key: 'mobileMoney', href: '/features/checkout', kind: 'route', icon: Smartphone },
      ],
    },
  ],
  footer: {
    key: 'allFeatures',
    href: '/#fonctionnalites',
    kind: 'hash',
    icon: Store,
  },
};

const resourcesMenu: LandingPremiumMegaMenu = {
  id: 'resources',
  triggerHref: '/blog',
  triggerKind: 'route',
  columns: [
    {
      key: 'learn',
      items: [
        { key: 'blog', href: '/blog', kind: 'route', icon: BookOpen },
        { key: 'faq', href: '/faq', kind: 'route', icon: CircleHelp },
        { key: 'help', href: '/help', kind: 'route', icon: LifeBuoy },
        { key: 'docs', href: '/docs', kind: 'route', icon: FileText },
        { key: 'community', href: '/community', kind: 'route', icon: UsersRound },
      ],
    },
    {
      key: 'company',
      items: [
        { key: 'about', href: '/about', kind: 'route', icon: Building2 },
        { key: 'contact', href: '/contact', kind: 'route', icon: Phone },
      ],
    },
  ],
};

export const LANDING_PREMIUM_MEGA_MENUS: Record<LandingPremiumMegaId, LandingPremiumMegaMenu> = {
  solutions: solutionsMenu,
  features: featuresMenu,
  resources: resourcesMenu,
};

export const LANDING_PREMIUM_NAV_FORBIDDEN_COPY = [
  /moneyfusion/i,
  /geniuspay/i,
  /stripe/i,
  /paypal/i,
  /24\s*\/\s*7/,
  /24-7/,
] as const;

export function isLandingPremiumInternalHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

function collectMenuHrefs(menu: LandingPremiumMegaMenu): string[] {
  const hrefs = [menu.triggerHref];
  for (const column of menu.columns) {
    for (const item of column.items) {
      hrefs.push(item.href);
    }
  }
  if (menu.featured) hrefs.push(menu.featured.href);
  if (menu.footer) hrefs.push(menu.footer.href);
  return hrefs;
}

export function listLandingPremiumNavHrefs(): string[] {
  const hrefs = LANDING_PREMIUM_TOP_NAV.map(item => item.href);
  for (const menu of Object.values(LANDING_PREMIUM_MEGA_MENUS)) {
    hrefs.push(...collectMenuHrefs(menu));
  }
  return hrefs;
}

export function listLandingPremiumMegaLinks(): LandingPremiumMegaLink[] {
  const links: LandingPremiumMegaLink[] = [];
  for (const menu of Object.values(LANDING_PREMIUM_MEGA_MENUS)) {
    for (const column of menu.columns) {
      links.push(...column.items);
    }
    if (menu.featured) links.push(menu.featured);
    if (menu.footer) links.push(menu.footer);
  }
  return links;
}
