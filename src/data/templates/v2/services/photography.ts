import { Template } from '@/types/templates-v2';

export const photographyTemplate: Template = {
  id: 'service-photography-shootproof',
  name: 'Professional Photography Services',
  description: 'Template professionnel pour services de photographie - Style Shootproof',
  category: 'service',
  subCategory: 'photography',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['photography', 'photo', 'shooting', 'wedding', 'portrait', 'shootproof', 'professional'],
    difficulty: 'intermediate',
    tier: 'free',
    designStyle: 'elegant',
    industry: 'creative',
    language: 'fr',
    isPopular: true,
    usageCount: 3421,
    rating: 4.9,
    reviewCount: 678,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1280&h=720'],
  },

  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Photographie professionnelle pour immortaliser vos moments précieux. Portfolio primé, style unique.',
    longDescription: `# 📸 IMMORTALISEZ VOS MOMENTS PRÉCIEUX

## {{ service_name }} - Photographie d'Art

Photographie **professionnelle et créative** pour capturer l'essence de vos moments inoubliables.

## 🎨 NOS SPÉCIALITÉS

### Mariages & Événements
- 💍 Mariages complets
- 💑 Fiançailles & pré-mariage
- 🎉 Événements familiaux
- 🎊 Célébrations privées

### Portraits
- 👤 Portraits individuels
- 👨‍👩‍👧‍👦 Photos de famille
- 👶 Nouveau-nés & grossesse
- 🎓 Portraits corporate

### Commercial
- 🏢 Architecture & immobilier
- 🍽️ Food photography
- 📦 Produits & e-commerce
- 🏭 Reportage entreprise

## 📦 NOS FORFAITS

### 🌟 Forfait Essentiel
**{{ price_essential }}€**
- 2h de shooting
- 50 photos retouchées
- Galerie en ligne privée
- Droits d'utilisation perso

### 💎 Forfait Premium
**{{ price_premium }}€**
- 4h de shooting
- 100 photos retouchées
- Tirage inclus
- Droits commerciaux
- **RECOMMANDÉ**

### 👑 Mariage Complet
**{{ price_wedding }}€**
- Journée complète
- 2 photographes
- 300+ photos retouchées
- Album luxe inclus
- Vidéo teaser

## ✨ NOTRE STYLE

Style **artistique et naturel** qui capture l'authenticité et l'émotion. Jeu de lumière, compositions créatives, moments spontanés.

## 📸 PROCESSUS

1. **Consultation** - Discutons de votre vision
2. **Réservation** - Acompte 30%
3. **Préparation** - Planning détaillé
4. **Shooting** - Magie opère
5. **Retouche** - Post-production pro
6. **Livraison** - Galerie en ligne + fichiers HD

## 🎁 INCLUS

✅ Retouche professionnelle  
✅ Galerie en ligne sécurisée  
✅ Téléchargement HD  
✅ Droit utilisation personnelle  
✅ Sauvegarde 5 ans  

## ⭐ {{ satisfied_clients }}+ CLIENTS SATISFAITS

> "Photos absolument magnifiques ! Professionnalisme exceptionnel." - **Sophie M.**

> "A capturé l'essence de notre mariage. Merci !" - **Marc & Julie**

## 📞 RÉSERVEZ VOTRE SESSION

📧 **Email:** {{ email }}  
📞 **Téléphone:** {{ phone }}  
📱 **Instagram:** @{{ instagram }}  

**Portfolio complet sur demande**

---

**Votre histoire mérite d'être racontée en images** 📷`,
    
    price: 450.00,
    currency: 'EUR',
    
    images: [{
      url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1280&h=720&fit=crop',
      alt: 'Professional Photography',
      isPrimary: true,
      sortOrder: 1,
    }],
    
    colors: { primary: '#2C2C2C', secondary: '#D4AF37', accent: '#FFFFFF', background: '#F8F8F8', text: '#2C2C2C' },
    seo: {
      metaTitle: '{{ service_name }} - Photographe Professionnel | Mariages, Portraits, Events',
      metaDescription: 'Photographie professionnelle. Mariages, portraits, événements. Style artistique unique. {{ years_experience }}+ ans expérience. Portfolio primé.',
      keywords: ['photographe', 'photography', 'mariage', 'portrait', 'shootproof', 'professionnel'],
    },
    
    service: {
      duration: 120,
      durationUnit: 'minutes',
      packages: [
        { id: 'essential', name: 'Essentiel', price: 450, sessions: 1, description: '2h shooting + 50 photos' },
        { id: 'premium', name: 'Premium', price: 850, sessions: 1, description: '4h shooting + 100 photos', isPopular: true },
        { id: 'wedding', name: 'Mariage Complet', price: 2500, sessions: 1, description: 'Journée complète + album' },
      ],
    },
  },
};

export default photographyTemplate;

