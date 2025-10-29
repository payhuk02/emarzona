/**
 * 🛎️ SERVICES TEMPLATES V2 - INDEX
 * All service templates (10 total)
 */

import businessConsultingTemplate from './business-consulting';

// Temporary: Export what we have
export const servicesTemplatesV2 = [
  businessConsultingTemplate,
  // More templates to be added
];

export {
  businessConsultingTemplate,
};

export const servicesTemplatesStats = {
  total: servicesTemplatesV2.length,
  targetTotal: 10,
  free: servicesTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: servicesTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
};

export default servicesTemplatesV2;

