/**
 * 📦 DIGITAL PRODUCTS TEMPLATES V2 - INDEX
 * Export all 15 digital product templates
 * 
 * @version 2.0.0
 * @author Payhula Team
 * @date 2025-10-29
 */

// FREE TEMPLATES (10)
import ebookMinimalTemplate from './ebook-minimal';
import softwareModernTemplate from './software-modern';
import courseBundleTemplate from './course-bundle';
import musicAudioTemplate from './music-audio';
import videoContentTemplate from './video-content';
import graphicPackTemplate from './graphic-pack';
import appPluginTemplate from './app-plugin';
import photographyPackTemplate from './photography-pack';
import fontCollectionTemplate from './font-collection';
import codeTemplateTemplate from './code-template';

// PREMIUM TEMPLATES (5)
import saasCompleteTemplate from './saas-complete';
import creatorBundlePremiumTemplate from './creator-bundle-premium';
import ultimateEbookPremiumTemplate from './ultimate-ebook-premium';
import enterpriseSoftwarePremiumTemplate from './enterprise-software-premium';
import membershipSitePremiumTemplate from './membership-site-premium';

// ============================================================================
// INDIVIDUAL EXPORTS
// ============================================================================

export {
  // Free
  ebookMinimalTemplate,
  softwareModernTemplate,
  courseBundleTemplate,
  musicAudioTemplate,
  videoContentTemplate,
  graphicPackTemplate,
  appPluginTemplate,
  photographyPackTemplate,
  fontCollectionTemplate,
  codeTemplateTemplate,
  // Premium
  saasCompleteTemplate,
  creatorBundlePremiumTemplate,
  ultimateEbookPremiumTemplate,
  enterpriseSoftwarePremiumTemplate,
  membershipSitePremiumTemplate,
};

// ============================================================================
// ARRAY EXPORT
// ============================================================================

export const digitalTemplatesV2 = [
  // Free
  ebookMinimalTemplate,
  softwareModernTemplate,
  courseBundleTemplate,
  musicAudioTemplate,
  videoContentTemplate,
  graphicPackTemplate,
  appPluginTemplate,
  photographyPackTemplate,
  fontCollectionTemplate,
  codeTemplateTemplate,
  // Premium
  saasCompleteTemplate,
  creatorBundlePremiumTemplate,
  ultimateEbookPremiumTemplate,
  enterpriseSoftwarePremiumTemplate,
  membershipSitePremiumTemplate,
];

// ============================================================================
// BY CATEGORY
// ============================================================================

export const digitalTemplatesByCategory = {
  ebook: [ebookMinimalTemplate, ultimateEbookPremiumTemplate],
  software: [softwareModernTemplate, appPluginTemplate, enterpriseSoftwarePremiumTemplate],
  saas: [saasCompleteTemplate, softwareModernTemplate, membershipSitePremiumTemplate],
  app: [appPluginTemplate],
  music: [musicAudioTemplate],
  video: [videoContentTemplate],
  graphic: [graphicPackTemplate],
  photo: [photographyPackTemplate],
  font: [fontCollectionTemplate],
  code: [codeTemplateTemplate],
  template: [creatorBundlePremiumTemplate],
};

// ============================================================================
// BY TIER
// ============================================================================

export const digitalTemplatesByTier = {
  free: [
    ebookMinimalTemplate,
    softwareModernTemplate,
    courseBundleTemplate,
    musicAudioTemplate,
    videoContentTemplate,
    graphicPackTemplate,
    appPluginTemplate,
    photographyPackTemplate,
    fontCollectionTemplate,
    codeTemplateTemplate,
  ],
  premium: [
    saasCompleteTemplate,
    creatorBundlePremiumTemplate,
    ultimateEbookPremiumTemplate,
    enterpriseSoftwarePremiumTemplate,
    membershipSitePremiumTemplate,
  ],
};

// ============================================================================
// BY DESIGN STYLE
// ============================================================================

export const digitalTemplatesByStyle = {
  minimal: [ebookMinimalTemplate, fontCollectionTemplate],
  modern: [softwareModernTemplate, videoContentTemplate, appPluginTemplate, codeTemplateTemplate, membershipSitePremiumTemplate],
  professional: [saasCompleteTemplate, courseBundleTemplate, enterpriseSoftwarePremiumTemplate],
  creative: [musicAudioTemplate, graphicPackTemplate, creatorBundlePremiumTemplate],
  luxury: [ultimateEbookPremiumTemplate],
  elegant: [photographyPackTemplate],
};

// ============================================================================
// BY INDUSTRY
// ============================================================================

export const digitalTemplatesByIndustry = {
  education: [courseBundleTemplate, ultimateEbookPremiumTemplate],
  technology: [softwareModernTemplate, appPluginTemplate, enterpriseSoftwarePremiumTemplate, codeTemplateTemplate],
  creative: [graphicPackTemplate, photographyPackTemplate, fontCollectionTemplate, musicAudioTemplate],
  business: [saasCompleteTemplate, enterpriseSoftwarePremiumTemplate],
  entertainment: [musicAudioTemplate, videoContentTemplate],
  community: [membershipSitePremiumTemplate],
};

// ============================================================================
// STATISTICS
// ============================================================================

export const digitalTemplatesStats = {
  total: digitalTemplatesV2.length,
  free: digitalTemplatesByTier.free.length,
  premium: digitalTemplatesByTier.premium.length,
  categories: Object.keys(digitalTemplatesByCategory).length,
  styles: Object.keys(digitalTemplatesByStyle).length,
  industries: Object.keys(digitalTemplatesByIndustry).length,
  averagePrice: 58.4, // Average of premium templates
  totalValue: 292, // Sum of all premium prices
};

// ============================================================================
// FEATURED TEMPLATES
// ============================================================================

export const featuredTemplates = [
  saasCompleteTemplate,
  softwareModernTemplate,
  ultimateEbookPremiumTemplate,
  enterpriseSoftwarePremiumTemplate,
];

// ============================================================================
// NEW TEMPLATES (Recently Added)
// ============================================================================

export const newTemplates = [
  photographyPackTemplate,
  fontCollectionTemplate,
  codeTemplateTemplate,
  enterpriseSoftwarePremiumTemplate,
  membershipSitePremiumTemplate,
];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default digitalTemplatesV2;
