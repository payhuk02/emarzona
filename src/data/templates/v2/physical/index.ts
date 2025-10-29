/**
 * 📦 PHYSICAL PRODUCTS TEMPLATES V2 - INDEX
 * All physical product templates
 */

import fashionApparelTemplate from './fashion-apparel';
import electronicsGadgetsTemplate from './electronics-gadgets';
import cosmeticsBeautyTemplate from './cosmetics-beauty';
import jewelryAccessoriesTemplate from './jewelry-accessories';
import furnitureHomeDecorTemplate from './furniture-home-decor';
import foodBeverageTemplate from './food-beverage';
import booksPublishingTemplate from './books-publishing';

// Export all physical templates
export const physicalTemplatesV2 = [
  fashionApparelTemplate,
  electronicsGadgetsTemplate,
  cosmeticsBeautyTemplate,
  jewelryAccessoriesTemplate,
  furnitureHomeDecorTemplate,
  foodBeverageTemplate,
  booksPublishingTemplate,
];

// Export individual templates
export {
  fashionApparelTemplate,
  electronicsGadgetsTemplate,
  cosmeticsBeautyTemplate,
  jewelryAccessoriesTemplate,
  furnitureHomeDecorTemplate,
  foodBeverageTemplate,
  booksPublishingTemplate,
};

// Stats
export const physicalTemplatesStats = {
  total: physicalTemplatesV2.length,
  free: physicalTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: physicalTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
  byCategory: {
    fashion: physicalTemplatesV2.filter(t => t.metadata.category === 'fashion-apparel').length,
    electronics: physicalTemplatesV2.filter(t => t.metadata.category === 'electronics').length,
    beauty: physicalTemplatesV2.filter(t => t.metadata.category === 'beauty-cosmetics').length,
    jewelry: physicalTemplatesV2.filter(t => t.metadata.category === 'jewelry-accessories').length,
    furniture: physicalTemplatesV2.filter(t => t.metadata.category === 'furniture-home-decor').length,
    food: physicalTemplatesV2.filter(t => t.metadata.category === 'food-beverage').length,
    books: physicalTemplatesV2.filter(t => t.metadata.category === 'books-publishing').length,
  },
};

export default physicalTemplatesV2;

