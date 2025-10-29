/**
 * 🏢 ENTERPRISE SOFTWARE PREMIUM TEMPLATE V2
 * B2B enterprise software template with advanced features
 * 
 * Design Inspiration: Oracle, SAP, Microsoft Enterprise
 * Best for: Enterprise software, B2B solutions, corporate tools
 * Tier: PREMIUM
 */

import { TemplateV2 } from '@/types/templates-v2';

export const enterpriseSoftwarePremiumTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-enterprise-software-premium-v2',
    slug: 'enterprise-software-premium',
    version: '2.0.0',
    name: 'Enterprise Software - Premium',
    description: 'B2B enterprise template with compliance badges, security features, white-label options, and dedicated support. Perfect for large-scale business software.',
    shortDescription: 'Premium B2B enterprise software template',
    
    productType: 'digital',
    category: 'software',
    tags: ['enterprise', 'b2b', 'software', 'corporate', 'premium'],
    industry: ['technology', 'business', 'enterprise'],
    
    tier: 'premium',
    status: 'published',
    price: 99,
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
      details: 'Enterprise license with white-label rights',
    },
    
    thumbnail: '/templates/v2/digital/enterprise-software-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/enterprise-software-preview-1.jpg',
      '/templates/v2/digital/enterprise-software-preview-2.jpg',
      '/templates/v2/digital/enterprise-software-preview-3.jpg',
      '/templates/v2/digital/enterprise-software-preview-4.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/enterprise-software',
    
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
      title: 'Enterprise Software Premium - B2B Solution Template',
      description: 'Enterprise-grade software template with compliance, security, and white-label options.',
      keywords: ['enterprise software', 'b2b', 'corporate', 'business solution'],
    },
    
    supportedLanguages: ['fr', 'en', 'de'],
    defaultLanguage: 'en',
    
    features: [
      'Enterprise dashboard',
      'Compliance badges (SOC2, ISO 27001, GDPR)',
      'Security features showcase',
      'White-label options',
      'Dedicated support portal',
      'SLA guarantees',
      'Custom pricing (quote-based)',
      'Implementation roadmap',
      'Training modules',
      'API enterprise tier',
      'Single Sign-On (SSO)',
      'Audit logs',
      'Role-based access',
      'Multi-tenant support',
    ],
    
    highlights: [
      'Enterprise-grade security',
      'Compliance-ready',
      'White-label capable',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#0052CC',
        secondary: '#0747A6',
        accent: '#00B8D9',
        background: '#FFFFFF',
        surface: '#F4F5F7',
        text: '#172B4D',
        textSecondary: '#5E6C84',
        border: '#DFE1E6',
        success: '#00875A',
        warning: '#FF991F',
        error: '#DE350B',
        info: '#0052CC',
      },
      typography: {
        fontFamily: {
          heading: 'Segoe UI, sans-serif',
          body: 'Segoe UI, sans-serif',
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
        sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.12)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'productName', type: 'string', label: 'Product Name', defaultValue: 'Enterprise Suite', required: true },
        { key: 'tagline', type: 'string', label: 'Tagline', defaultValue: 'Complete business solution', required: true },
        { key: 'startingPrice', type: 'string', label: 'Starting Price', defaultValue: 'Contact us', required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          productName: '{{ productName }}',
          tagline: '{{ tagline }}',
          badges: ['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant', '99.99% Uptime'],
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-enterprise', name: 'Hero', enabled: true, order: 0 },
      { id: 'trust', type: 'trust-indicators', name: 'Trust', enabled: true, order: 1 },
      { id: 'features', type: 'enterprise-features', name: 'Features', enabled: true, order: 2 },
      { id: 'security', type: 'security-compliance', name: 'Security', enabled: true, order: 3 },
      { id: 'implementation', type: 'implementation-roadmap', name: 'Implementation', enabled: true, order: 4 },
      { id: 'pricing', type: 'enterprise-pricing', name: 'Pricing', enabled: true, order: 5 },
      { id: 'case-studies', type: 'case-studies-detailed', name: 'Case Studies', enabled: true, order: 6 },
      { id: 'support', type: 'support-portal', name: 'Support', enabled: true, order: 7 },
      { id: 'cta', type: 'cta-contact-sales', name: 'CTA', enabled: true, order: 8 },
    ],
    
    digitalSettings: {
      fileTypes: ['exe', 'msi', 'dmg', 'deb', 'docker'],
      licenseManagement: {
        enabled: true,
        type: 'unlimited',
      },
      downloadSettings: {
        maxDownloads: -1,
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

export default enterpriseSoftwarePremiumTemplate;

