/**
 * ✍️ FONT COLLECTION TEMPLATE V2
 * Typography-focused design for font families and typefaces
 * 
 * Design Inspiration: Google Fonts, Adobe Fonts, MyFonts
 * Best for: Font families, typefaces, typography packs
 */

import { TemplateV2 } from '@/types/templates-v2';

export const fontCollectionTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-font-collection-v2',
    slug: 'font-collection',
    version: '2.0.0',
    name: 'Font Collection',
    description: 'Typography-focused template for font collections with live preview, character sets, and pairing suggestions. Perfect for type designers and foundries.',
    shortDescription: 'Typography template for font families and typefaces',
    
    productType: 'digital',
    category: 'font',
    tags: ['font', 'typography', 'typeface', 'design', 'type-design'],
    industry: ['design', 'typography', 'creative'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'minimal',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/font-collection-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/font-collection-preview-1.jpg',
      '/templates/v2/digital/font-collection-preview-2.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/font-collection',
    
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
      title: 'Font Collection Template - Typography Design',
      description: 'Professional font template with live preview and character sets.',
      keywords: ['font template', 'typography', 'typeface', 'type design'],
    },
    
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'en',
    
    features: [
      'Live font preview',
      'Character set display',
      'Weight variations',
      'Font pairing suggestions',
      'OpenType features',
      'Language support list',
      'License options',
      'Web font included',
      'Desktop formats',
      'Usage examples',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#000000',
        secondary: '#1A1A1A',
        accent: '#0066FF',
        background: '#FFFFFF',
        surface: '#FAFAFA',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E0E0E0',
        success: '#00CC66',
        warning: '#FFAA00',
        error: '#FF3333',
        info: '#0066FF',
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
          xl: '1.5rem',
          '2xl': '2rem',
          '3xl': '3rem',
          '4xl': '4rem',
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
        { key: 'fontName', type: 'string', label: 'Font Name', defaultValue: 'Modern Sans', required: true },
        { key: 'weights', type: 'number', label: 'Weights', defaultValue: 9, required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 29, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          fontName: '{{ fontName }}',
          weights: '{{ weights }} Weights',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-font-preview', name: 'Hero', enabled: true, order: 0 },
      { id: 'live-preview', type: 'font-tester', name: 'Live Preview', enabled: true, order: 1 },
      { id: 'weights', type: 'weights-showcase', name: 'Weights', enabled: true, order: 2 },
      { id: 'charset', type: 'character-set', name: 'Character Set', enabled: true, order: 3 },
      { id: 'license', type: 'license-options', name: 'License', enabled: true, order: 4 },
    ],
    
    digitalSettings: {
      fileTypes: ['otf', 'ttf', 'woff', 'woff2', 'eot'],
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
      },
      security: {},
    },
  },
};

export default fontCollectionTemplate;

