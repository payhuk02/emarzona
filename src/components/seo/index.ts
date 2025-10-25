/**
 * Barrel Export: Composants SEO
 * Description: Export centralisé de tous les composants SEO
 */

export { SEOMeta, type SEOMetaProps } from './SEOMeta';
export { ProductSchema } from './ProductSchema';
export { StoreSchema } from './StoreSchema';
export { BreadcrumbSchema, type BreadcrumbItem } from './BreadcrumbSchema';
export { WebsiteSchema } from './WebsiteSchema';

// Export par défaut d'un objet contenant tous les composants
export default {
  SEOMeta: require('./SEOMeta').SEOMeta,
  ProductSchema: require('./ProductSchema').ProductSchema,
  StoreSchema: require('./StoreSchema').StoreSchema,
  BreadcrumbSchema: require('./BreadcrumbSchema').BreadcrumbSchema,
  WebsiteSchema: require('./WebsiteSchema').WebsiteSchema,
};

