/**
 * 👥 MEMBERSHIP SITE PREMIUM TEMPLATE V2
 * Community and membership platform template
 * 
 * Design Inspiration: Patreon, Circle, Mighty Networks
 * Best for: Membership sites, communities, subscription platforms
 * Tier: PREMIUM
 */

import { TemplateV2 } from '@/types/templates-v2';

export const membershipSitePremiumTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-membership-site-premium-v2',
    slug: 'membership-site-premium',
    version: '2.0.0',
    name: 'Membership Site - Premium',
    description: 'Community-focused template for membership sites with tiered access, member benefits, community features, and subscription management. Perfect for creators and community builders.',
    shortDescription: 'Premium membership and community platform template',
    
    productType: 'digital',
    category: 'saas',
    tags: ['membership', 'community', 'subscription', 'premium', 'access'],
    industry: ['community', 'education', 'content-creation'],
    
    tier: 'premium',
    status: 'published',
    price: 69,
    currency: 'EUR',
    
    designStyle: 'modern',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Premium license for membership platforms',
    },
    
    thumbnail: '/templates/v2/digital/membership-site-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/membership-site-preview-1.jpg',
      '/templates/v2/digital/membership-site-preview-2.jpg',
      '/templates/v2/digital/membership-site-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/membership-site',
    
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
      title: 'Membership Site Premium - Community Platform Template',
      description: 'Premium membership template with tiered access, community features, and subscription management.',
      keywords: ['membership site', 'community platform', 'subscription', 'premium access'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'en',
    
    features: [
      'Membership tiers (3-5 levels)',
      'Member-only content',
      'Community forum',
      'Live events calendar',
      'Member directory',
      'Private messaging',
      'Discussion boards',
      'Member badges',
      'Progress tracking',
      'Exclusive resources',
      'Monthly challenges',
      'Member testimonials',
      'Subscription management',
      'Automatic renewals',
    ],
    
    highlights: [
      'Build engaged community',
      'Recurring revenue',
      'Scalable platform',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#F96854',
        secondary: '#FF8A3D',
        accent: '#FFCD47',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: {
          heading: 'DM Sans, sans-serif',
          body: 'Inter, sans-serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.875rem',
          '3xl': '2.5rem',
          '4xl': '3.5rem',
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
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem',
        '3xl': '6rem',
        '4xl': '8rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.12)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'communityName', type: 'string', label: 'Community Name', defaultValue: 'The Circle', required: true },
        { key: 'membersCount', type: 'number', label: 'Members Count', defaultValue: 500, required: true },
        { key: 'monthlyPrice', type: 'number', label: 'Monthly Price', defaultValue: 29, required: true },
        { key: 'yearlyPrice', type: 'number', label: 'Yearly Price', defaultValue: 249, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          communityName: '{{ communityName }}',
          membersCount: '{{ membersCount }}+ Members',
          tagline: 'Join a community of creators',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-community', name: 'Hero', enabled: true, order: 0 },
      { id: 'benefits', type: 'member-benefits', name: 'Benefits', enabled: true, order: 1 },
      { id: 'tiers', type: 'membership-tiers', name: 'Membership Tiers', enabled: true, order: 2 },
      { id: 'content-preview', type: 'content-preview', name: 'Content Preview', enabled: true, order: 3 },
      { id: 'community-features', type: 'community-features', name: 'Community Features', enabled: true, order: 4 },
      { id: 'testimonials', type: 'member-testimonials', name: 'Testimonials', enabled: true, order: 5 },
      { id: 'faq', type: 'membership-faq', name: 'FAQ', enabled: true, order: 6 },
      { id: 'cta', type: 'cta-join-now', name: 'CTA', enabled: true, order: 7 },
    ],
    
    digitalSettings: {
      fileTypes: ['web-access'],
      licenseManagement: {
        enabled: true,
        type: 'subscription',
      },
      downloadSettings: {
        maxDownloads: -1,
      },
      versionControl: {
        enabled: false,
      },
      security: {
        encryptionLevel: 'basic',
      },
    },
  },
};

export default membershipSitePremiumTemplate;

