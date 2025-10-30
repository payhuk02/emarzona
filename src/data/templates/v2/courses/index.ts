/**
 * 🎓 COURSES TEMPLATES V2 - INDEX
 * Top 5 Elite Course Templates - ULTRA PRO
 */

import codingBootcampTemplate from './coding-bootcamp';
import businessCourseTemplate from './business-course';
import languageLearningTemplate from './language-learning';
import dataScienceTemplate from './data-science';
import executiveMBATemplate from './executive-mba';

// Export all course templates (Top 5 Elite)
export const coursesTemplatesV2 = [
  codingBootcampTemplate,
  businessCourseTemplate,
  languageLearningTemplate,
  dataScienceTemplate,
  executiveMBATemplate,
];

// Export individual templates
export {
  codingBootcampTemplate,
  businessCourseTemplate,
  languageLearningTemplate,
  dataScienceTemplate,
  executiveMBATemplate,
};

// Stats
export const coursesTemplatesStats = {
  total: coursesTemplatesV2.length,
  free: coursesTemplatesV2.filter(t => t.metadata.tier === 'free').length,
  premium: coursesTemplatesV2.filter(t => t.metadata.tier === 'premium').length,
  bySubCategory: {
    'coding': 1,
    'business': 1,
    'languages': 1,
    'data-science': 1,
    'executive-education': 1,
  },
};

export default coursesTemplatesV2;
