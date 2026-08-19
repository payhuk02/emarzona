/**
 * Configuration IA des 8 pages Fonctionnalites.
 */
import type { LucideIcon } from 'lucide-react';
import {
  Store,
  CreditCard,
  MessageCircle,
  Users,
  Mail,
  BarChart3,
  Layers,
  Link2,
  ShoppingCart,
  Zap,
  Shield,
  Globe,
  Smartphone,
  TrendingUp,
  Bell,
  Repeat,
  Gift,
  Code,
  Lock,
  DollarSign,
  LayoutDashboard,
  PieChart,
  ArrowUpRight,
  Search,
  Settings,
  Package,
} from 'lucide-react';

export type FeaturePageConfig = {
  slug: string;
  route: string;
  accentColor: string;
  heroTag: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  heroIcon: LucideIcon;
  /** Default hero image. Overridable from admin. */
  heroImage: string;
  ctaHref: string;
  statsItems: { value: string; label: string }[];
  featureBlocks: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
  seoTitle: string;
  seoDescription: string;
};

export const FEATURES_PAGES: Record<string, FeaturePageConfig> = {
  storefront: {
    slug: 'storefront',
    route: '/features/storefront',
    accentColor: '#2563eb',
    heroTag: 'Boutique & Storefront',
    heroTitle: 'Votre boutique en ligne,',
    heroTitleHighlight: 'belle et performante.',
    heroSubtitle:
      'Créez une boutique à votre image en quelques minutes : nom de domaine personnalisé, thèmes premium, page produit optimisée SEO et expérience mobile impeccable.',
    heroIcon: Store,
    heroImage: '/images/hero/hero-storefront.png',
    ctaHref: '/register',
    statsItems: [
      { value: '5 min', label: 'pour ouvrir sa boutique' },
      { value: '100%', label: 'optimisé mobile' },
      { value: 'SEO', label: 'natif sur chaque page' },
    ],
    featureBlocks: [
      {
        icon: Store,
        title: 'Domaine personnalisé',
        description:
          'Connectez votre propre domaine (boutique.votredomaine.com) ou utilisez votre sous-domaine Emarzona gratuit.',
      },
      {
        icon: Smartphone,
        title: 'Design 100% responsive',
        description:
          'Chaque boutique est optimisée pour mobile, tablette et desktop — sans configuration supplémentaire.',
      },
      {
        icon: Search,
        title: 'SEO natif',
        description:
          'Balises meta, Open Graph, schema.org produit, sitemap automatique — votre boutique est indexable dès le premier jour.',
      },
      {
        icon: ShoppingCart,
        title: 'Panier & checkout rapide',
        description:
          "Checkout en 2 étapes avec auto-complétion d'adresse, sauvegarde de panier et récupération abandonnée.",
      },
      {
        icon: Settings,
        title: 'Personnalisation sans code',
        description:
          'Couleurs, typo, bannières, sections — personnalisez votre boutique via un éditeur visuel intuitif.',
      },
      {
        icon: BarChart3,
        title: 'Analytics de boutique',
        description:
          'Visiteurs, taux de conversion, top produits, sources de trafic — tout visible dans votre dashboard.',
      },
    ],
    seoTitle: 'Boutique en ligne Emarzona | Storefront',
    seoDescription:
      'Créez votre boutique en ligne avec Emarzona : domaine personnalisé, SEO natif, checkout rapide et design responsive. En ligne en 5 minutes.',
  },

  checkout: {
    slug: 'checkout',
    route: '/features/checkout',
    accentColor: '#10b981',
    heroTag: 'Paiement & Checkout',
    heroTitle: 'Encaissez partout,',
    heroTitleHighlight: 'sans friction.',
    heroSubtitle:
      'Mobile money (Orange Money, Wave, MTN...), carte bancaire, paiement à la livraison, acompte garantie — acceptez chaque mode de paiement que vos clients préfèrent.',
    heroIcon: CreditCard,
    heroImage: '/images/hero/hero-checkout.png',
    ctaHref: '/register',
    statsItems: [
      { value: '4+', label: 'modes de paiement' },
      { value: '30+', label: 'devises acceptées' },
      { value: 'PCI', label: 'DSS compliant' },
    ],
    featureBlocks: [
      {
        icon: Smartphone,
        title: 'Mobile money intégré',
        description:
          'Orange Money, Wave, MTN, Moov et autres opérateurs locaux — un seul checkout pour tous.',
      },
      {
        icon: CreditCard,
        title: 'Cartes bancaires internationales',
        description:
          'Visa, Mastercard, American Express — traitement sécurisé via Stripe avec 3D Secure.',
      },
      {
        icon: Package,
        title: 'Paiement à la livraison (COD)',
        description:
          'Acceptez les paiements cash ou mobile money à la livraison pour les produits physiques.',
      },
      {
        icon: Lock,
        title: 'Garantie à la commande',
        description:
          'Exigez un acompte au moment de la commande. Le solde est réglé à la livraison ou à la prestation.',
      },
      {
        icon: Shield,
        title: 'Sécurité & conformité',
        description:
          'Chiffrement TLS 1.3, tokenisation des cartes, conformité PCI DSS niveau 1. Vos clients sont protégés.',
      },
      {
        icon: Globe,
        title: 'Multi-devises',
        description:
          "FCFA, EUR, USD, GBP et plus — vos prix s'affichent dans la devise préférée du client.",
      },
    ],
    seoTitle: 'Solutions de paiement e-commerce | Emarzona',
    seoDescription:
      'Acceptez mobile money, cartes bancaires, COD et acompte garantie. Checkout sécurisé multi-devises pour votre boutique Emarzona.',
  },

  whatsapp: {
    slug: 'whatsapp',
    route: '/features/whatsapp',
    accentColor: '#25d366',
    heroTag: 'WhatsApp Commerce',
    heroTitle: 'Vendez là où',
    heroTitleHighlight: 'vos clients chattent.',
    heroSubtitle:
      'Bouton WhatsApp sur chaque fiche produit, notifications de commande, relances abandonnées et support client — intégrez WhatsApp au coeur de votre process de vente.',
    heroIcon: MessageCircle,
    heroImage: '/images/hero/hero-whatsapp.png',
    ctaHref: '/register',
    statsItems: [
      { value: '98%', label: "taux d'ouverture des messages" },
      { value: '3x', label: 'plus de conversions vs email' },
      { value: '0€', label: "frais d'installation" },
    ],
    featureBlocks: [
      {
        icon: MessageCircle,
        title: '"Contacter via WhatsApp"',
        description:
          'Sur chaque fiche produit, un bouton direct WhatsApp pré-rempli avec le nom du produit facilite la prise de contact.',
      },
      {
        icon: Bell,
        title: 'Notifications de commande WhatsApp',
        description:
          'Confirmation, expédition, livraison — vos clients reçoivent chaque mise à jour sur WhatsApp.',
      },
      {
        icon: Repeat,
        title: 'Relances de panier abandonné',
        description:
          "Relancez automatiquement les visiteurs qui n'ont pas finalisé leur commande, directement sur WhatsApp.",
      },
      {
        icon: Users,
        title: 'Catalogue WhatsApp',
        description:
          "Synchronisez vos produits avec le catalogue WhatsApp Business pour vendre directement dans l'app.",
      },
      {
        icon: Zap,
        title: 'Réponses automatiques',
        description:
          'Configurez des réponses automatiques aux questions fréquentes : prix, disponibilité, livraison.',
      },
      {
        icon: BarChart3,
        title: 'Analytics WhatsApp',
        description:
          'Suivez les clics WhatsApp, les conversions et les revenus attribuables à ce canal depuis votre dashboard.',
      },
    ],
    seoTitle: 'WhatsApp Commerce pour votre boutique | Emarzona',
    seoDescription:
      'Intégrez WhatsApp dans votre boutique Emarzona : bouton produit, notifications, relances abandonnées et catalogue Business.',
  },

  referral: {
    slug: 'referral',
    route: '/features/referral',
    accentColor: '#7c5cff',
    heroTag: 'Parrainage & Référence',
    heroTitle: 'Vos clients,',
    heroTitleHighlight: 'vos meilleurs commerciaux.',
    heroSubtitle:
      'Programme de parrainage automatisé : lien de référence unique, suivi des parrainages, récompenses configurables et tableau de bord en temps réel pour chaque vendeur.',
    heroIcon: Users,
    heroImage: '/images/hero/hero-referral.png',
    ctaHref: '/register',
    statsItems: [
      { value: '3x', label: "plus d'acquisition vs pub" },
      { value: '100%', label: 'automatisé & traçable' },
      { value: '0', label: 'fraude grâce aux anti-doublons' },
    ],
    featureBlocks: [
      {
        icon: Link2,
        title: 'Lien de parrainage unique',
        description:
          "Chaque vendeur dispose d'un lien de référence personnalisé partageable sur réseaux sociaux, WhatsApp et email.",
      },
      {
        icon: Users,
        title: 'Tableau de bord de parrainage',
        description:
          'Suivez en temps réel les clics, inscriptions, conversions et revenus générés par vos filleuls.',
      },
      {
        icon: Gift,
        title: 'Récompenses configurables',
        description:
          'Crédit boutique, réduction, commission — définissez la récompense qui motive le mieux vos parrains.',
      },
      {
        icon: Shield,
        title: 'Anti-fraude & anti-doublons',
        description:
          'Détection automatique des auto-parrainages, adresses email jetables et abus — système intègre et équitable.',
      },
      {
        icon: Zap,
        title: 'Attribution en temps réel',
        description:
          "Dès qu'un filleul passe une commande, la récompense est créditée instantanément sur le compte parrain.",
      },
      {
        icon: BarChart3,
        title: 'Rapports & exports',
        description:
          'Exportez vos données de parrainage en CSV pour votre comptabilité ou vos analyses marketing.',
      },
    ],
    seoTitle: 'Programme de parrainage e-commerce | Emarzona',
    seoDescription:
      'Créez votre programme de parrainage automatisé sur Emarzona : lien unique, récompenses, anti-fraude et analytics en temps réel.',
  },

  affiliate: {
    slug: 'affiliate',
    route: '/features/affiliate',
    accentColor: '#f59e0b',
    heroTag: "Programme d'affiliation",
    heroTitle: "Votre réseau d'affiliation,",
    heroTitleHighlight: 'automatisé à grande échelle.',
    heroSubtitle:
      'Recrutez des affiliés, configurez vos commissions, suivez les performances et payez automatiquement — tout en un, comme Amazon Associates, mais pour votre boutique.',
    heroIcon: TrendingUp,
    heroImage: '/images/hero/hero-affiliate.png',
    ctaHref: '/register',
    statsItems: [
      { value: '∞', label: 'affiliés par boutique' },
      { value: 'Temps réel', label: 'suivi des conversions' },
      { value: 'Auto', label: 'paiements des commissions' },
    ],
    featureBlocks: [
      {
        icon: TrendingUp,
        title: 'Portail affilié dédié',
        description:
          'Vos affiliés accèdent à leur propre espace : liens, bannières, statistiques et commissions en attente.',
      },
      {
        icon: DollarSign,
        title: 'Commissions flexibles',
        description:
          "Par produit, par catégorie ou globalement — définissez des taux différents pour chaque type d'affiliation.",
      },
      {
        icon: ArrowUpRight,
        title: 'Tracking multi-touch',
        description:
          'Attribution last-click ou multi-touch pour des commissions équitables quand plusieurs affiliés interviennent.',
      },
      {
        icon: Shield,
        title: 'Validation des conversions',
        description:
          'Délai de validation configurable (ex. : 30 jours). Les commissions sont libérées après expiration du délai de retour.',
      },
      {
        icon: Zap,
        title: 'Paiement automatique des affiliés',
        description:
          'Virements automatiques vers mobile money ou compte bancaire selon un calendrier que vous définissez.',
      },
      {
        icon: Code,
        title: 'API & intégrations',
        description:
          "Connectez votre programme d'affiliation à des réseaux tiers (Impact, ShareASale) via notre API ouverte.",
      },
    ],
    seoTitle: "Programme d'affiliation e-commerce | Emarzona",
    seoDescription:
      "Lancez votre programme d'affiliation avec Emarzona : commissions, portail affilié, tracking conversions et paiements automatiques.",
  },

  email: {
    slug: 'email',
    route: '/features/email',
    accentColor: '#2563eb',
    heroTag: 'Email Marketing',
    heroTitle: 'Fidélisez vos clients',
    heroTitleHighlight: 'avec des emails qui convertissent.',
    heroSubtitle:
      "Séquences d'onboarding, newsletters, relances abandonnées, promotions ciblées — un éditeur email puissant directement intégré à votre boutique Emarzona.",
    heroIcon: Mail,
    heroImage: '/images/hero/hero-email.png',
    ctaHref: '/register',
    statsItems: [
      { value: '40x', label: "ROI moyen de l'email marketing" },
      { value: '100%', label: 'GDPR compliant' },
      { value: 'Auto', label: 'séquences automatisées' },
    ],
    featureBlocks: [
      {
        icon: Mail,
        title: 'Éditeur drag-and-drop',
        description:
          'Créez de beaux emails sans coder : blocs texte, images, boutons, produits — glissez-déposez.',
      },
      {
        icon: Repeat,
        title: 'Séquences automatisées',
        description:
          'Onboarding, post-achat, relance panier, anniversaire — configurez vos automatisations une fois pour toujours.',
      },
      {
        icon: Users,
        title: 'Segmentation avancée',
        description:
          "Ciblez vos clients par comportement d'achat, géographie, tags ou historique — des messages ultra-pertinents.",
      },
      {
        icon: BarChart3,
        title: 'Analytics email',
        description:
          "Taux d'ouverture, clics, conversions, revenus attribués — mesurez l'impact de chaque campagne.",
      },
      {
        icon: Shield,
        title: 'GDPR & conformité',
        description:
          'Double opt-in, désabonnement en 1 clic, hébergement UE — vous restez en conformité, sans effort.',
      },
      {
        icon: Zap,
        title: 'A/B Testing',
        description:
          "Testez objet, contenu et heure d'envoi. Envoyez automatiquement la version gagnante à votre liste.",
      },
    ],
    seoTitle: 'Email Marketing e-commerce | Emarzona',
    seoDescription:
      'Plateforme email marketing intégrée à votre boutique Emarzona : séquences automatisées, segmentation, A/B test et analytics.',
  },

  analytics: {
    slug: 'analytics',
    route: '/features/analytics',
    accentColor: '#7c5cff',
    heroTag: 'Analytics & Rapports',
    heroTitle: 'Décidez grâce',
    heroTitleHighlight: 'aux données, pas aux intuitions.',
    heroSubtitle:
      'Tableau de bord en temps réel, rapports de ventes, analyse des cohortes, heatmaps produits — toutes les métriques pour piloter votre croissance comme un pro.',
    heroIcon: BarChart3,
    heroImage: '/images/hero/hero-analytics.png',
    ctaHref: '/register',
    statsItems: [
      { value: 'Temps réel', label: 'mises à jour du dashboard' },
      { value: '15+', label: 'métriques clés suivies' },
      { value: 'CSV', label: 'export à tout moment' },
    ],
    featureBlocks: [
      {
        icon: LayoutDashboard,
        title: 'Dashboard centralisé',
        description:
          "Revenue, commandes, clients actifs, taux de conversion — tout en un coup d'oeil, mis à jour en temps réel.",
      },
      {
        icon: PieChart,
        title: 'Rapports de ventes détaillés',
        description:
          'Par produit, catégorie, canal, période — analysez où vos revenus sont générés et pourquoi.',
      },
      {
        icon: Users,
        title: 'Analyse des cohortes clients',
        description:
          "Suivez la rétention, la LTV (valeur vie client) et les comportements de rachat par cohorte d'acquisition.",
      },
      {
        icon: Search,
        title: 'Heatmaps produits & entonnoir',
        description:
          "Identifiez les pages à fort taux de rebond et les étapes où vos clients abandonnent le processus d'achat.",
      },
      {
        icon: ArrowUpRight,
        title: 'Attribution marketing',
        description:
          'Identifiez les canaux (SEO, WhatsApp, affiliation, email) qui génèrent le plus de revenus.',
      },
      {
        icon: Code,
        title: 'Exports & intégrations',
        description:
          'Exportez vos données en CSV ou connectez-les à Google Looker Studio, Metabase ou votre data warehouse.',
      },
    ],
    seoTitle: 'Analytics e-commerce | Emarzona',
    seoDescription:
      'Tableau de bord e-commerce en temps réel : ventes, cohortes, attribution, exports. Pilotez votre boutique Emarzona avec des données fiables.',
  },

  multistore: {
    slug: 'multistore',
    route: '/features/multi-store',
    accentColor: '#f97316',
    heroTag: 'Multi-boutiques',
    heroTitle: 'Gérez plusieurs boutiques',
    heroTitleHighlight: 'depuis un seul compte.',
    heroSubtitle:
      'Créez et gérez plusieurs boutiques indépendantes sous un même compte Emarzona : marques distinctes, stocks séparés, tableaux de bord consolidés.',
    heroIcon: Layers,
    heroImage: '/images/hero/hero-multistore.png',
    ctaHref: '/register',
    statsItems: [
      { value: '∞', label: 'boutiques par compte' },
      { value: '1', label: 'dashboard consolidé' },
      { value: '100%', label: 'indépendance par boutique' },
    ],
    featureBlocks: [
      {
        icon: Store,
        title: 'Boutiques indépendantes',
        description:
          'Chaque boutique a son propre domaine, catalogue, thème et paramètres — isolation totale entre vos marques.',
      },
      {
        icon: LayoutDashboard,
        title: 'Vue consolidée',
        description:
          'Agrégez les revenues, commandes et KPIs de toutes vos boutiques dans un dashboard unique.',
      },
      {
        icon: Users,
        title: 'Équipes par boutique',
        description:
          "Assignez des membres d'équipe à des boutiques spécifiques avec des rôles et permissions granulaires.",
      },
      {
        icon: Settings,
        title: 'Gestion centralisée des paramètres',
        description:
          'Partagez des configurations (paiement, livraison, tax) entre boutiques ou personnalisez-les individuellement.',
      },
      {
        icon: Zap,
        title: 'Cross-selling inter-boutiques',
        description:
          "Recommandez des produits d'une boutique à l'autre pour maximiser la valeur client sur votre portefeuille.",
      },
      {
        icon: BarChart3,
        title: 'Comparaison de performances',
        description:
          'Comparez les métriques clés entre boutiques pour identifier vos meilleures pratiques et les répliquer.',
      },
    ],
    seoTitle: 'Gestion multi-boutiques | Emarzona',
    seoDescription:
      'Gérez plusieurs boutiques depuis un seul compte Emarzona : marques indépendantes, dashboard consolidé, équipes dédiées.',
  },
};

export const FEATURES_NAV_ITEMS = Object.values(FEATURES_PAGES).map(p => ({
  slug: p.slug,
  route: p.route,
  label: p.heroTag,
  icon: p.heroIcon,
}));
