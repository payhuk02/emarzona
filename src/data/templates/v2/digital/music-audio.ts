/**
 * 🎵 MUSIC/AUDIO TEMPLATE V2
 * Artistic design for music, audio files, and sound packs
 * 
 * Design Inspiration: Bandcamp, SoundCloud, Splice
 * Best for: Music albums, audio samples, sound packs, podcasts
 */

import { TemplateV2 } from '@/types/templates-v2';

export const musicAudioTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-music-audio-v2',
    slug: 'music-audio',
    version: '2.0.0',
    name: 'Music & Audio',
    description: 'Artistic template for music and audio products with audio player, tracklist, and artist showcase. Perfect for musicians, producers, and audio creators.',
    shortDescription: 'Artistic template for music albums and audio products',
    
    productType: 'digital',
    category: 'music',
    tags: ['music', 'audio', 'sound', 'album', 'artist'],
    industry: ['music', 'entertainment', 'audio-production'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'creative',
    colorScheme: 'dark',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/music-audio-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/music-audio-preview-1.jpg',
      '/templates/v2/digital/music-audio-preview-2.jpg',
      '/templates/v2/digital/music-audio-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/music-audio',
    
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
      title: 'Music & Audio Template - Artistic Design for Musicians',
      description: 'Professional music template with audio player, tracklist, and artist showcase. Perfect for albums and sound packs.',
      keywords: ['music template', 'audio template', 'album', 'sound pack', 'musician'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Embedded audio player',
      'Tracklist with preview',
      'Album artwork showcase',
      'Artist bio section',
      'Waveform visualization',
      'Lyrics display',
      'License options',
      'Streaming links',
      'Download formats (MP3, WAV, FLAC)',
      'Social sharing',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#EC4899',
        secondary: '#F97316',
        accent: '#8B5CF6',
        background: '#0A0A0A',
        surface: '#1A1A1A',
        text: '#F5F5F5',
        textSecondary: '#A3A3A3',
        border: '#2A2A2A',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: {
          heading: 'Montserrat, sans-serif',
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
        sm: '0.25rem',
        md: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
        md: '0 4px 8px rgba(0, 0, 0, 0.4)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.5)',
        xl: '0 20px 40px rgba(0, 0, 0, 0.6)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
        none: 'none',
        glow: '0 0 30px rgba(236, 72, 153, 0.3)',
      },
    },
    
    logic: {
      variables: [
        { key: 'albumTitle', type: 'string', label: 'Album Title', defaultValue: 'My Album', required: true },
        { key: 'artistName', type: 'string', label: 'Artist Name', defaultValue: 'Artist Name', required: true },
        { key: 'releaseYear', type: 'string', label: 'Release Year', defaultValue: '2025', required: true },
        { key: 'tracksCount', type: 'number', label: 'Number of Tracks', defaultValue: 12, required: true },
        { key: 'price', type: 'number', label: 'Price', defaultValue: 9.99, required: true },
        { key: 'streamingLinks', type: 'object', label: 'Streaming Links', required: false },
      ],
    },
    
    content: {
      default: {
        hero: {
          albumArt: '/album-cover.jpg',
          title: '{{ albumTitle }}',
          artist: '{{ artistName }}',
          year: '{{ releaseYear }}',
          genres: ['Electronic', 'Ambient'],
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-album', name: 'Hero', enabled: true, order: 0 },
      { id: 'player', type: 'audio-player', name: 'Audio Player', enabled: true, order: 1 },
      { id: 'tracklist', type: 'tracklist', name: 'Tracklist', enabled: true, order: 2 },
      { id: 'artist', type: 'artist-bio', name: 'Artist', enabled: true, order: 3 },
      { id: 'streaming', type: 'streaming-links', name: 'Streaming', enabled: true, order: 4 },
      { id: 'cta', type: 'cta-download', name: 'CTA', enabled: true, order: 5 },
    ],
    
    digitalSettings: {
      fileTypes: ['mp3', 'wav', 'flac', 'aiff'],
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

export default musicAudioTemplate;

