/**
 * Configuration SEO centralisée pour toutes les pages publiques
 * Évite la duplication et facilite la maintenance
 */

import { LANDING_SEO_DEFAULTS } from '@/lib/landing-seo';

export interface PageSEOEntry {
  title: string;
  description: string;
  noindex?: boolean;
  nofollow?: boolean;
  type?: 'website' | 'article' | 'product' | 'profile';
  keywords?: string;
}

/**
 * Map des routes publiques vers leur configuration SEO
 * Les pages dynamiques (/digital/:id, /physical/:id, etc.) sont gérées dans leurs composants
 */
export const PAGE_SEO_CONFIG: Record<string, PageSEOEntry> = {
  // === Pages publiques indexables ===
  '/': {
    title: LANDING_SEO_DEFAULTS.title,
    description: LANDING_SEO_DEFAULTS.description,
    keywords: LANDING_SEO_DEFAULTS.keywords,
  },
  '/marketplace': {
    title: 'Marketplace - Explorer les produits | Emarzona',
    description:
      "Découvrez des milliers de produits digitaux, physiques, services, cours en ligne et œuvres d'artistes sur Emarzona. Marketplace sécurisée.",
    keywords:
      "marketplace, produits, produits digitaux, produits physiques, services, cours en ligne, œuvres d'artistes, acheter en ligne, ecommerce",
  },
  '/recommendations': {
    title: 'Recommandations personnalisées | Emarzona',
    description:
      'Découvrez des produits sélectionnés spécialement pour vous grâce à notre système de recommandation IA.',
    keywords: 'recommandations, personnalisé, IA, produits suggérés',
  },
  '/discover': {
    title: 'Découvertes - Explorez de nouveaux produits | Emarzona',
    description:
      'Explorez des produits et services que vous ne connaissiez pas encore. Découvertes personnalisées par IA.',
    keywords: 'découvertes, explorer, nouveaux produits',
  },
  '/trending': {
    title: 'Tendances - Produits populaires | Emarzona',
    description:
      'Les produits et services les plus populaires du moment sur Emarzona. Tendances en temps réel.',
    keywords: 'tendances, populaire, trending, best-sellers',
  },
  '/collections': {
    title: 'Collections artistiques | Emarzona',
    description:
      "Parcourez les collections d'œuvres d'artistes sur Emarzona. Art digital, illustrations, photographies et plus.",
    keywords: 'collections, art, artistes, œuvres',
  },
  '/courses': {
    title: 'Cours en ligne | Emarzona',
    description:
      'Formations et cours en ligne : développement, business, design, marketing. Apprenez à votre rythme avec certificats.',
    keywords: 'cours en ligne, formation, e-learning, certificat',
  },
  '/art': {
    title: "Œuvres d'artistes | Emarzona",
    description:
      "Achetez des œuvres originales d'artistes : éditions limitées, certificats d'authenticité, collections et enchères.",
    keywords: 'art, artistes, œuvres, marketplace art, enchères',
  },
  '/auctions': {
    title: 'Enchères en ligne | Emarzona',
    description:
      'Participez aux enchères en ligne sur Emarzona. Trouvez des pièces uniques et faites vos offres.',
    keywords: 'enchères, auctions, pièces uniques, offres',
  },
  '/community': {
    title: 'Communauté | Emarzona',
    description:
      'Rejoignez la communauté Emarzona. Échangez avec des vendeurs et acheteurs passionnés.',
    keywords: 'communauté, forum, échanges, réseau',
  },
  '/digital/search': {
    title: 'Recherche de produits digitaux | Emarzona',
    description:
      'Recherchez parmi des milliers de produits digitaux : ebooks, templates, logiciels, formations et plus.',
    keywords: 'recherche, produits digitaux, ebooks, templates',
  },
  '/digital/compare': {
    title: 'Comparer des produits digitaux | Emarzona',
    description:
      'Comparez les caractéristiques et prix de produits digitaux côte à côte pour faire le meilleur choix.',
    keywords: 'comparer, produits digitaux, comparaison',
  },
  '/products/compare': {
    title: 'Comparer des produits | Emarzona',
    description: 'Comparez les produits côte à côte pour trouver celui qui vous convient le mieux.',
    keywords: 'comparer, produits, comparaison',
  },
  '/about': {
    title: 'À propos | Emarzona',
    description:
      "Découvrez Emarzona, plateforme e-commerce tout-en-un pensée pour l'Afrique de l'Ouest.",
  },
  '/contact': {
    title: 'Contact | Emarzona',
    description: "Contactez l'équipe Emarzona : support, partenariats et presse.",
  },
  '/pricing': {
    title: 'Tarifs | Emarzona',
    description:
      'Découvrez les plans et tarifs Emarzona. Commencez gratuitement et évoluez selon vos besoins.',
    keywords: 'tarifs, prix, abonnement, plans',
  },
  '/personalization/quiz': {
    title: 'Quiz de style personnalisé | Emarzona',
    description:
      'Répondez à notre quiz pour recevoir des recommandations de produits adaptées à vos goûts.',
  },
  '/personalization/recommendations': {
    title: 'Vos recommandations personnalisées | Emarzona',
    description:
      'Des produits sélectionnés pour vous en fonction de vos préférences et de votre historique.',
  },

  '/careers': {
    title: 'Carrières | Emarzona',
    description: 'Rejoignez Emarzona et participez à la construction du commerce en ligne.',
  },
  '/press': {
    title: 'Presse | Emarzona',
    description: 'Espace presse Emarzona : communiqués et contacts médias.',
  },
  '/blog': {
    title: 'Blog e-commerce | Emarzona',
    description:
      'Articles Emarzona : lancer une boutique, SEO, panier multi-types, paiements Moneroo et croissance en Afrique.',
  },
  '/docs': {
    title: 'Documentation | Emarzona',
    description: 'Guides et documentation pour démarrer sur Emarzona.',
  },
  '/help': {
    title: "Centre d'aide | Emarzona",
    description: 'FAQ et assistance pour vendeurs et acheteurs Emarzona.',
  },
  '/faq': {
    title: 'FAQ — Questions fréquentes | Emarzona',
    description:
      'Réponses sur Emarzona : boutique en ligne, paiements Moneroo, livraison FedEx, cours, produits digitaux et compte acheteur.',
  },
  '/integrations': {
    title: 'Intégrations | Emarzona',
    description: 'Paiements, logistique et outils connectés à votre boutique Emarzona.',
  },

  // === Pages légales (déjà SEOMeta mais listées pour cohérence) ===
  '/legal/terms': {
    title: "Conditions générales d'utilisation | Emarzona",
    description: "Consultez les conditions générales d'utilisation de la plateforme Emarzona.",
  },
  '/legal/cgv': {
    title: 'Conditions générales de vente | Emarzona',
    description: 'Consultez les conditions générales de vente applicables aux achats sur Emarzona.',
  },
  '/legal/privacy': {
    title: 'Politique de confidentialité | Emarzona',
    description: 'Découvrez comment Emarzona protège vos données personnelles.',
  },
  '/legal/cookies': {
    title: 'Politique de cookies | Emarzona',
    description: "Informations sur l'utilisation des cookies sur Emarzona.",
  },
  '/legal/refund': {
    title: 'Politique de remboursement | Emarzona',
    description: 'Conditions de remboursement sur la plateforme Emarzona.',
  },
  '/legal/dpa': {
    title: 'Accord de traitement des données (DPA) | Emarzona',
    description: 'Accord de traitement des données personnelles pour les vendeurs Emarzona.',
  },

  // === Pages qui doivent être en noindex ===
  '/login': {
    title: 'Connexion | Emarzona',
    description: 'Connectez-vous à votre compte Emarzona.',
    noindex: true,
  },
  '/register': {
    title: 'Inscription | Emarzona',
    description: 'Créez votre compte Emarzona gratuitement.',
    noindex: true,
  },
  '/auth': {
    title: 'Connexion | Emarzona',
    description: 'Connectez-vous à votre compte Emarzona.',
    noindex: true,
  },
  '/cart': {
    title: 'Panier | Emarzona',
    description: "Votre panier d'achats sur Emarzona.",
    noindex: true,
    nofollow: true,
  },
  '/checkout': {
    title: 'Paiement | Emarzona',
    description: 'Finalisez votre commande sur Emarzona.',
    noindex: true,
    nofollow: true,
  },
  '/payment/success': {
    title: 'Paiement réussi | Emarzona',
    description: 'Votre paiement a été confirmé.',
    noindex: true,
  },
  '/payment/cancel': {
    title: 'Paiement annulé | Emarzona',
    description: 'Votre paiement a été annulé.',
    noindex: true,
  },
  '/unsubscribe': {
    title: 'Désabonnement | Emarzona',
    description: 'Gérez vos préférences email Emarzona.',
    noindex: true,
  },
};
