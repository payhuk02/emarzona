/**
 * 🚀 SAAS COMPLETE TEMPLATE V2 - PREMIUM
 * Complete B2B SaaS template with dashboard, pricing, and enterprise features
 * 
 * Design Inspiration: Salesforce, HubSpot, Monday.com
 * Best for: B2B SaaS, enterprise software, business tools
 * Tier: PREMIUM
 */

import { TemplateV2 } from '@/types/templates-v2';

export const saasCompleteTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-saas-complete-v2',
    slug: 'saas-complete-premium',
    version: '2.0.0',
    name: 'SaaS Complete - Premium',
    description: 'Enterprise-grade SaaS template with everything you need: dashboard preview, advanced pricing, ROI calculator, case studies, security certifications, and more.',
    shortDescription: 'Complete B2B SaaS template with enterprise features',
    
    productType: 'digital',
    category: 'saas',
    tags: ['saas', 'b2b', 'enterprise', 'premium', 'complete'],
    industry: ['technology', 'software', 'business'],
    
    tier: 'premium',
    status: 'published',
    price: 49,
    currency: 'EUR',
    
    designStyle: 'professional',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Premium license - includes lifetime updates',
    },
    
    thumbnail: '/templates/v2/digital/saas-complete-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/saas-complete-preview-1.jpg',
      '/templates/v2/digital/saas-complete-preview-2.jpg',
      '/templates/v2/digital/saas-complete-preview-3.jpg',
      '/templates/v2/digital/saas-complete-preview-4.jpg',
      '/templates/v2/digital/saas-complete-preview-5.jpg',
    ],
    previewVideo: '/templates/v2/digital/saas-complete-demo.mp4',
    demoUrl: 'https://demo.payhula.com/templates/saas-complete',
    
    createdAt: '2025-10-29T00:00:00Z',
    updatedAt: '2025-10-29T00:00:00Z',
    publishedAt: '2025-10-29T00:00:00Z',
    
    analytics: {
      views: 0,
      downloads: 0,
      installs: 0,
      rating: 5.0,
      ratingsCount: 0,
      favorites: 0,
    },
    
    compatibility: {
      minVersion: '2.0.0',
    },
    
    seo: {
      title: 'SaaS Complete Premium Template - Enterprise-Ready',
      description: 'Complete B2B SaaS template with dashboard, pricing calculator, case studies, and enterprise features. Premium quality.',
      keywords: ['saas template', 'b2b saas', 'enterprise software', 'premium template'],
    },
    
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'fr',
    
    features: [
      'Complete dashboard preview',
      'Advanced pricing calculator',
      'ROI calculator',
      'Case studies section',
      'Security certifications',
      'Compliance badges (SOC2, GDPR, ISO)',
      'Multi-tier pricing (4 plans)',
      'Feature comparison table',
      'Video testimonials',
      'Live demo scheduler',
      'API documentation',
      'Enterprise contact form',
      'Trust indicators',
      'Migration assistance section',
    ],
    
    highlights: [
      'Enterprise-ready',
      'Conversion-optimized',
      'Premium quality',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#2563EB',
        secondary: '#3B82F6',
        accent: '#10B981',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: {
          heading: 'Inter, sans-serif',
          body: 'Inter, sans-serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.75rem',
          '3xl': '2.25rem',
          '4xl': '3rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.7,
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'productName', type: 'string', label: 'Product Name', defaultValue: 'YourSaaS', required: true, category: 'Basic' },
        { key: 'tagline', type: 'string', label: 'Tagline', defaultValue: 'The complete business solution', required: true, category: 'Basic' },
        { key: 'starterPrice', type: 'number', label: 'Starter Price', defaultValue: 49, category: 'Pricing' },
        { key: 'businessPrice', type: 'number', label: 'Business Price', defaultValue: 99, category: 'Pricing' },
        { key: 'enterprisePrice', type: 'string', label: 'Enterprise Price', defaultValue: 'Custom', category: 'Pricing' },
      ],
    },
    
    content: {
      default: {
        hero: {
          headline: '{{ productName }}',
          tagline: '{{ tagline }}',
          description: 'Streamline your business operations with our all-in-one platform',
          ctaPrimary: 'Start Free Trial',
          ctaSecondary: 'Schedule Demo',
          trustBadges: ['SOC 2 Certified', 'GDPR Compliant', '99.9% Uptime'],
        },
        
        sections: [
          'hero',
          'trusted-by',
          'features',
          'dashboard-preview',
          'pricing',
          'case-studies',
          'testimonials',
          'security',
          'cta',
        ],
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-enterprise', name: 'Hero', enabled: true, order: 0 },
      { id: 'trusted-by', type: 'logo-cloud', name: 'Trusted By', enabled: true, order: 1 },
      { id: 'features', type: 'features-detailed', name: 'Features', enabled: true, order: 2 },
      { id: 'dashboard', type: 'dashboard-tabs', name: 'Dashboard Preview', enabled: true, order: 3 },
      { id: 'pricing', type: 'pricing-advanced', name: 'Pricing', enabled: true, order: 4 },
      { id: 'case-studies', type: 'case-studies', name: 'Case Studies', enabled: true, order: 5 },
      { id: 'testimonials', type: 'testimonials-video', name: 'Testimonials', enabled: true, order: 6 },
      { id: 'security', type: 'security-certifications', name: 'Security', enabled: true, order: 7 },
      { id: 'cta-final', type: 'cta-enterprise', name: 'Final CTA', enabled: true, order: 8 },
    ],
    
    digitalSettings: {
      fileTypes: ['web-app'],
      licenseManagement: {
        enabled: true,
        type: 'subscription',
      },
      downloadSettings: {
        maxDownloads: -1, // unlimited
      },
      versionControl: {
        enabled: true,
        autoUpdate: true,
        notifyCustomers: true,
      },
      security: {
        drmEnabled: true,
        encryptionLevel: 'advanced',
      },
    },
  },
};

export default saasCompleteTemplate;

