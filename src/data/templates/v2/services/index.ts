/**
 * 🛎️ SERVICES TEMPLATES V2 - INDEX
 * Top 5 Elite Service Templates - ULTRA PRO
 */

import personalCoachingTemplate from './personal-coaching';
import therapyCounselingTemplate from './therapy-counseling';
import photographyTemplate from './photography';
import legalServicesTemplate from './legal-services';
import creativeAgencyTemplate from './creative-agency';

// Export all service templates (Top 5 Elite)
export const servicesTemplatesV2 = [
  personalCoachingTemplate,
  therapyCounselingTemplate,
  photographyTemplate,
  legalServicesTemplate,
  creativeAgencyTemplate,
];

// Export individual templates
export {
  personalCoachingTemplate,
  therapyCounselingTemplate,
  photographyTemplate,
  legalServicesTemplate,
  creativeAgencyTemplate,
};

// Stats
export const servicesTemplatesStats = {
  total: servicesTemplatesV2.length,
  free: servicesTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: servicesTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
  bySubCategory: {
    'coaching': 1,
    'therapy': 1,
    'photography': 1,
    'legal': 1,
    'creative': 1,
  },
};

export default servicesTemplatesV2;

