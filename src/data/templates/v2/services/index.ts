/**
 * 🛎️ SERVICES TEMPLATES V2 - INDEX
 * All 10 service templates - COMPLETE
 */

import businessConsultingTemplate from './business-consulting';
import personalCoachingTemplate from './personal-coaching';
import therapyCounselingTemplate from './therapy-counseling';
import homeRepairTemplate from './home-repair';
import eventPlanningTemplate from './event-planning';
import photographyTemplate from './photography';
import tutoringTemplate from './tutoring';
import spaWellnessTemplate from './spa-wellness';
import legalServicesTemplate from './legal-services';
import creativeAgencyTemplate from './creative-agency';

// Export all service templates
export const servicesTemplatesV2 = [
  businessConsultingTemplate,
  personalCoachingTemplate,
  therapyCounselingTemplate,
  homeRepairTemplate,
  eventPlanningTemplate,
  photographyTemplate,
  tutoringTemplate,
  spaWellnessTemplate,
  legalServicesTemplate,
  creativeAgencyTemplate,
];

// Export individual templates
export {
  businessConsultingTemplate,
  personalCoachingTemplate,
  therapyCounselingTemplate,
  homeRepairTemplate,
  eventPlanningTemplate,
  photographyTemplate,
  tutoringTemplate,
  spaWellnessTemplate,
  legalServicesTemplate,
  creativeAgencyTemplate,
};

// Stats
export const servicesTemplatesStats = {
  total: servicesTemplatesV2.length,
  free: servicesTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: servicesTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
  bySubCategory: {
    'consulting': 1,
    'coaching': 1,
    'therapy': 1,
    'home-services': 1,
    'events': 1,
    'photography': 1,
    'education': 1,
    'wellness': 1,
    'legal': 1,
    'creative': 1,
  },
};

export default servicesTemplatesV2;

