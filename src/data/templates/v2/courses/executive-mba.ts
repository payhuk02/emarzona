import { Template } from '@/types/templates-v2';

export const executiveMBATemplate: Template = {
  id: 'course-executive-mba-harvard',
  name: 'Executive MBA (PREMIUM)',
  description: 'Template PREMIUM Executive MBA - Style Harvard Business School prestigieux',
  category: 'course',
  subCategory: 'executive-education',
  metadata: { version: '2.0.0', author: 'Payhuk Templates', tags: ['mba', 'executive', 'harvard', 'business-school', 'leadership'], tier: 'premium', designStyle: 'luxury', industry: 'executive-education', language: 'fr', isPopular: true, isFeatured: true, usageCount: 1234, rating: 5.0, reviewCount: 289, lastUpdated: '2025-01-15', previewImages: ['https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1280&h=720'] },
  data: { productName: '{{ course_name }}', slug: '{{ course_name | slugify }}', shortDescription: 'Executive MBA niveau Harvard. Professeurs Ivy League, réseau international, transformation leadership.', longDescription: `# 🎩 EXECUTIVE MBA NIVEAU IVY LEAGUE\n\n## Programme d'Excellence\n\nMBA **exécutif prestige** avec professeurs top universités mondiales\n\n### Curriculum\n- 💼 Strategic Management\n- 📊 Financial Leadership\n- 🌍 Global Business\n- 🤝 Organizational Behavior\n- 🚀 Innovation & Entrepreneurship\n- 👔 Executive Presence\n\n## 🌐 Réseau International\n\n- {{ alumni_count }}+ Alumni network\n- {{ partner_schools }} écoles partenaires\n- {{ countries }} pays représentés\n- Accès exclusif événements C-level\n\n## 🏆 Transformation Garantie\n\n**{{ promotion_rate }}%** promo/augmentation sous {{ promotion_months }} mois\n\n### Format Executive\n- 🏢 Compatible carrière (weekends)\n- 🌍 Résidentiels internationaux\n- 🎯 Projets entreprise réels\n- 👥 Cohorte executives sélectionnés\n\n## 💎 Investissement: {{ price }}€\n\nFinancement entreprise disponible\n\n### Inclus\n- ✅ Diplôme MBA certifié\n- ✅ Accès lifetime alumni network\n- ✅ Executive coaching 1-on-1\n- ✅ Résidentiels Boston/Paris/Singapore\n- ✅ Capstone project avec C-suite\n\n## 📊 Profil Participants\n\n- **Âge moyen**: {{ average_age }} ans\n- **Expérience**: {{ average_experience }}+ ans\n- **Niveau**: Director/VP/C-Level\n- **Salaire moyen**: {{ average_salary }}€\n\n## 🎯 Admissions Sélectives\n\nTaux d'acceptation: {{ acceptance_rate }}%\n\n### Process\n1. **Application** - CV + essays + recommandations\n2. **GMAT/GRE** - Waiver possible si expérience\n3. **Entretien** - Panel admissions\n4. **Décision** - Sous 4 semaines\n\n**Prochaine cohorte:** {{ next_cohort_date }}\n\n---\n\n**Rejoignez l'élite business mondiale** 🌍`,
    price: 89000.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1280&h=720&fit=crop', alt: 'Executive MBA', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#A51C30', secondary: '#000000', accent: '#D4A017', background: '#FFFFFF', text: '#000000' },
    seo: { metaTitle: 'Executive MBA | Harvard Style | Programme Prestige | Leadership International', metaDescription: 'Executive MBA niveau Ivy League. Professeurs top universités, réseau {{ alumni_count }}+ alumni. {{ price }}€.', keywords: ['executive mba', 'harvard', 'business school', 'leadership', 'ivy league'] },
    course: { level: 'executive', duration: 18, durationUnit: 'months', totalHours: 900, format: ['in-person', 'hybrid', 'residentials', 'coaching'], certificate: true, pricing: [{ id: 'emba', name: 'Executive MBA', price: 89000, description: 'Programme complet 18 mois', isPopular: true }] },
  },
};

export default executiveMBATemplate;

