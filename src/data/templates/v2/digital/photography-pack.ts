/**
 * 📷 PHOTOGRAPHY PACK TEMPLATE V2
 * Portfolio design for photographers and photo collections
 * 
 * Design Inspiration: Unsplash, 500px, Adobe Portfolio
 * Best for: Photo packs, photography collections, stock photos
 */

import { TemplateV2 } from '@/types/templates-v2';

export const photographyPackTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-photography-pack-v2',
    slug: 'photography-pack',
    version: '2.0.0',
    name: 'Photography Pack',
    description: 'Portfolio-style template for photography collections with stunning gallery, EXIF data, and license options. Perfect for photographers and stock photo sellers.',
    shortDescription: 'Portfolio template for photo collections and stock photos',
    
    productType: 'digital',
    category: 'photo',
    tags: ['photography', 'photos', 'stock', 'images', 'portfolio'],
    industry: ['photography', 'creative', 'media'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'elegant',
    colorScheme: 'dark',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/photography-pack-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/photography-pack-preview-1.jpg',
      '/templates/v2/digital/photography-pack-preview-2.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/photography-pack',
    
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
      title: 'Photography Pack Template - Portfolio Design for Photographers',
      description: 'Professional photography template with stunning gallery and license options.',
      keywords: ['photography template', 'photo pack', 'stock photos', 'portfolio'],
    },
    
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'en',
    
    features: [
      'Fullscreen gallery',
      'Lightbox viewer',
      'EXIF data display',
      'License comparison',
      'High-res previews',
      'Photographer profile',
      'Filter by category',
      'Download options',
      'Commercial licenses',
      'Usage rights display',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#FFFFFF',
        secondary: '#F5F5F5',
        accent: '#FFD700',
        background: '#000000',
        surface: '#1A1A1A',
        text: '#FFFFFF',
        textSecondary: '#AAAAAA',
        border: '#333333',
        success: '#4ADE80',
        warning: '#FBBF24',
        error: '#EF4444',
        info: '#60A5FA',
      },
      typography: {
        fontFamily: {
          heading: 'Playfair Display, serif',
          body: 'Inter, sans-serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.75rem',
          '3xl': '2.5rem',
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
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.5)',
        md: '0 4px 16px rgba(0, 0, 0, 0.6)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.7)',
        xl: '0 16px 64px rgba(0, 0, 0, 0.8)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'packName', type: 'string', label: 'Pack Name', defaultValue: 'Premium Photo Collection', required: true },
        { key: 'photosCount', type: 'number', label: 'Photos Count', defaultValue: 50, required: true },
        { key: 'resolution', type: 'string', label: 'Resolution', defaultValue: '6000x4000', required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 49, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          packName: '{{ packName }}',
          photosCount: '{{ photosCount }} Photos',
          resolution: '{{ resolution }}',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-fullscreen-image', name: 'Hero', enabled: true, order: 0 },
      { id: 'gallery', type: 'masonry-gallery', name: 'Gallery', enabled: true, order: 1 },
      { id: 'specs', type: 'photo-specs', name: 'Specifications', enabled: true, order: 2 },
      { id: 'license', type: 'license-comparison', name: 'License', enabled: true, order: 3 },
      { id: 'photographer', type: 'photographer-profile', name: 'Photographer', enabled: true, order: 4 },
    ],
    
    digitalSettings: {
      fileTypes: ['jpg', 'png', 'raw', 'psd'],
      licenseManagement: {
        enabled: true,
        type: 'multi',
      },
      downloadSettings: {
        maxDownloads: 5,
      },
      versionControl: {
        enabled: false,
      },
      security: {
        watermarkEnabled: true,
      },
    },
  },
};

export default photographyPackTemplate;

