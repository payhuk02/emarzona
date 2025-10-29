/**
 * 🎬 VIDEO CONTENT TEMPLATE V2
 * Media-focused design for video courses, tutorials, and content
 * 
 * Design Inspiration: Netflix, YouTube, Vimeo
 * Best for: Video courses, tutorials, documentaries, video content
 */

import { TemplateV2 } from '@/types/templates-v2';

export const videoContentTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-video-content-v2',
    slug: 'video-content',
    version: '2.0.0',
    name: 'Video Content',
    description: 'Media-rich template for video content with video player, chapters, and interactive features. Perfect for video creators, educators, and filmmakers.',
    shortDescription: 'Media template for video courses and content',
    
    productType: 'digital',
    category: 'video',
    tags: ['video', 'tutorial', 'course', 'media', 'streaming'],
    industry: ['media', 'education', 'entertainment'],
    
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
    
    thumbnail: '/templates/v2/digital/video-content-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/video-content-preview-1.jpg',
      '/templates/v2/digital/video-content-preview-2.jpg',
      '/templates/v2/digital/video-content-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/video-content',
    
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
      title: 'Video Content Template - Media-Rich Design for Video Creators',
      description: 'Professional video template with embedded player, chapters, and interactive features.',
      keywords: ['video template', 'video course', 'tutorial', 'streaming', 'media'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'HD video player',
      'Chapter markers',
      'Playback speed control',
      'Video quality selector',
      'Closed captions',
      'Download options',
      'Related videos',
      'Comments section',
      'Watch progress tracking',
      'Responsive player',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#E50914',
        secondary: '#831010',
        accent: '#F5F5F1',
        background: '#141414',
        surface: '#1F1F1F',
        text: '#FFFFFF',
        textSecondary: '#B3B3B3',
        border: '#2F2F2F',
        success: '#46D369',
        warning: '#FFA500',
        error: '#E50914',
        info: '#00A8E1',
      },
      typography: {
        fontFamily: {
          heading: 'Netflix Sans, Helvetica, sans-serif',
          body: 'Netflix Sans, Helvetica, sans-serif',
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
          tight: 1.1,
          normal: 1.4,
          relaxed: 1.6,
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
        sm: '0.125rem',
        md: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
        md: '0 4px 16px rgba(0, 0, 0, 0.5)',
        lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
        xl: '0 16px 64px rgba(0, 0, 0, 0.7)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'videoTitle', type: 'string', label: 'Video Title', defaultValue: 'My Video Course', required: true },
        { key: 'duration', type: 'string', label: 'Duration', defaultValue: '2h 30m', required: true },
        { key: 'chaptersCount', type: 'number', label: 'Chapters', defaultValue: 10, required: true },
        { key: 'resolution', type: 'string', label: 'Resolution', defaultValue: '1080p', required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 49, required: true },
        { key: 'previewUrl', type: 'string', label: 'Preview URL', required: false },
      ],
    },
    
    content: {
      default: {
        hero: {
          videoPreview: '/video-preview.mp4',
          title: '{{ videoTitle }}',
          duration: '{{ duration }}',
          resolution: '{{ resolution }}',
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-video', name: 'Hero', enabled: true, order: 0 },
      { id: 'player', type: 'video-player', name: 'Player', enabled: true, order: 1 },
      { id: 'chapters', type: 'chapters-list', name: 'Chapters', enabled: true, order: 2 },
      { id: 'description', type: 'video-description', name: 'Description', enabled: true, order: 3 },
      { id: 'cta', type: 'cta-purchase', name: 'CTA', enabled: true, order: 4 },
    ],
    
    digitalSettings: {
      fileTypes: ['mp4', 'mov', 'avi', 'mkv'],
      licenseManagement: {
        enabled: true,
        type: 'single',
      },
      downloadSettings: {
        maxDownloads: 3,
        tokenExpiration: 72,
      },
      versionControl: {
        enabled: true,
        autoUpdate: false,
      },
      security: {
        drmEnabled: true,
        watermarkEnabled: true,
        encryptionLevel: 'advanced',
      },
    },
  },
};

export default videoContentTemplate;

