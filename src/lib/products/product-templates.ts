/**
 * Product Templates System
 * Date: 28 Janvier 2025
 * 
 * Système de templates pour tous les types de produits
 * Permet de créer des produits à partir de templates pré-configurés
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export interface ProductTemplate {
  id: string;
  name: string;
  description: string;
  product_type: ProductType;
  category?: string;
  icon?: string;
  preview_image?: string;
  
  // Données du template
  template_data: {
    // Informations de base
    name?: string;
    description?: string;
    short_description?: string;
    price?: number;
    currency?: string;
    category?: string;
    tags?: string[];
    
    // Spécifique par type
    digital?: {
      category?: string;
      license_type?: string;
      download_limit?: number;
    };
    
    physical?: {
      has_variants?: boolean;
      track_inventory?: boolean;
      requires_shipping?: boolean;
    };
    
    service?: {
      service_type?: string;
      duration?: number;
      location_type?: string;
    };
    
    course?: {
      level?: string;
      language?: string;
      certificate_enabled?: boolean;
    };
    
    artist?: {
      artist_type?: string;
      edition_type?: string;
    };
    
    // Commun
    seo?: {
      meta_title?: string;
      meta_description?: string;
    };
    
    affiliate?: {
      enabled?: boolean;
      commission_rate?: number;
    };
  };
  
  // Métadonnées
  created_by?: string;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Templates prédéfinis
 */
export const PREDEFINED_TEMPLATES: Omit<ProductTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  // Digital
  {
    name: 'Ebook Standard',
    description: 'Template pour créer un ebook avec licence standard',
    product_type: 'digital',
    category: 'ebook',
    icon: '📚',
    template_data: {
      name: 'Mon Ebook',
      description: 'Description de votre ebook...',
      price: 5000,
      currency: 'XOF',
      category: 'ebook',
      tags: ['ebook', 'livre'],
      digital: {
        category: 'ebook',
        license_type: 'single',
        download_limit: 5,
      },
      seo: {
        meta_title: 'Mon Ebook - Emarzona',
        meta_description: 'Découvrez mon ebook...',
      },
      affiliate: {
        enabled: true,
        commission_rate: 20,
      },
    },
    is_public: true,
    usage_count: 0,
  },
  {
    name: 'Template Design',
    description: 'Template pour créer un template design (PSD, Figma, etc.)',
    product_type: 'digital',
    category: 'template',
    icon: '🎨',
    template_data: {
      name: 'Mon Template',
      description: 'Description de votre template...',
      price: 10000,
      currency: 'XOF',
      category: 'template',
      tags: ['template', 'design'],
      digital: {
        category: 'template',
        license_type: 'multi-user',
        download_limit: 10,
      },
    },
    is_public: true,
    usage_count: 0,
  },
  
  // Physical
  {
    name: 'Produit Simple',
    description: 'Template pour un produit physique simple sans variantes',
    product_type: 'physical',
    category: 'general',
    icon: '📦',
    template_data: {
      name: 'Mon Produit',
      description: 'Description de votre produit...',
      price: 15000,
      currency: 'XOF',
      tags: ['produit'],
      physical: {
        has_variants: false,
        track_inventory: true,
        requires_shipping: true,
      },
    },
    is_public: true,
    usage_count: 0,
  },
  {
    name: 'Vêtement avec Variantes',
    description: 'Template pour vêtements avec couleurs et tailles',
    product_type: 'physical',
    category: 'clothing',
    icon: '👕',
    template_data: {
      name: 'Mon Vêtement',
      description: 'Description de votre vêtement...',
      price: 20000,
      currency: 'XOF',
      tags: ['vêtement', 'mode'],
      physical: {
        has_variants: true,
        track_inventory: true,
        requires_shipping: true,
      },
    },
    is_public: true,
    usage_count: 0,
  },
  
  // Service
  {
    name: 'Consultation',
    description: 'Template pour une consultation en ligne',
    product_type: 'service',
    category: 'consultation',
    icon: '💼',
    template_data: {
      name: 'Ma Consultation',
      description: 'Description de votre consultation...',
      price: 25000,
      currency: 'XOF',
      tags: ['consultation'],
      service: {
        service_type: 'consultation',
        duration: 60,
        location_type: 'online',
      },
    },
    is_public: true,
    usage_count: 0,
  },
  {
    name: 'Atelier/Workshop',
    description: 'Template pour un atelier ou workshop',
    product_type: 'service',
    category: 'workshop',
    icon: '🎓',
    template_data: {
      name: 'Mon Atelier',
      description: 'Description de votre atelier...',
      price: 50000,
      currency: 'XOF',
      tags: ['atelier', 'workshop'],
      service: {
        service_type: 'workshop',
        duration: 120,
        location_type: 'hybrid',
      },
    },
    is_public: true,
    usage_count: 0,
  },
  
  // Course
  {
    name: 'Cours Débutant',
    description: 'Template pour un cours niveau débutant',
    product_type: 'course',
    category: 'general',
    icon: '📖',
    template_data: {
      name: 'Mon Cours',
      description: 'Description de votre cours...',
      price: 30000,
      currency: 'XOF',
      tags: ['cours', 'formation'],
      course: {
        level: 'beginner',
        language: 'fr',
        certificate_enabled: true,
      },
    },
    is_public: true,
    usage_count: 0,
  },
  
  // Artist
  {
    name: 'Œuvre Originale',
    description: 'Template pour une œuvre d\'art originale',
    product_type: 'artist',
    category: 'visual_artist',
    icon: '🎨',
    template_data: {
      name: 'Mon Œuvre',
      description: 'Description de votre œuvre...',
      price: 100000,
      currency: 'XOF',
      tags: ['art', 'original'],
      artist: {
        artist_type: 'visual_artist',
        edition_type: 'original',
      },
    },
    is_public: true,
    usage_count: 0,
  },
  {
    name: 'Livre/Écrit',
    description: 'Template pour un livre ou écrit',
    product_type: 'artist',
    category: 'writer',
    icon: '📝',
    template_data: {
      name: 'Mon Livre',
      description: 'Description de votre livre...',
      price: 15000,
      currency: 'XOF',
      tags: ['livre', 'écrit'],
      artist: {
        artist_type: 'writer',
        edition_type: 'limited_edition',
      },
    },
    is_public: true,
    usage_count: 0,
  },
];

/**
 * Récupérer tous les templates disponibles
 */
export async function getProductTemplates(
  productType?: ProductType,
  includePrivate: boolean = false
): Promise<ProductTemplate[]> {
  try {
    let query = supabase
      .from('product_templates')
      .select('*')
      .order('usage_count', { ascending: false });

    if (productType) {
      query = query.eq('product_type', productType);
    }

    if (!includePrivate) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Si pas de templates en BDD, retourner les templates prédéfinis
    if (!data || data.length === 0) {
      return PREDEFINED_TEMPLATES.map((template, index) => ({
        ...template,
        id: `predefined-${index}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) as ProductTemplate[];
    }

    return data as ProductTemplate[];
  } catch (error: any) {
    logger.error('Error fetching product templates', { error: error.message });
    // En cas d'erreur, retourner les templates prédéfinis
    return PREDEFINED_TEMPLATES.map((template, index) => ({
      ...template,
      id: `predefined-${index}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as ProductTemplate[];
  }
}

/**
 * Créer un produit à partir d'un template
 */
export async function createProductFromTemplate(
  templateId: string,
  storeId: string,
  customizations?: Partial<ProductTemplate['template_data']>
): Promise<{ success: boolean; productId?: string; error?: string }> {
  try {
    // Récupérer le template
    const templates = await getProductTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Fusionner les données du template avec les personnalisations
    const productData = {
      ...template.template_data,
      ...customizations,
      store_id: storeId,
      product_type: template.product_type,
    };

    // Créer le produit selon le type
    let productId: string;

    switch (template.product_type) {
      case 'digital':
        // Créer un produit digital
        const { data: digitalProduct, error: digitalError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: productData.name || 'Nouveau produit digital',
            description: productData.description || '',
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            product_type: 'digital',
            category_id: productData.category,
            tags: productData.tags || [],
            is_active: false, // Brouillon par défaut
          })
          .select('id')
          .single();

        if (digitalError) throw digitalError;
        productId = digitalProduct.id;
        break;

      case 'physical':
        // Créer un produit physique
        const { data: physicalProduct, error: physicalError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: productData.name || 'Nouveau produit physique',
            description: productData.description || '',
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            product_type: 'physical',
            category_id: productData.category,
            tags: productData.tags || [],
            is_active: false,
          })
          .select('id')
          .single();

        if (physicalError) throw physicalError;
        productId = physicalProduct.id;
        break;

      case 'service':
        // Créer un service
        const { data: serviceProduct, error: serviceError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: productData.name || 'Nouveau service',
            description: productData.description || '',
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            product_type: 'service',
            category_id: productData.category,
            tags: productData.tags || [],
            is_active: false,
          })
          .select('id')
          .single();

        if (serviceError) throw serviceError;
        productId = serviceProduct.id;
        break;

      case 'course':
        // Créer un cours
        const { data: courseProduct, error: courseError } = await supabase
          .from('courses')
          .insert({
            store_id: storeId,
            title: productData.name || 'Nouveau cours',
            description: productData.description || '',
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            level: productData.course?.level || 'beginner',
            language: productData.course?.language || 'fr',
            is_active: false,
          })
          .select('id')
          .single();

        if (courseError) throw courseError;
        productId = courseProduct.id;
        break;

      case 'artist':
        // Créer un produit artiste
        const { data: artistProduct, error: artistError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: productData.name || 'Nouvelle œuvre',
            description: productData.description || '',
            price: productData.price || 0,
            currency: productData.currency || 'XOF',
            product_type: 'artist',
            category_id: productData.category,
            tags: productData.tags || [],
            is_active: false,
          })
          .select('id')
          .single();

        if (artistError) throw artistError;
        productId = artistProduct.id;
        break;

      default:
        return { success: false, error: 'Invalid product type' };
    }

    // Incrémenter le compteur d'utilisation du template
    await incrementTemplateUsage(templateId);

    logger.info('Product created from template', { templateId, productId, productType: template.product_type });

    return { success: true, productId };
  } catch (error: any) {
    logger.error('Error creating product from template', { error: error.message, templateId });
    return { success: false, error: error.message };
  }
}

/**
 * Incrémenter le compteur d'utilisation d'un template
 */
async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    // Si c'est un template prédéfini, ne rien faire
    if (templateId.startsWith('predefined-')) {
      return;
    }

    await supabase.rpc('increment_template_usage', { template_id: templateId });
  } catch (error) {
    logger.warn('Error incrementing template usage', { error, templateId });
  }
}

/**
 * Sauvegarder un template personnalisé
 */
export async function saveProductTemplate(
  template: Omit<ProductTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count'>,
  userId: string
): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('product_templates')
      .insert({
        ...template,
        created_by: userId,
        usage_count: 0,
      })
      .select('id')
      .single();

    if (error) throw error;

    return { success: true, templateId: data.id };
  } catch (error: any) {
    logger.error('Error saving product template', { error: error.message });
    return { success: false, error: error.message };
  }
}

