import { Template } from '@/types/templates-v2';

export const creativeSkillsTemplate: Template = {
  id: 'course-creative-skillshare',
  name: 'Creative Skills Course',
  description: 'Template créatif - Style Skillshare inspirant',
  category: 'course',
  subCategory: 'creative',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['creative', 'design', 'skillshare', 'art', 'illustration'], tier: 'free', designStyle: 'creative', industry: 'creative', language: 'fr', isPopular: true, usageCount: 4321, rating: 4.8, reviewCount: 765, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Apprenez skills créatifs avec artistes professionnels. Projets pratiques, communauté créative.', longDescription: `# 🎨 LIBÉREZ VOTRE CRÉATIVITÉ\n\n## Cours Créatifs\n\n- 🎨 Design graphique\n- ✏️ Illustration\n- 📸 Photographie\n- 🎬 Vidéo & animation\n- ✍️ Écriture créative\n\n## {{ classes_count }}+ Cours Disponibles\n\nProjets pratiques guidés par créateurs pros\n\n## 💰 {{ price }}€/mois accès illimité\n\n---\n\n**Créez aujourd'hui !** 🚀`, price: 19.00, currency: 'EUR', images: [{ url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1280&h=720&fit=crop', alt: 'Creative', isPrimary: true, sortOrder: 1 }], colors: { primary: '#00D9AF', secondary: '#110F0E', accent: '#FFB81C', background: '#FFFFFF', text: '#110F0E' }, seo: { metaTitle: 'Cours Créatifs | Design, Photo, Vidéo | Skillshare Style', metaDescription: 'Apprenez skills créatifs. {{ classes_count }}+ cours, projets pratiques. {{ price }}€/mois illimité.', keywords: ['créatif', 'design', 'skillshare', 'art', 'illustration'] }, course: { level: 'beginner-to-advanced', duration: 12, durationUnit: 'months', totalHours: 500, format: ['video', 'projects', 'community'], certificate: false, pricing: [{ id: 'monthly', name: 'Mensuel', price: 19, description: 'Accès illimité', isPopular: true }] } },
};

export default creativeSkillsTemplate;

