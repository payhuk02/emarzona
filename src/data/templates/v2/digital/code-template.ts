/**
 * 💻 CODE TEMPLATE V2
 * Developer template for code templates and boilerplates
 * 
 * Design Inspiration: GitHub, CodePen, StackBlitz
 * Best for: Code templates, boilerplates, starter kits
 */

import { TemplateV2 } from '@/types/templates-v2';

export const codeTemplateTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-code-template-v2',
    slug: 'code-template',
    version: '2.0.0',
    name: 'Code Template',
    description: 'Developer-focused template for code templates with syntax highlighting, live demo, and documentation. Perfect for boilerplates and starter kits.',
    shortDescription: 'Developer template for code templates and boilerplates',
    
    productType: 'digital',
    category: 'code',
    tags: ['code', 'template', 'boilerplate', 'starter-kit', 'developer'],
    industry: ['technology', 'development', 'software'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'modern',
    colorScheme: 'dark',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'mit',
      details: 'Open source MIT license',
    },
    
    thumbnail: '/templates/v2/digital/code-template-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/code-template-preview-1.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/code-template',
    
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
      title: 'Code Template - Boilerplate & Starter Kit',
      description: 'Professional code template with syntax highlighting and live demo.',
      keywords: ['code template', 'boilerplate', 'starter kit', 'developer'],
    },
    
    supportedLanguages: ['en'],
    defaultLanguage: 'en',
    
    features: [
      'Syntax highlighting',
      'Live code preview',
      'Quick start guide',
      'Project structure',
      'Dependencies list',
      'CLI commands',
      'Environment setup',
      'GitHub integration',
      'Documentation',
      'MIT License',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#238636',
        secondary: '#1F6FEB',
        accent: '#F778BA',
        background: '#0D1117',
        surface: '#161B22',
        text: '#C9D1D9',
        textSecondary: '#8B949E',
        border: '#30363D',
        success: '#2EA043',
        warning: '#D29922',
        error: '#F85149',
        info: '#58A6FF',
      },
      typography: {
        fontFamily: {
          heading: 'Inter, sans-serif',
          body: 'Inter, sans-serif',
          mono: 'JetBrains Mono, monospace',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.75rem',
          '3xl': '2.5rem',
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
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
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
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        md: '0 4px 8px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'templateName', type: 'string', label: 'Template Name', defaultValue: 'React Starter', required: true },
        { key: 'techStack', type: 'array', label: 'Tech Stack', defaultValue: ['React', 'TypeScript', 'Vite'], required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 0, required: true },
      ],
    },
    
    content: {
      default: {
        hero: {
          templateName: '{{ templateName }}',
          techStack: '{{ techStack | join }}',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-code', name: 'Hero', enabled: true, order: 0 },
      { id: 'installation', type: 'code-installation', name: 'Installation', enabled: true, order: 1 },
      { id: 'features', type: 'features-list', name: 'Features', enabled: true, order: 2 },
      { id: 'documentation', type: 'docs-section', name: 'Documentation', enabled: true, order: 3 },
    ],
    
    digitalSettings: {
      fileTypes: ['zip', 'tar.gz'],
      licenseManagement: {
        enabled: false,
      },
      downloadSettings: {
        maxDownloads: -1,
      },
      versionControl: {
        enabled: true,
        autoUpdate: true,
      },
      security: {},
    },
  },
};

export default codeTemplateTemplate;

