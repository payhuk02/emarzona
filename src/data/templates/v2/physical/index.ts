/**
 * 📦 PHYSICAL PRODUCTS TEMPLATES V2 - INDEX
 * Top 5 Elite Physical Templates - ULTRA PRO
 */

import fashionApparelTemplate from './fashion-apparel';
import electronicsGadgetsTemplate from './electronics-gadgets';
import jewelryAccessoriesTemplate from './jewelry-accessories';
import homeGardenTemplate from './home-garden';
import healthWellnessTemplate from './health-wellness';

// Export all physical templates (Top 5 Elite)
export const physicalTemplatesV2 = [
  fashionApparelTemplate,
  electronicsGadgetsTemplate,
  jewelryAccessoriesTemplate,
  homeGardenTemplate,
  healthWellnessTemplate,
];

// Export individual templates
export {
  fashionApparelTemplate,
  electronicsGadgetsTemplate,
  jewelryAccessoriesTemplate,
  homeGardenTemplate,
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
    'jewelry-accessories': 1,
    'home-garden': 1,
    'health-wellness': 1,
  },
  byIndustry: {
    'fashion': 1,
    'technology': 1,
    'luxury': 1,
    'home': 1,
    'health-wellness': 1,
  },
};

export default physicalTemplatesV2;

