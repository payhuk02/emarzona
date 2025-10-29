/**
 * 📖 ULTIMATE E-BOOK PREMIUM TEMPLATE V2
 * Luxury e-book template with advanced features
 * 
 * Design Inspiration: Apple Books, Kindle Unlimited Premium
 * Best for: Premium e-books, masterclasses, ultimate guides
 * Tier: PREMIUM
 */

import { TemplateV2 } from '@/types/templates-v2';

export const ultimateEbookPremiumTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-ultimate-ebook-premium-v2',
    slug: 'ultimate-ebook-premium',
    version: '2.0.0',
    name: 'Ultimate E-book - Premium',
    description: 'Luxury e-book template with interactive features, bonus content, and premium presentation. Perfect for high-value books and masterclasses.',
    shortDescription: 'Premium luxury e-book template with bonuses',
    
    productType: 'digital',
    category: 'ebook',
    tags: ['ebook', 'premium', 'masterclass', 'luxury', 'ultimate-guide'],
    industry: ['publishing', 'education', 'content-creation'],
    
    tier: 'premium',
    status: 'published',
    price: 29,
    currency: 'EUR',
    
    designStyle: 'luxury',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
      details: 'Premium license with exclusive features',
    },
    
    thumbnail: '/templates/v2/digital/ultimate-ebook-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/ultimate-ebook-preview-1.jpg',
      '/templates/v2/digital/ultimate-ebook-preview-2.jpg',
      '/templates/v2/digital/ultimate-ebook-preview-3.jpg',
      '/templates/v2/digital/ultimate-ebook-preview-4.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/ultimate-ebook',
    
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
      title: 'Ultimate E-book Premium - Luxury E-book Template',
      description: 'Premium e-book template with interactive features, bonus content, and luxury presentation.',
      keywords: ['premium ebook', 'luxury ebook', 'masterclass', 'ultimate guide'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Luxury 3D book cover',
      'Interactive table of contents',
      'Chapter previews',
      'Bonus materials section',
      'Workbook templates',
      'Video companion',
      'Audio version',
      'Lifetime updates',
      'Private community access',
      'Money-back guarantee (60 days)',
      'Multiple formats (PDF, EPUB, MOBI)',
      'Author Q&A access',
      'Certificate of completion',
      'Exclusive resources',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#1E293B',
        secondary: '#B45309',
        accent: '#D97706',
        background: '#FFFBEB',
        surface: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#475569',
        border: '#E2E8F0',
        success: '#047857',
        warning: '#B45309',
        error: '#991B1B',
        info: '#1E40AF',
      },
      typography: {
        fontFamily: {
          heading: 'Playfair Display, serif',
          body: 'Lora, serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1.0625rem',
          lg: '1.25rem',
          xl: '1.5rem',
          '2xl': '2rem',
          '3xl': '2.75rem',
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
          tight: 1.25,
          normal: 1.65,
          relaxed: 1.85,
        },
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2.5rem',
        xl: '3.5rem',
        '2xl': '5rem',
        '3xl': '7rem',
        '4xl': '10rem',
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
        sm: '0 2px 4px rgba(0, 0, 0, 0.05)',
        md: '0 8px 16px rgba(0, 0, 0, 0.08)',
        lg: '0 16px 32px rgba(0, 0, 0, 0.12)',
        xl: '0 24px 48px rgba(0, 0, 0, 0.16)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'bookTitle', type: 'string', label: 'Book Title', defaultValue: 'The Ultimate Guide', required: true },
        { key: 'subtitle', type: 'string', label: 'Subtitle', defaultValue: 'Master Your Craft', required: true },
        { key: 'authorName', type: 'string', label: 'Author', defaultValue: 'Expert Author', required: true },
        { key: 'pageCount', type: 'number', label: 'Pages', defaultValue: 350, required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 79, required: true },
        { key: 'bonusCount', type: 'number', label: 'Bonus Items', defaultValue: 5, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          bookTitle: '{{ bookTitle }}',
          subtitle: '{{ subtitle }}',
          author: '{{ authorName }}',
          badges: ['Best Seller', 'Award Winner', '5-Star Rated'],
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-luxury', name: 'Hero', enabled: true, order: 0 },
      { id: 'preview', type: 'book-preview-3d', name: 'Preview', enabled: true, order: 1 },
      { id: 'bonuses', type: 'bonus-showcase', name: 'Bonuses', enabled: true, order: 2 },
      { id: 'contents', type: 'interactive-toc', name: 'Contents', enabled: true, order: 3 },
      { id: 'author', type: 'author-luxury', name: 'Author', enabled: true, order: 4 },
      { id: 'testimonials', type: 'testimonials-premium', name: 'Testimonials', enabled: true, order: 5 },
      { id: 'pricing', type: 'pricing-ultimate', name: 'Pricing', enabled: true, order: 6 },
      { id: 'guarantee', type: 'guarantee-badge', name: 'Guarantee', enabled: true, order: 7 },
      { id: 'faq', type: 'faq-premium', name: 'FAQ', enabled: true, order: 8 },
    ],
    
    digitalSettings: {
      fileTypes: ['pdf', 'epub', 'mobi', 'mp3', 'mp4'],
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
        watermarkEnabled: true,
        encryptionLevel: 'advanced',
      },
    },
  },
};

export default ultimateEbookPremiumTemplate;

