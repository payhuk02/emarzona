/**
 * 🎨 GRAPHIC PACK TEMPLATE V2
 * Portfolio-style design for graphic packs and design assets
 * 
 * Design Inspiration: Dribbble, Behance, Creative Market
 * Best for: Design assets, graphics packs, UI kits, illustrations
 */

import { TemplateV2 } from '@/types/templates-v2';

export const graphicPackTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-graphic-pack-v2',
    slug: 'graphic-pack',
    version: '2.0.0',
    name: 'Graphic Pack',
    description: 'Portfolio-style template for graphic packs with visual showcase, file specs, and usage guide. Perfect for designers and illustrators.',
    shortDescription: 'Portfolio template for design assets and graphics',
    
    productType: 'digital',
    category: 'graphic',
    tags: ['design', 'graphics', 'illustration', 'ui-kit', 'assets'],
    industry: ['design', 'creative', 'digital-art'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'creative',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/graphic-pack-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/graphic-pack-preview-1.jpg',
      '/templates/v2/digital/graphic-pack-preview-2.jpg',
      '/templates/v2/digital/graphic-pack-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/graphic-pack',
    
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
      title: 'Graphic Pack Template - Portfolio Design for Designers',
      description: 'Professional graphic pack template with visual showcase, file specs, and license options.',
      keywords: ['graphic pack', 'design assets', 'ui kit', 'illustrations', 'designer'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Visual showcase gallery',
      'File specifications',
      'Preview images',
      'License comparison',
      'Usage examples',
      'Compatible software list',
      'File format options',
      'Layered previews',
      'Color palette display',
      'Designer portfolio link',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#FFE66D',
        background: '#FFFFFF',
        surface: '#F7F7F7',
        text: '#2C3E50',
        textSecondary: '#7F8C8D',
        border: '#ECF0F1',
        success: '#2ECC71',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB',
      },
      typography: {
        fontFamily: {
          heading: 'Lexend, sans-serif',
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
        sm: '0 2px 8px rgba(0, 0, 0, 0.06)',
        md: '0 4px 16px rgba(0, 0, 0, 0.08)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.10)',
        xl: '0 16px 48px rgba(0, 0, 0, 0.12)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'packName', type: 'string', label: 'Pack Name', defaultValue: 'Ultimate Design Pack', required: true },
        { key: 'itemsCount', type: 'number', label: 'Items Count', defaultValue: 150, required: true },
        { key: 'fileFormats', type: 'array', label: 'File Formats', defaultValue: ['AI', 'PSD', 'SVG', 'PNG'], required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 39, required: true },
        { key: 'extendedPrice', type: 'number', label: 'Extended License Price', defaultValue: 89, required: false },
      ],
    },
    
    content: {
      default: {
        hero: {
          packName: '{{ packName }}',
          itemsCount: '{{ itemsCount }} Items',
          formats: '{{ fileFormats | join }}',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-showcase', name: 'Hero', enabled: true, order: 0 },
      { id: 'gallery', type: 'masonry-gallery', name: 'Gallery', enabled: true, order: 1 },
      { id: 'specs', type: 'file-specs', name: 'Specifications', enabled: true, order: 2 },
      { id: 'license', type: 'license-options', name: 'License', enabled: true, order: 3 },
      { id: 'examples', type: 'usage-examples', name: 'Examples', enabled: true, order: 4 },
      { id: 'cta', type: 'cta-purchase', name: 'CTA', enabled: true, order: 5 },
    ],
    
    digitalSettings: {
      fileTypes: ['ai', 'psd', 'svg', 'png', 'eps', 'pdf'],
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
      security: {
        watermarkEnabled: false,
      },
    },
  },
};

export default graphicPackTemplate;

