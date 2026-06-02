import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  BoxIcon,
  Brain,
  Package,
  Sparkles,
  TrendingUp,
  Webhook,
} from 'lucide-react';

export type AdminToolLink = {
  label: string;
  description: string;
  path: string;
  icon: LucideIcon;
  /** admin = route /admin/* ; vendor = tableau de bord vendeur */
  scope: 'admin' | 'vendor';
  external?: boolean;
};

export type AdminToolCategory = {
  id: string;
  title: string;
  description: string;
  tools: AdminToolLink[];
};

/** Catalogue P3 : modules avancés non listés dans la sidebar principale */
export const ADMIN_ADVANCED_TOOL_CATEGORIES: AdminToolCategory[] = [
  {
    id: 'ai',
    title: 'IA & recommandations',
    description: 'Analyses et réglages intelligence artificielle.',
    tools: [
      {
        label: 'Analytics recommandations',
        description: 'Performance IA par boutique (vue admin).',
        path: '/admin/recommendation-insights',
        icon: Sparkles,
        scope: 'admin',
      },
      {
        label: 'Centre AI',
        description: 'Gestion des modèles et prompts plateforme.',
        path: '/admin/ai-management',
        icon: Brain,
        scope: 'admin',
      },
      {
        label: 'IA Recommandations',
        description: 'Paramètres moteur de recommandation.',
        path: '/admin/ai-settings',
        icon: Sparkles,
        scope: 'admin',
      },
      {
        label: 'Prévisions demande',
        description: 'Forecasting stock physique.',
        path: '/admin/demand-forecasting',
        icon: TrendingUp,
        scope: 'admin',
      },
      {
        label: 'Optimisation coûts',
        description: 'Scénarios logistiques et marges.',
        path: '/admin/cost-optimization',
        icon: BarChart3,
        scope: 'admin',
      },
    ],
  },
  {
    id: 'physical-vendor',
    title: 'Physique (outils vendeur)',
    description: 'Fonctions WMS avancées accessibles depuis le dashboard boutique.',
    tools: [
      {
        label: 'Analytics produits physiques',
        description: 'Performance ventes et rotation.',
        path: '/dashboard/physical-analytics',
        icon: BarChart3,
        scope: 'vendor',
      },
      {
        label: 'Lots & numéros de série',
        description: 'Traçabilité avancée.',
        path: '/dashboard/physical-serial-tracking',
        icon: Package,
        scope: 'vendor',
      },
      {
        label: 'Bundles physiques',
        description: 'Kits et offres groupées.',
        path: '/dashboard/physical-bundles',
        icon: BoxIcon,
        scope: 'vendor',
      },
      {
        label: 'Webhooks produit physique',
        description: 'Événements stock et expédition.',
        path: '/dashboard/physical-webhooks',
        icon: Webhook,
        scope: 'vendor',
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Automatisations et campagnes.',
    tools: [
      {
        label: 'Broadcast admin',
        description: 'Campagnes email / push plateforme.',
        path: '/admin/notifications',
        icon: Bell,
        scope: 'admin',
      },
      {
        label: 'Règles intelligentes (boutique)',
        description: 'Automatisations par boutique (contexte vendeur).',
        path: '/dashboard/smart-notifications',
        icon: Bell,
        scope: 'vendor',
      },
    ],
  },
];
