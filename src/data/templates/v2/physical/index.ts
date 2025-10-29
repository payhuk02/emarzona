/**
 * 📦 PHYSICAL PRODUCTS TEMPLATES V2 - INDEX
 * All 15 physical product templates - COMPLETE
 */

import fashionApparelTemplate from './fashion-apparel';
import electronicsGadgetsTemplate from './electronics-gadgets';
import cosmeticsBeautyTemplate from './cosmetics-beauty';
import jewelryAccessoriesTemplate from './jewelry-accessories';
import furnitureHomeDecorTemplate from './furniture-home-decor';
import foodBeverageTemplate from './food-beverage';
import booksPublishingTemplate from './books-publishing';
import homeGardenTemplate from './home-garden';
import automotivePartsTemplate from './automotive-parts';
import petSuppliesTemplate from './pet-supplies';
import handmadeCraftsTemplate from './handmade-crafts';
import sportsEquipmentTemplate from './sports-equipment';
import toysGamesTemplate from './toys-games';
import officeSuppliesTemplate from './office-supplies';
import healthWellnessTemplate from './health-wellness';

// Export all physical templates
export const physicalTemplatesV2 = [
  fashionApparelTemplate,
  electronicsGadgetsTemplate,
  cosmeticsBeautyTemplate,
  jewelryAccessoriesTemplate,
  furnitureHomeDecorTemplate,
  foodBeverageTemplate,
  booksPublishingTemplate,
  homeGardenTemplate,
  automotivePartsTemplate,
  petSuppliesTemplate,
  handmadeCraftsTemplate,
  sportsEquipmentTemplate,
  toysGamesTemplate,
  officeSuppliesTemplate,
  healthWellnessTemplate,
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
  homeGardenTemplate,
  automotivePartsTemplate,
  petSuppliesTemplate,
  handmadeCraftsTemplate,
  sportsEquipmentTemplate,
  toysGamesTemplate,
  officeSuppliesTemplate,
  healthWellnessTemplate,
};

// Stats
export const physicalTemplatesStats = {
  total: physicalTemplatesV2.length,
  free: physicalTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: physicalTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
  bySubCategory: {
    'fashion-apparel': 1,
    'electronics': 1,
    'beauty-cosmetics': 1,
    'jewelry-accessories': 1,
    'furniture-home-decor': 1,
    'food-beverage': 1,
    'books-publishing': 1,
    'home-garden': 1,
    'automotive': 1,
    'pets': 1,
    'handmade': 1,
    'sports': 1,
    'toys-games': 1,
    'office': 1,
    'health-wellness': 1,
  },
  byIndustry: {
    'fashion': 1,
    'technology': 1,
    'beauty': 1,
    'luxury': 1,
    'home': 2, // home-decor + home-garden
    'food': 1,
    'publishing': 1,
    'automotive': 1,
    'pets': 1,
    'crafts-art': 1,
    'sports-fitness': 1,
    'toys-entertainment': 1,
    'office-business': 1,
    'health-wellness': 1,
  },
};

export default physicalTemplatesV2;

