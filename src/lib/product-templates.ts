/**
 * Module: Product Templates
 * Description: Templates prédéfinis pour création rapide de produits
 * Date: 25/10/2025
 * Impact: -70% temps pour utilisateurs récurrents
 */

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  type: 'digital' | 'physical' | 'service';
  popularityScore: number;
  config: Partial<ProductFormData>;
}

interface ProductFormData {
  // Informations de base
  product_type: string;
  pricing_model: string;
  category: string;
  currency: string;
  
  // Description
  short_description: string;
  features: string[];
  
  // Fichiers et téléchargements
  file_access_type: string;
  download_limit: number | null;
  download_expiry_days: number | null;
  
  // Visibilité
  is_active: boolean;
  is_featured: boolean;
  hide_from_store: boolean;
  password_protected: boolean;
  access_control: string;
  
  // Livraison
  shipping_required: boolean;
  collect_shipping_address: boolean;
  
  // Support
  support_email: string;
  
  // Analytics
  analytics_enabled: boolean;
  track_views: boolean;
  track_clicks: boolean;
  track_purchases: boolean;
  
  [key: string]: any;
}

/**
 * Templates prédéfinis par catégorie
 */
export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // ===== PRODUITS DIGITAUX =====
  {
    id: 'ebook-template',
    name: 'Ebook / PDF',
    description: 'Livre numérique, guide, manuel ou document PDF',
    category: 'Ebook',
    icon: '📚',
    type: 'digital',
    popularityScore: 95,
    config: {
      product_type: 'digital',
      pricing_model: 'one-time',
      category: 'ebook',
      currency: 'XOF',
      file_access_type: 'immediate',
      download_limit: null,
      download_expiry_days: null,
      shipping_required: false,
      collect_shipping_address: false,
      is_active: false,
      is_featured: false,
      hide_from_store: false,
      password_protected: false,
      access_control: 'public',
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Téléchargement immédiat après achat',
        'Format PDF haute qualité',
        'Accès illimité à vie',
        'Compatible tous appareils',
        'Mises à jour gratuites incluses',
      ],
    },
  },
  {
    id: 'online-course-template',
    name: 'Formation en ligne',
    description: 'Cours vidéo, tutoriels, masterclass',
    category: 'Formation',
    icon: '🎓',
    type: 'digital',
    popularityScore: 90,
    config: {
      product_type: 'digital',
      pricing_model: 'one-time',
      category: 'formation',
      currency: 'XOF',
      file_access_type: 'immediate',
      download_limit: null,
      download_expiry_days: null,
      shipping_required: false,
      collect_shipping_address: false,
      is_active: false,
      is_featured: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Vidéos HD de qualité professionnelle',
        'Accès à vie au contenu',
        'Certificat de completion',
        'Support instructeur inclus',
        'Ressources téléchargeables',
        'Mises à jour du contenu gratuites',
      ],
    },
  },
  {
    id: 'software-template',
    name: 'Logiciel / Application',
    description: 'Application, plugin, thème ou logiciel',
    category: 'Logiciel',
    icon: '💻',
    type: 'digital',
    popularityScore: 85,
    config: {
      product_type: 'digital',
      pricing_model: 'one-time',
      category: 'logiciel',
      currency: 'XOF',
      file_access_type: 'immediate',
      download_limit: 3,
      download_expiry_days: 365,
      shipping_required: false,
      collect_shipping_address: false,
      support_email: '',
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Licence individuelle incluse',
        'Mises à jour 1 an gratuites',
        'Support technique prioritaire',
        'Documentation complète',
        'Installation assistée disponible',
      ],
    },
  },
  {
    id: 'template-design-template',
    name: 'Template / Design',
    description: 'Template web, design graphique, fichiers sources',
    category: 'Design',
    icon: '🎨',
    type: 'digital',
    popularityScore: 80,
    config: {
      product_type: 'digital',
      pricing_model: 'one-time',
      category: 'template',
      currency: 'XOF',
      file_access_type: 'immediate',
      download_limit: null,
      download_expiry_days: null,
      shipping_required: false,
      collect_shipping_address: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Fichiers sources inclus',
        'Documentation d\'installation',
        'Compatible dernières versions',
        'Personnalisation facile',
        'Support gratuit 30 jours',
      ],
    },
  },

  // ===== PRODUITS PHYSIQUES =====
  {
    id: 'clothing-template',
    name: 'Vêtements / Mode',
    description: 'Habits, accessoires, chaussures',
    category: 'Mode',
    icon: '👕',
    type: 'physical',
    popularityScore: 88,
    config: {
      product_type: 'physical',
      pricing_model: 'one-time',
      category: 'vetements',
      currency: 'XOF',
      shipping_required: true,
      collect_shipping_address: true,
      is_active: false,
      is_featured: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      color_variants: true,
      size_variants: true,
      centralized_stock: false,
      low_stock_alerts: true,
      features: [
        'Matériaux de qualité premium',
        'Tailles disponibles: S à XL',
        'Livraison rapide assurée',
        'Retours gratuits sous 14 jours',
        'Garantie satisfait ou remboursé',
      ],
    },
  },
  {
    id: 'handmade-template',
    name: 'Produit artisanal',
    description: 'Créations fait-main, artisanat local',
    category: 'Artisanat',
    icon: '🎁',
    type: 'physical',
    popularityScore: 75,
    config: {
      product_type: 'physical',
      pricing_model: 'one-time',
      category: 'artisanat',
      currency: 'XOF',
      shipping_required: true,
      collect_shipping_address: true,
      is_active: false,
      is_featured: true,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Fait-main avec soin',
        'Pièce unique ou série limitée',
        'Matériaux locaux et durables',
        'Emballage cadeau offert',
        'Certificat d\'authenticité',
      ],
    },
  },

  // ===== SERVICES =====
  {
    id: 'coaching-template',
    name: 'Coaching / Consultation',
    description: 'Session de coaching individuel ou collectif',
    category: 'Coaching',
    icon: '🎯',
    type: 'service',
    popularityScore: 82,
    config: {
      product_type: 'service',
      pricing_model: 'one-time',
      category: 'coaching',
      currency: 'XOF',
      shipping_required: false,
      collect_shipping_address: false,
      is_active: false,
      is_featured: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Session individuelle personnalisée',
        'Support par email inclus',
        'Suivi post-session',
        'Plan d\'action détaillé',
        'Garantie satisfaction',
      ],
    },
  },
  {
    id: 'design-service-template',
    name: 'Service de design',
    description: 'Création graphique, logo, identité visuelle',
    category: 'Design',
    icon: '✨',
    type: 'service',
    popularityScore: 78,
    config: {
      product_type: 'service',
      pricing_model: 'one-time',
      category: 'design',
      currency: 'XOF',
      shipping_required: false,
      collect_shipping_address: false,
      is_active: false,
      is_featured: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        '3 propositions de design',
        'Révisions illimitées',
        'Fichiers sources inclus',
        'Délai de livraison garanti',
        'Droits commerciaux complets',
      ],
    },
  },
  {
    id: 'web-development-template',
    name: 'Développement web',
    description: 'Création de site web, application',
    category: 'Développement',
    icon: '🚀',
    type: 'service',
    popularityScore: 80,
    config: {
      product_type: 'service',
      pricing_model: 'one-time',
      category: 'developpement',
      currency: 'XOF',
      shipping_required: false,
      collect_shipping_address: false,
      is_active: false,
      is_featured: false,
      analytics_enabled: true,
      track_views: true,
      track_clicks: true,
      track_purchases: true,
      features: [
        'Design responsive inclus',
        'Optimisation SEO de base',
        'Formation à l\'utilisation',
        'Support technique 3 mois',
        'Maintenance incluse',
      ],
    },
  },
];

/**
 * Obtenir les templates par type
 */
export const getTemplatesByType = (type: 'digital' | 'physical' | 'service'): ProductTemplate[] => {
  return PRODUCT_TEMPLATES.filter(t => t.type === type).sort((a, b) => b.popularityScore - a.popularityScore);
};

/**
 * Obtenir un template par son ID
 */
export const getTemplateById = (id: string): ProductTemplate | undefined => {
  return PRODUCT_TEMPLATES.find(t => t.id === id);
};

/**
 * Obtenir les templates populaires
 */
export const getPopularTemplates = (limit: number = 6): ProductTemplate[] => {
  return [...PRODUCT_TEMPLATES]
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
};

/**
 * Créer un template personnalisé depuis un produit existant
 */
export const createCustomTemplate = (
  productData: Partial<ProductFormData>,
  metadata: { name: string; description: string; icon?: string }
): ProductTemplate => {
  return {
    id: `custom-${Date.now()}`,
    name: metadata.name,
    description: metadata.description,
    category: productData.category || 'Personnalisé',
    icon: metadata.icon || '⭐',
    type: productData.product_type as any || 'digital',
    popularityScore: 50,
    config: productData,
  };
};

/**
 * Exporter un template en JSON
 */
export const exportTemplate = (template: ProductTemplate): string => {
  return JSON.stringify(template, null, 2);
};

/**
 * Importer un template depuis JSON
 */
export const importTemplate = (json: string): ProductTemplate => {
  try {
    const template = JSON.parse(json);
    // Valider la structure
    if (!template.id || !template.name || !template.type || !template.config) {
      throw new Error('Template invalide: structure manquante');
    }
    return template;
  } catch (error: any) {
    throw new Error(`Erreur d'import: ${error.message}`);
  }
};

/**
 * Appliquer un template à un formulaire
 */
export const applyTemplate = (
  template: ProductTemplate,
  currentData: Partial<ProductFormData> = {}
): Partial<ProductFormData> => {
  // Fusionner le template avec les données actuelles (priorité au template)
  return {
    ...currentData,
    ...template.config,
    // Garder certains champs existants si présents
    name: currentData.name || '',
    slug: currentData.slug || '',
    price: currentData.price || 0,
    image_url: currentData.image_url || '',
  };
};

