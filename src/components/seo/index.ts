/**
 * Barrel Export: Composants SEO
 * Description: Export centralisé de tous les composants SEO
 */

import { SEOMeta } from './SEOMeta';
import { ProductSchema } from './ProductSchema';
import { StoreSchema } from './StoreSchema';
import { BreadcrumbSchema } from './BreadcrumbSchema';
import { WebsiteSchema } from './WebsiteSchema';

export { SEOMeta, type SEOMetaProps } from './SEOMeta';
export { ProductSchema } from './ProductSchema';
export { StoreSchema } from './StoreSchema';
export { BreadcrumbSchema, type BreadcrumbItem } from './BreadcrumbSchema';
export { WebsiteSchema } from './WebsiteSchema';

// Export par défaut d'un objet contenant tous les composants
export default {
  SEOMeta,
  ProductSchema,
  StoreSchema,
  BreadcrumbSchema,
  WebsiteSchema,
};

