/**
 * 🔌 APP/PLUGIN TEMPLATE V2
 * Developer-focused design for apps, plugins, and extensions
 * 
 * Design Inspiration: GitHub Marketplace, VS Code Extensions, Chrome Web Store
 * Best for: Apps, plugins, extensions, developer tools
 */

import { TemplateV2 } from '@/types/templates-v2';

export const appPluginTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-app-plugin-v2',
    slug: 'app-plugin',
    version: '2.0.0',
    name: 'App & Plugin',
    description: 'Developer-focused template for apps and plugins with code examples, installation guide, and API documentation. Perfect for developers and tool creators.',
    shortDescription: 'Developer template for apps, plugins, and extensions',
    
    productType: 'digital',
    category: 'app',
    tags: ['app', 'plugin', 'extension', 'developer', 'tool'],
    industry: ['technology', 'software', 'development'],
    
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
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/app-plugin-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/app-plugin-preview-1.jpg',
      '/templates/v2/digital/app-plugin-preview-2.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/app-plugin',
    
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
      title: 'App & Plugin Template - Developer-Focused Design',
      description: 'Professional app/plugin template with code examples, installation guide, and documentation.',
      keywords: ['app template', 'plugin', 'extension', 'developer tool', 'software'],
    },
    
    supportedLanguages: ['fr', 'en'],
    defaultLanguage: 'en',
    
    features: [
      'Quick start guide',
      'Code examples',
      'Installation instructions',
      'API documentation',
      'Changelog',
      'Compatibility matrix',
      'GitHub integration',
      'NPM package badge',
      'Live demo',
      'Support links',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#2DA44E',
        secondary: '#238636',
        accent: '#1F6FEB',
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
        { key: 'appName', type: 'string', label: 'App Name', defaultValue: 'MyAwesomeApp', required: true },
        { key: 'version', type: 'string', label: 'Version', defaultValue: '1.0.0', required: true },
        { key: 'compatibleWith', type: 'array', label: 'Compatible With', defaultValue: ['VSCode', 'Sublime'], required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 29, required: true },
        { key: 'githubUrl', type: 'string', label: 'GitHub URL', required: false },
        { key: 'npmPackage', type: 'string', label: 'NPM Package', required: false },
      ],
    },
    
    content: {
      default: {
        hero: {
          appName: '{{ appName }}',
          version: 'v{{ version }}',
          description: 'A powerful tool for developers',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-app', name: 'Hero', enabled: true, order: 0 },
      { id: 'installation', type: 'installation-guide', name: 'Installation', enabled: true, order: 1 },
      { id: 'features', type: 'features-code', name: 'Features', enabled: true, order: 2 },
      { id: 'documentation', type: 'api-docs', name: 'Documentation', enabled: true, order: 3 },
      { id: 'changelog', type: 'changelog', name: 'Changelog', enabled: true, order: 4 },
      { id: 'cta', type: 'cta-download', name: 'CTA', enabled: true, order: 5 },
    ],
    
    digitalSettings: {
      fileTypes: ['zip', 'exe', 'dmg', 'appimage', 'deb'],
      licenseManagement: {
        enabled: true,
        type: 'single',
        activationLimit: 3,
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
        drmEnabled: true,
        encryptionLevel: 'advanced',
      },
    },
  },
};

export default appPluginTemplate;

