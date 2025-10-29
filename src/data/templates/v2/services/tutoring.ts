import { Template } from '@/types/templates-v2';

export const tutoringTemplate: Template = {
  id: 'service-tutoring-wyzant',
  name: 'Tutoring & Academic Support',
  description: 'Template professionnel pour services de tutorat - Style Wyzant éducatif',
  category: 'service',
  subCategory: 'education',
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['tutoring', 'education', 'academic', 'learning', 'teaching', 'wyzant', 'homework', 'exam'],
    tier: 'free',
    designStyle: 'educational',
    industry: 'education',
    language: 'fr',
    isPopular: true,
    usageCount: 2987,
    rating: 4.9,
    reviewCount: 542,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720'],
  },
  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Cours particuliers professionnels tous niveaux. Pédagogie adaptée, résultats garantis.',
    longDescription: `# 📚 RÉUSSITE SCOLAIRE GARANTIE

## {{ service_name }} - Expertise Pédagogique

Cours particuliers **personnalisés et efficaces** avec professeurs certifiés pour tous niveaux.

## 🎯 MATIÈRES ENSEIGNÉES

### Sciences
- 🧮 Mathématiques (Collège → Prépa)
- ⚗️ Physique-Chimie
- 🧬 SVT / Biologie
- 💻 Informatique & Programmation

### Langues
- 🇬🇧 Anglais (A1 → C2)
- 🇪🇸 Espagnol
- 🇩🇪 Allemand
- 🇨🇳 Mandarin

### Humanités
- 📖 Français & Littérature
- 🏛️ Histoire-Géographie
- 💭 Philosophie
- 💼 Économie

## 💡 NOTRE APPROCHE

✅ **Diagnostic gratuit** - Évaluation initiale  
✅ **Programme personnalisé** - Adapté au profil  
✅ **Pédagogie active** - Exercices pratiques  
✅ **Suivi régulier** - Progression mesurée  
✅ **Support continu** - Questions entre cours  

## 📦 FORMULES

### 🌱 Forfait Découverte
**{{ price_discovery }}€** (4 cours)
- 4×1h de cours
- Bilan de compétences
- Supports inclus
- Essai sans engagement

### 🚀 Forfait Intensif
**{{ price_intensive }}€** (12 cours)
- 12×1.5h de cours
- Programme sur-mesure
- Suivi parents inclus
- Exercices illimités
- **POPULAIRE**

### 🎓 Forfait Excellence
**{{ price_excellence }}€** (24 cours)
- 24×2h de cours
- Coaching méthodologie
- Préparation examens
- Accès plateforme 24/7
- Garantie progression

## 👨‍🏫 NOS PROFESSEURS

- 🎓 **Diplômés Bac+5** minimum
- 📜 **Certifiés** Éducation Nationale ou équivalent
- ⭐ **Expérience** {{ years_experience }}+ ans
- 💯 **Taux réussite** {{ success_rate }}%

## 📊 RÉSULTATS

**{{ successful_students }}+ élèves accompagnés**
- 📈 **+2.5 points** de moyenne en 3 mois
- 🎯 **{{ success_rate }}%** de réussite aux examens
- ⭐ **{{ satisfaction_rate }}%** de satisfaction

## 📱 FORMAT

- 🎥 **Visio** - Cours interactifs en ligne
- 🏫 **À domicile** - Confort de la maison
- 📚 **En centre** - Espace dédié

## 📞 BILAN GRATUIT

Évaluation initiale offerte sans engagement !

📧 {{ email }}  
📞 {{ phone }}

---

**La réussite commence ici !** 🎓`,
    price: 35.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1280&h=720&fit=crop', alt: 'Tutoring', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#00A896', secondary: '#028090', accent: '#F0F3BD', background: '#FFFFFF', text: '#212121' },
    seo: { metaTitle: 'Cours Particuliers Tous Niveaux | Prof Certifiés | Résultats Garantis', metaDescription: 'Cours particuliers professionnels. Maths, sciences, langues. Professeurs certifiés, {{ success_rate }}% réussite. Bilan gratuit.', keywords: ['cours particuliers', 'tutoring', 'soutien scolaire', 'wyzant', 'prof à domicile'] },
    service: { duration: 60, durationUnit: 'minutes', packages: [
      { id: 'discovery', name: 'Découverte', price: 120, sessions: 4, description: '4 cours d\'1h' },
      { id: 'intensive', name: 'Intensif', price: 450, sessions: 12, description: '12 cours', isPopular: true },
      { id: 'excellence', name: 'Excellence', price: 840, sessions: 24, description: '24 cours + coaching' },
    ]},
  },
};

export default tutoringTemplate;

