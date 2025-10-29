/**
 * Template System - Index
 * Point d'entrée pour tous les templates
 */

import { Template, ProductType, TemplateCategory } from '@/types/templates';
import { DIGITAL_TEMPLATES } from './digital-templates';
import { PHYSICAL_TEMPLATES } from './physical-templates';
import { SERVICE_TEMPLATES } from './service-templates';
import { COURSE_TEMPLATES } from './course-templates';

// Tous les templates combinés
export const ALL_TEMPLATES: Template[] = [
  ...DIGITAL_TEMPLATES,
  ...PHYSICAL_TEMPLATES,
  ...SERVICE_TEMPLATES,
  ...COURSE_TEMPLATES,
];

// Obtenir templates par type de produit
export const getTemplatesByProductType = (productType: ProductType): Template[] => {
  return ALL_TEMPLATES.filter(t => t.metadata.productType === productType);
};

// Obtenir templates par catégorie
export const getTemplatesByCategory = (category: TemplateCategory): Template[] => {
  return ALL_TEMPLATES.filter(t => t.metadata.category === category);
};

// Obtenir un template par ID
export const getTemplateById = (id: string): Template | undefined => {
  return ALL_TEMPLATES.find(t => t.metadata.id === id);
};

// Rechercher templates
export const searchTemplates = (query: string): Template[] => {
  const lowerQuery = query.toLowerCase();
  return ALL_TEMPLATES.filter(t =>
    t.metadata.name.toLowerCase().includes(lowerQuery) ||
    t.metadata.description.toLowerCase().includes(lowerQuery) ||
    t.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Templates gratuits uniquement
export const getFreeTemplates = (): Template[] => {
  return ALL_TEMPLATES.filter(t => !t.metadata.premium);
};

// Templates premium uniquement
export const getPremiumTemplates = (): Template[] => {
  return ALL_TEMPLATES.filter(t => t.metadata.premium);
};

// Templates populaires (par nombre de téléchargements)
export const getPopularTemplates = (limit: number = 10): Template[] => {
  return [...ALL_TEMPLATES]
    .sort((a, b) => b.metadata.downloads - a.metadata.downloads)
    .slice(0, limit);
};

// Templates par note
export const getTopRatedTemplates = (limit: number = 10): Template[] => {
  return [...ALL_TEMPLATES]
    .sort((a, b) => b.metadata.rating - a.metadata.rating)
    .slice(0, limit);
};

// Export des templates individuels
export { DIGITAL_TEMPLATES, PHYSICAL_TEMPLATES, SERVICE_TEMPLATES, COURSE_TEMPLATES };

