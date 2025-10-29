import { Template } from '@/types/templates-v2';

export const fitnessTrainingTemplate: Template = {
  id: 'course-fitness-peloton',
  name: 'Fitness Training Course',
  description: 'Template fitness - Style Peloton motivant',
  category: 'course',
  subCategory: 'fitness',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['fitness', 'training', 'peloton', 'workout', 'health'], tier: 'free', designStyle: 'energetic', industry: 'fitness', language: 'fr', isPopular: true, usageCount: 6543, rating: 4.9, reviewCount: 1234, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Programme fitness complet. Coaching live, communauté motivante, résultats garantis.', longDescription: `# 💪 TRANSFORMEZ VOTRE CORPS\n\n## Programme Complet\n\n- 🏃 Cardio intensif\n- 💪 Renforcement musculaire\n- 🧘 Yoga & stretching\n- 🎯 Nutrition personnalisée\n- 📊 Suivi progrès\n\n## 🔥 Cours Live Quotidiens\n\n{{ live_classes_per_day }}+ cours live par jour\n\n## 💰 {{ price }}€/mois\n\n---\n\n**Commencez votre transformation !** 💪`, price: 39.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1280&h=720&fit=crop', alt: 'Fitness', isPrimary: true, sortOrder: 1 }], colors: { primary: '#000000', secondary: '#CB2026', accent: '#FFFFFF', background: '#000000', text: '#FFFFFF' }, seo: { metaTitle: 'Programme Fitness Live | Coaching Peloton Style | Transformation Garantie', metaDescription: 'Cours fitness live quotidiens. Cardio, muscu, yoga. Communauté motivante. {{ price }}€/mois.', keywords: ['fitness', 'peloton', 'workout', 'coaching', 'live'] }, course: { level: 'all-levels', duration: 12, durationUnit: 'months', totalHours: 365, format: ['live', 'on-demand', 'community'], certificate: false, pricing: [{ id: 'monthly', name: 'Mensuel', price: 39, description: 'Accès illimité' }] } },
};

export default fitnessTrainingTemplate;

