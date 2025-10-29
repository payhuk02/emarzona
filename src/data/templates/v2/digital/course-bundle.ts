/**
 * 📚 COURSE BUNDLE TEMPLATE V2
 * Educational design for course bundles and learning packages
 * 
 * Design Inspiration: Teachable, Udemy, Skillshare
 * Best for: Course bundles, learning paths, educational packages
 */

import { TemplateV2 } from '@/types/templates-v2';

export const courseBundleTemplate: TemplateV2 = {
  metadata: {
    id: 'digital-course-bundle-v2',
    slug: 'course-bundle',
    version: '2.0.0',
    name: 'Course Bundle',
    description: 'Educational template for course bundles with learning paths, progress tracking, and student success stories. Perfect for educators and online course creators.',
    shortDescription: 'Educational template for course bundles and learning paths',
    
    productType: 'digital',
    category: 'ebook',
    tags: ['course', 'bundle', 'education', 'learning', 'online-course'],
    industry: ['education', 'e-learning', 'training'],
    
    tier: 'free',
    status: 'published',
    
    designStyle: 'professional',
    colorScheme: 'light',
    
    author: {
      id: 'payhula-official',
      name: 'Payhula Design Team',
      verified: true,
    },
    
    license: {
      type: 'commercial',
    },
    
    thumbnail: '/templates/v2/digital/course-bundle-thumb.jpg',
    previewImages: [
      '/templates/v2/digital/course-bundle-preview-1.jpg',
      '/templates/v2/digital/course-bundle-preview-2.jpg',
      '/templates/v2/digital/course-bundle-preview-3.jpg',
    ],
    demoUrl: 'https://demo.payhula.com/templates/course-bundle',
    
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
      title: 'Course Bundle Template - Educational Design for Learning Paths',
      description: 'Professional course bundle template with curriculum overview, progress tracking, and student testimonials.',
      keywords: ['course bundle', 'online learning', 'education template', 'e-learning'],
    },
    
    supportedLanguages: ['fr', 'en', 'es'],
    defaultLanguage: 'fr',
    
    features: [
      'Curriculum overview',
      'Learning path visualization',
      'Progress tracker',
      'Certificate preview',
      'Student testimonials',
      'Course comparison table',
      'Instructor profiles',
      'Bundle pricing options',
      'Money-back guarantee',
      'Lifetime access badge',
    ],
  },
  
  content: {
    designTokens: {
      colors: {
        primary: '#7C3AED',
        secondary: '#A78BFA',
        accent: '#F59E0B',
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
          heading: 'Poppins, sans-serif',
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
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.07)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
    },
    
    logic: {
      variables: [
        { key: 'bundleName', type: 'string', label: 'Bundle Name', defaultValue: 'Complete Learning Path', required: true },
        { key: 'coursesCount', type: 'number', label: 'Number of Courses', defaultValue: 5, required: true },
        { key: 'totalHours', type: 'number', label: 'Total Hours', defaultValue: 40, required: true },
        { key: 'price', type: 'number', label: 'Bundle Price', defaultValue: 199, required: true },
        { key: 'individualPrice', type: 'number', label: 'Individual Price', defaultValue: 349, required: false },
        { key: 'certificateIncluded', type: 'boolean', label: 'Certificate Included', defaultValue: true, required: false },
      ],
    },
    
    content: {
      default: {
        hero: {
          headline: '{{ bundleName }}',
          description: 'Master your skills with our complete learning bundle',
          stats: [
            '{{ coursesCount }} Courses',
            '{{ totalHours }}+ Hours',
            'Lifetime Access',
            'Certificate',
          ],
        },
      },
    },
    
    sections: [
      { id: 'hero', type: 'hero-educational', name: 'Hero', enabled: true, order: 0 },
      { id: 'curriculum', type: 'curriculum-overview', name: 'Curriculum', enabled: true, order: 1 },
      { id: 'learning-path', type: 'learning-path', name: 'Learning Path', enabled: true, order: 2 },
      { id: 'pricing', type: 'bundle-pricing', name: 'Pricing', enabled: true, order: 3 },
      { id: 'testimonials', type: 'student-testimonials', name: 'Testimonials', enabled: true, order: 4 },
      { id: 'faq', type: 'faq', name: 'FAQ', enabled: true, order: 5 },
    ],
    
    digitalSettings: {
      fileTypes: ['video', 'pdf', 'zip'],
      licenseManagement: {
        enabled: true,
        type: 'single',
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

export default courseBundleTemplate;

