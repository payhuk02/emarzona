import { Template } from '@/types/templates-v2';

export const languageLearningTemplate: Template = {
  id: 'course-language-duolingo',
  name: 'Language Learning Course',
  description: 'Template pour apprentissage langues - Style Duolingo gamifié',
  category: 'course',
  subCategory: 'languages',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['language', 'learning', 'duolingo', 'english', 'gamification'], tier: 'free', designStyle: 'playful', industry: 'education', language: 'fr', isPopular: true, usageCount: 5432, rating: 4.9, reviewCount: 987, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1280&h=720'] },
  data: {
    productName: '{{ course_name }}',
    slug: '{{ course_name | slugify }}',
    shortDescription: 'Apprenez une langue de façon ludique et efficace. Méthode gamifiée prouvée.',
    longDescription: `# 🌍 MAÎTRISEZ UNE NOUVELLE LANGUE\n\n## Méthode Gamifiée\n\nApprentissage **interactif et amusant** avec système de points, niveaux et défis quotidiens !\n\n### Programme\n- 🗣️ Conversation pratique\n- 📚 Grammaire interactive\n- 🎧 Compréhension orale\n- ✍️ Exercices écriture\n- 🏆 Défis & compétitions\n\n## 🎯 Niveaux: A1 → C2\n\n**15min/jour** suffisent ! Progrès garantis en {{ guarantee_weeks }} semaines.\n\n## 💰 Gratuit ou Premium {{ price }}€/mois\n\n---\n\n**Commencez aujourd'hui !** 🚀`,
    price: 12.99,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1280&h=720&fit=crop', alt: 'Language Learning', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#58CC02', secondary: '#89E219', accent: '#FFC800', background: '#FFFFFF', text: '#4B4B4B' },
    seo: { metaTitle: 'Apprendre {{ language }} | Méthode Ludique Duolingo | 15min/jour', metaDescription: 'Cours de {{ language }} gamifié. Méthode prouvée, progrès garantis. Gratuit ou Premium {{ price }}€/mois.', keywords: ['langue', 'apprentissage', 'duolingo', 'gamification', 'cours en ligne'] },
    course: { level: 'beginner-to-advanced', duration: 12, durationUnit: 'months', totalHours: 200, format: ['interactive', 'audio', 'quizzes', 'games'], certificate: true, modules: [{ id: 'basics', name: 'Bases', lessons: 50, duration: 4, durationUnit: 'weeks' }, { id: 'intermediate', name: 'Intermédiaire', lessons: 100, duration: 16, durationUnit: 'weeks' }, { id: 'advanced', name: 'Avancé', lessons: 100, duration: 16, durationUnit: 'weeks' }], pricing: [{ id: 'free', name: 'Gratuit', price: 0, description: 'Accès de base' }, { id: 'premium', name: 'Premium', price: 12.99, description: 'Mensuel, sans pub', isPopular: true }] },
  },
};

export default languageLearningTemplate;

