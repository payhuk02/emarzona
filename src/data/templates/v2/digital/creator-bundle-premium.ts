/**
 * 🎁 CREATOR BUNDLE PREMIUM TEMPLATE V2
 * Multi-product bundle template for creators
 * 
 * Design Inspiration: Gumroad Bundles, Creative Market Collections
 * Best for: Creator bundles, multi-product packages, complete toolkits
 * Tier: PREMIUM
 */

import { TemplateV2 } from '@/types/templates-v2';

export const creatorBundlePremiumTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-creator-bundle-premium-v2',
    slug: 'creator-bundle-premium',
    version: '2.0.0',
    name: 'Creator Bundle - Premium',
    description: 'Premium bundle template for creators with product showcase, savings calculator, and tiered options. Perfect for selling complete toolkits and collections.',
    shortDescription: 'Premium multi-product bundle for creators',
    
    productType: 'digital',
    category: 'template',
    tags: ['bundle', 'creator', 'multi-product', 'toolkit', 'premium'],
    industry: ['creative', 'design', 'content-creation'],
    
    tier: 'premium',
    status: 'published',
    price: 39,
    currency: 'EUR',
    
    designStyle: 'creative',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Premium license with lifetime updates',
    },
    
    thumbnail: '/templates/v2/digital/creator-bundle-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/creator-bundle-preview-1.jpg',
      '/templates/v2/digital/creator-bundle-preview-2.jpg',
      '/templates/v2/digital/creator-bundle-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/creator-bundle',
    
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
      title: 'Creator Bundle Premium - Multi-Product Bundle Template',
      description: 'Premium bundle template with product showcase, savings calculator, and tiered pricing options.',
      keywords: ['creator bundle', 'multi-product', 'toolkit', 'premium bundle', 'collection'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Product showcase grid',
      'Savings calculator',
      'Bundle comparison table',
      'Tiered pricing (Basic, Pro, Ultimate)',
      'Individual product previews',
      'Commercial license options',
      'Money-back guarantee',
      'Lifetime updates badge',
      'Creator testimonials',
      'Cross-sell suggestions',
      'Bundle customizer',
      'Package breakdown',
      'Value proposition display',
      'Limited-time offers',
    ],
    
    highlights: [
      'Ultimate creator toolkit',
      'Save 50%+ vs individual',
      'Lifetime access',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#8B5CF6',
        secondary: '#EC4899',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#FAFAFA',
        text: '#1F2937',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: {
          heading: 'Cal Sans, sans-serif',
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
        xl: '0 25px 50px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'bundleName', type: 'string', label: 'Bundle Name', defaultValue: 'Ultimate Creator Toolkit', required: true },
        { key: 'productsCount', type: 'number', label: 'Products Count', defaultValue: 12, required: true },
        { key: 'bundlePrice', type: 'number', label: 'Bundle Price', defaultValue: 149, required: true },
        { key: 'individualPrice', type: 'number', label: 'Individual Total Price', defaultValue: 399, required: true },
        { key: 'savingsPercent', type: 'number', label: 'Savings %', defaultValue: 63, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          bundleName: '{{ bundleName }}',
          productsCount: '{{ productsCount }} Premium Products',
          savings: 'Save {{ savingsPercent }}%',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-bundle', name: 'Hero', enabled: true, order: 0 },
      { id: 'savings', type: 'savings-calculator', name: 'Savings', enabled: true, order: 1 },
      { id: 'products', type: 'product-grid', name: 'Products', enabled: true, order: 2 },
      { id: 'pricing', type: 'tier-pricing', name: 'Pricing', enabled: true, order: 3 },
      { id: 'testimonials', type: 'creator-testimonials', name: 'Testimonials', enabled: true, order: 4 },
      { id: 'faq', type: 'faq', name: 'FAQ', enabled: true, order: 5 },
      { id: 'cta', type: 'cta-bundle', name: 'CTA', enabled: true, order: 6 },
    ],
    
    digitalSettings: {
      fileTypes: ['zip', 'pdf', 'ai', 'psd', 'fig'],
      licenseManagement: {
        enabled: true,
        type: 'multi',
      },
      downloadSettings: {
        maxDownloads: 10,
      },
      versionControl: {
        enabled: true,
        autoUpdate: true,
        notifyCustomers: true,
      },
      security: {
        watermarkEnabled: false,
      },
    },
  },
};

export default creatorBundlePremiumTemplate;

