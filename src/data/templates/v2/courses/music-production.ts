import { Template } from '@/types/templates-v2';

export const musicProductionTemplate: Template = {
  id: 'course-music-masterclass',
  name: 'Music Production Masterclass (PREMIUM)',
  description: 'Template PREMIUM production musicale - Style Masterclass prestigieux',
  category: 'course',
  subCategory: 'music',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['music', 'production', 'masterclass', 'audio', 'dj'], tier: 'premium', designStyle: 'luxury', industry: 'music', language: 'fr', isPopular: true, usageCount: 2134, rating: 5.0, reviewCount: 432, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Masterclass exclusive avec producteurs Grammy Award. Production pro, mixage, mastering.', longDescription: `# 🎵 MASTERCLASS AVEC LES LÉGENDES\n\n## Apprenez des Meilleurs\n\nCours exclusifs avec producteurs **Grammy Award**\n\n### Programme\n- 🎹 Production musicale pro\n- 🎛️ Mixage & mastering\n- 🎸 Composition créative\n- 🎤 Enregistrement studio\n- 💿 Distribution & promo\n\n## 🏆 Instructeurs Légendaires\n\n{{ instructors_count }} producteurs multi-platine\n\n## 💎 {{ price }}€\n\n---\n\n**Accédez aux secrets des pros !** 🎵`, price: 599.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1280&h=720&fit=crop', alt: 'Music Production', isPrimary: true, sortOrder: 1 }], colors: { primary: '#000000', secondary: '#FFFFFF', accent: '#FFD700', background: '#000000', text: '#FFFFFF' }, seo: { metaTitle: 'Masterclass Production Musicale | Producteurs Grammy | Cours Premium', metaDescription: 'Cours exclusif production musicale. Producteurs Grammy Award. Mixage, mastering pro. {{ price }}€.', keywords: ['music production', 'masterclass', 'audio', 'mixing', 'mastering'] }, course: { level: 'intermediate-to-advanced', duration: 4, durationUnit: 'months', totalHours: 120, format: ['video-premium', 'workbooks', 'community'], certificate: true, pricing: [{ id: 'masterclass', name: 'Masterclass', price: 599, description: 'Accès lifetime + bonus', isPopular: true }] } },
};

export default musicProductionTemplate;

