/**
 * Configuration of the 6 Solutions marketing pages.
 * User-facing French copy lives in solutions-pages-copy.json (UTF-8).
 */
import type { LucideIcon } from 'lucide-react';
import {
  Package,
  Monitor,
  Briefcase,
  GraduationCap,
  Palette,
  ShieldCheck,
  Truck,
  Warehouse,
  CreditCard,
  MessageCircle,
  BadgePercent,
  Repeat,
  BarChart3,
  MapPin,
  Download,
  Lock,
  Globe,
  Zap,
  FileText,
  Code,
  Music,
  Calendar,
  Users,
  Star,
  Bell,
  Clock,
  BookOpen,
  Award,
  Layers,
  Play,
  TrendingUp,
  Frame,
  Gem,
  Shield,
  Image as ImageIcon,
  AlertTriangle,
  RotateCcw,
  Scale,
} from 'lucide-react';
import copy from './solutions-pages-copy.json';

export type SolutionFeature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export type SolutionCategory = {
  icon: LucideIcon;
  label: string;
  popular?: boolean;
};

export type SolutionStep = {
  number: string;
  title: string;
  description: string;
};

export type SolutionPageConfig = {
  slug: string;
  route: string;
  accentColor: string;
  heroTag: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroIcon: LucideIcon;
  /** Default hero image path (public/images/hero/). Overridable from admin. */
  heroImage: string;
  ctaHref: string;
  statsItems: { value: string; label: string }[];
  categories: SolutionCategory[];
  features: SolutionFeature[];
  steps: SolutionStep[];
  seoTitle: string;
  seoDescription: string;
};

type PageCopy = (typeof copy)[keyof typeof copy];

function withCopy(
  meta: {
    slug: string;
    route: string;
    accentColor: string;
    heroIcon: LucideIcon;
    heroImage: string;
    ctaHref: string;
  },
  pageCopy: PageCopy,
  categoryIcons: LucideIcon[],
  popularCount: number,
  featureIcons: LucideIcon[]
): SolutionPageConfig {
  return {
    ...meta,
    heroTag: pageCopy.heroTag,
    heroTitle: pageCopy.heroTitle,
    heroTitleHighlight: pageCopy.heroTitleHighlight,
    heroSubtitle: pageCopy.heroSubtitle,
    statsItems: pageCopy.statsItems.map(item => ({ ...item })),
    categories: pageCopy.categories.map((label, index) => ({
      icon: categoryIcons[index] ?? Package,
      label,
      ...(index < popularCount ? { popular: true } : {}),
    })),
    features: pageCopy.features.map((feature, index) => ({
      icon: featureIcons[index] ?? Package,
      title: feature.title,
      description: feature.description,
    })),
    steps: pageCopy.steps.map(step => ({ ...step })),
    seoTitle: pageCopy.seoTitle,
    seoDescription: pageCopy.seoDescription,
  };
}

export const SOLUTIONS_PAGES: Record<string, SolutionPageConfig> = {
  physical: withCopy(
    {
      slug: 'physical',
      route: '/solutions/physical',
      accentColor: '#f97316',
      heroIcon: Package,
      heroImage: '/images/hero/hero-physical.png',
      ctaHref: '/register',
    },
    copy.physical,
    Array(18).fill(Package),
    6,
    [Warehouse, Truck, BadgePercent, CreditCard, MessageCircle, BarChart3, Repeat, MapPin]
  ),
  digital: withCopy(
    {
      slug: 'digital',
      route: '/solutions/digital',
      accentColor: '#7c5cff',
      heroIcon: Monitor,
      heroImage: '/images/hero/hero-digital.png',
      ctaHref: '/register',
    },
    copy.digital,
    [
      BookOpen,
      FileText,
      Code,
      GraduationCap,
      ImageIcon,
      Music,
      Monitor,
      Code,
      Layers,
      Code,
      FileText,
      Package,
      ImageIcon,
      Music,
    ],
    6,
    [Zap, Lock, Download, Globe, BarChart3, Repeat]
  ),
  services: withCopy(
    {
      slug: 'services',
      route: '/solutions/services',
      accentColor: '#10b981',
      heroIcon: Briefcase,
      heroImage: '/images/hero/hero-services.png',
      ctaHref: '/register',
    },
    copy.services,
    [
      Users,
      Palette,
      Code,
      TrendingUp,
      FileText,
      Monitor,
      ImageIcon,
      Monitor,
      Music,
      Music,
      Users,
      BarChart3,
      Globe,
      Shield,
      Package,
    ],
    6,
    [Calendar, CreditCard, Bell, Clock, Users, Star]
  ),
  courses: withCopy(
    {
      slug: 'courses',
      route: '/solutions/courses',
      accentColor: '#f59e0b',
      heroIcon: GraduationCap,
      heroImage: '/images/hero/hero-courses.png',
      ctaHref: '/register',
    },
    copy.courses,
    [
      Code,
      Palette,
      TrendingUp,
      Briefcase,
      Globe,
      ImageIcon,
      Music,
      FileText,
      Users,
      Package,
      Package,
      CreditCard,
      Users,
      Palette,
      BarChart3,
      Shield,
    ],
    5,
    [Play, Layers, Award, BookOpen, Users, BarChart3]
  ),
  artist: withCopy(
    {
      slug: 'artist',
      route: '/solutions/artist',
      accentColor: '#ec4899',
      heroIcon: Palette,
      heroImage: '/images/hero/hero-artist.png',
      ctaHref: '/register',
    },
    copy.artist,
    [
      Palette,
      FileText,
      Package,
      ImageIcon,
      Palette,
      Layers,
      Layers,
      ImageIcon,
      Package,
      Package,
      BookOpen,
    ],
    5,
    [Frame, Gem, Shield, Scale, Layers, BarChart3]
  ),
  protect: withCopy(
    {
      slug: 'protect',
      route: '/solutions/protect',
      accentColor: '#10b981',
      heroIcon: ShieldCheck,
      heroImage: '/images/hero/hero-protect.png',
      ctaHref: '/marketplace',
    },
    copy.protect,
    [Package, Monitor, Briefcase, GraduationCap, Palette],
    5,
    [Clock, ShieldCheck, RotateCcw, AlertTriangle, Scale, Lock]
  ),
};

export const SOLUTIONS_NAV_ITEMS = Object.values(SOLUTIONS_PAGES).map(page => ({
  slug: page.slug,
  route: page.route,
  label: page.heroTag,
  icon: page.heroIcon,
}));
