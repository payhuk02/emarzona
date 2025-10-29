/**
 * Hook pour appliquer un template à un formulaire de produit
 * Gère la fusion intelligente des données
 */

import { Template } from '@/types/templates';
import { useToast } from '@/hooks/use-toast';

interface ApplyTemplateOptions {
  overwrite?: boolean; // Écraser les données existantes
  mergeMode?: 'replace' | 'merge' | 'smart'; // Mode de fusion
}

export const useTemplateApplier = () => {
  const { toast } = useToast();

  const applyTemplate = (
    template: Template,
    currentFormData: any,
    options: ApplyTemplateOptions = {}
  ) => {
    const { overwrite = false, mergeMode = 'smart' } = options;

    try {
      const appliedData = { ...currentFormData };
      const templateData = template.data;

      // Appliquer les informations de base
      if (templateData.basicInfo) {
        Object.keys(templateData.basicInfo).forEach((key) => {
          const value = (templateData.basicInfo as any)[key];
          if (value !== undefined) {
            if (overwrite || !appliedData[key] || mergeMode === 'replace') {
              appliedData[key] = value;
            } else if (mergeMode === 'smart') {
              // Mode smart : garde les données existantes si non vides
              if (!appliedData[key] || appliedData[key] === '' || appliedData[key] === 0) {
                appliedData[key] = value;
              }
            }
          }
        });
      }

      // Appliquer les visuels
      if (templateData.visuals) {
        if (overwrite || !appliedData.image_url) {
          appliedData.image_placeholders = templateData.visuals.image_placeholders;
        }
        if (overwrite || !appliedData.gallery_images?.length) {
          appliedData.gallery_placeholders = templateData.visuals.gallery_placeholders;
        }
      }

      // Appliquer SEO
      if (templateData.seo) {
        Object.keys(templateData.seo).forEach((key) => {
          const value = (templateData.seo as any)[key];
          if (value !== undefined) {
            const seoKey = key === 'og_settings' ? 'og_title' : key;
            if (overwrite || !appliedData[seoKey]) {
              if (key === 'og_settings') {
                appliedData.og_title = value.title;
                appliedData.og_description = value.description;
              } else {
                appliedData[seoKey] = value;
              }
            }
          }
        });
      }

      // Appliquer FAQs
      if (templateData.faqs && templateData.faqs.length > 0) {
        if (overwrite || !appliedData.faqs?.length) {
          appliedData.faqs = templateData.faqs;
        } else if (mergeMode === 'merge') {
          appliedData.faqs = [...appliedData.faqs, ...templateData.faqs];
        }
      }

      // Appliquer données spécifiques Digital
      if (templateData.digital) {
        Object.keys(templateData.digital).forEach((key) => {
          const value = (templateData.digital as any)[key];
          if (value !== undefined && (overwrite || !appliedData[key])) {
            appliedData[key] = value;
          }
        });
      }

      // Appliquer données spécifiques Physical
      if (templateData.physical) {
        Object.keys(templateData.physical).forEach((key) => {
          const value = (templateData.physical as any)[key];
          if (value !== undefined && (overwrite || !appliedData[key])) {
            appliedData[key] = value;
          }
        });
      }

      // Appliquer données spécifiques Service
      if (templateData.service) {
        Object.keys(templateData.service).forEach((key) => {
          const value = (templateData.service as any)[key];
          if (value !== undefined && (overwrite || !appliedData[key])) {
            appliedData[key] = value;
          }
        });
      }

      // Appliquer données spécifiques Course
      if (templateData.course) {
        Object.keys(templateData.course).forEach((key) => {
          const value = (templateData.course as any)[key];
          if (value !== undefined && (overwrite || !appliedData[key])) {
            appliedData[key] = value;
          }
        });
      }

      // Appliquer affiliation
      if (templateData.affiliate) {
        appliedData.affiliate_enabled = templateData.affiliate.enabled;
        if (templateData.affiliate.commission_rate) {
          appliedData.commission_rate = templateData.affiliate.commission_rate;
        }
        if (templateData.affiliate.commission_type) {
          appliedData.commission_type = templateData.affiliate.commission_type;
        }
      }

      // Appliquer tracking
      if (templateData.tracking) {
        Object.keys(templateData.tracking).forEach((key) => {
          const value = (templateData.tracking as any)[key];
          if (value !== undefined && (overwrite || appliedData[key] === undefined)) {
            appliedData[key] = value;
          }
        });
      }

      toast({
        title: 'Template appliqué ! ✨',
        description: `Le template "${template.metadata.name}" a été appliqué avec succès. Personnalisez maintenant les données à votre convenance.`,
      });

      return appliedData;
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'application du template.',
        variant: 'destructive',
      });
      return currentFormData;
    }
  };

  const exportAsTemplate = (formData: any, metadata: Partial<Template['metadata']>): Template => {
    // Créer un template personnalisé à partir des données du formulaire
    const template: Template = {
      metadata: {
        id: `custom-${Date.now()}`,
        name: metadata.name || 'Mon Template',
        description: metadata.description || 'Template personnalisé',
        category: metadata.category || 'ebook',
        productType: metadata.productType || 'digital',
        author: 'Utilisateur',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        downloads: 0,
        rating: 5.0,
        thumbnail: formData.image_url || '',
        preview_images: formData.gallery_images || [],
        tags: metadata.tags || [],
        premium: false,
      },
      data: {
        basicInfo: {
          name_template: formData.name,
          description_template: formData.description,
          short_description_template: formData.short_description,
          category: formData.category,
          pricing_model: formData.pricing_model,
          price: formData.price,
          currency: formData.currency,
          features: formData.features,
          specifications: formData.specifications,
        },
        visuals: {
          image_placeholders: formData.images || [],
          gallery_placeholders: formData.gallery_images || [],
          video_url_template: formData.video_url,
        },
        seo: {
          meta_title_template: formData.meta_title,
          meta_description_template: formData.meta_description,
          meta_keywords: formData.meta_keywords?.split(',') || [],
        },
        faqs: formData.faqs || [],
      },
    };

    return template;
  };

  return {
    applyTemplate,
    exportAsTemplate,
  };
};

