/**
 * 🎓 COURSES TEMPLATES V2 - INDEX
 * All 10 course templates - COMPLETE
 */

import codingBootcampTemplate from './coding-bootcamp';
import businessCourseTemplate from './business-course';
import languageLearningTemplate from './language-learning';
import fitnessTrainingTemplate from './fitness-training';
import creativeSkillsTemplate from './creative-skills';
import marketingCourseTemplate from './marketing-course';
import dataScienceTemplate from './data-science';
import musicProductionTemplate from './music-production';
import professionalCertificationTemplate from './professional-certification';
import executiveMBATemplate from './executive-mba';

// Export all course templates
export const coursesTemplatesV2 = [
  codingBootcampTemplate,
  businessCourseTemplate,
  languageLearningTemplate,
  fitnessTrainingTemplate,
  creativeSkillsTemplate,
  marketingCourseTemplate,
  dataScienceTemplate,
  musicProductionTemplate,
  professionalCertificationTemplate,
  executiveMBATemplate,
];

// Export individual templates
export {
  codingBootcampTemplate,
  businessCourseTemplate,
  languageLearningTemplate,
  fitnessTrainingTemplate,
  creativeSkillsTemplate,
  marketingCourseTemplate,
  dataScienceTemplate,
  musicProductionTemplate,
  professionalCertificationTemplate,
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
    'fitness': 1,
    'creative': 1,
    'marketing': 1,
    'data-science': 1,
    'music': 1,
    'certification': 1,
    'executive-education': 1,
  },
};

export default coursesTemplatesV2;

