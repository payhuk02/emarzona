/**
 * 📦 DIGITAL PRODUCTS TEMPLATES V2 - INDEX
 * Top 5 Elite Digital Templates - ULTRA PRO
 * 
 * @version 2.0.0
 * @author Payhula Team
 * @date 2025-10-30
 */

// FREE TEMPLATES (3)
import ebookMinimalTemplate from './ebook-minimal';
import softwareModernTemplate from './software-modern';
import courseBundleTemplate from './course-bundle';

// PREMIUM TEMPLATES (2)
import saasCompleteTemplate from './saas-complete';
import membershipSitePremiumTemplate from './membership-site-premium';

// ============================================================================
// INDIVIDUAL EXPORTS
// ============================================================================

export {
  // Free
  ebookMinimalTemplate,
  softwareModernTemplate,
  courseBundleTemplate,
  // Premium
  saasCompleteTemplate,
  membershipSitePremiumTemplate,
};

// ============================================================================
// ARRAY EXPORT (Top 5 Elite)
// ============================================================================

export const digitalTemplatesV2 = [
  // Free
  ebookMinimalTemplate,
  softwareModernTemplate,
  courseBundleTemplate,
  // Premium
  saasCompleteTemplate,
  membershipSitePremiumTemplate,
];

// ============================================================================
// BY CATEGORY
// ============================================================================

export const digitalTemplatesByCategory = {
  ebook: [ebookMinimalTemplate],
  software: [softwareModernTemplate],
  saas: [saasCompleteTemplate, membershipSitePremiumTemplate],
  courses: [courseBundleTemplate],
};

// ============================================================================
// BY TIER
// ============================================================================

export const digitalTemplatesByTier = {
  free: [
    ebookMinimalTemplate,
    softwareModernTemplate,
    courseBundleTemplate,
  ],
  premium: [
    saasCompleteTemplate,
    membershipSitePremiumTemplate,
  ],
};

// ============================================================================
// BY DESIGN STYLE
// ============================================================================

export const digitalTemplatesByStyle = {
  minimal: [ebookMinimalTemplate],
  modern: [softwareModernTemplate, membershipSitePremiumTemplate],
  professional: [saasCompleteTemplate, courseBundleTemplate],
};

// ============================================================================
// BY INDUSTRY
// ============================================================================

export const digitalTemplatesByIndustry = {
  education: [courseBundleTemplate, ebookMinimalTemplate],
  technology: [softwareModernTemplate],
  business: [saasCompleteTemplate],
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
  averagePrice: 87.5, // Average of 2 premium templates (99 + 76) / 2
  totalValue: 175, // Sum of all premium prices
};

// ============================================================================
// FEATURED TEMPLATES (All Elite)
// ============================================================================

export const featuredTemplates = [
  saasCompleteTemplate,
  softwareModernTemplate,
  membershipSitePremiumTemplate,
  courseBundleTemplate,
  ebookMinimalTemplate,
];

// ============================================================================
// NEW TEMPLATES (Recently Updated)
// ============================================================================

export const newTemplates = [
  saasCompleteTemplate,
  membershipSitePremiumTemplate,
];

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default digitalTemplatesV2;
