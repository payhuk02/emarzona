import { Template } from '@/types/templates-v2';

export const spaWellnessTemplate: Template = {
  id: 'service-spa-wellness-mindbody',
  name: 'Spa & Wellness Services',
  description: 'Template professionnel pour spa et bien-être - Style Mindbody relaxant',
  category: 'service',
  subCategory: 'wellness',
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    tags: ['spa', 'wellness', 'massage', 'relaxation', 'mindbody', 'beauty', 'zen', 'treatment'],
    tier: 'free',
    designStyle: 'zen',
    industry: 'wellness',
    language: 'fr',
    isPopular: true,
    usageCount: 3654,
    rating: 4.9,
    reviewCount: 789,
    lastUpdated: '2025-01-15',
    previewImages: ['https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1280&h=720'],
  },
  data: {
    productName: '{{ service_name }}',
    slug: '{{ service_name | slugify }}',
    shortDescription: 'Spa professionnel et soins bien-être. Échappez au stress, retrouvez l\'harmonie.',
    longDescription: `# 🧘 VOTRE SANCTUAIRE DE BIEN-ÊTRE

## {{ service_name }} - L'Art du Bien-Être

Un **havre de paix** où se ressourcer et prendre soin de soi. Soins professionnels dans une ambiance zen.

## 💆 NOS SOINS

### Massages
- 🌸 **Suédois** - Relaxation profonde
- 🔥 **Pierres chaudes** - Détente musculaire
- 🌿 **Aromathérapie** - Équilibre énergétique
- 💆 **Californien** - Douceur enveloppante
- 🎋 **Shiatsu** - Pressions japonaises

### Soins Visage
- ✨ **Soin hydratant** - Éclat & fraîcheur
- 🌟 **Anti-âge** - Raffermissant
- 🧖 **Purifiant** - Peau nette
- 💎 **Luxe signature** - Soin d'exception

### Soins Corps
- 🌊 **Gommage** - Peau douce
- 🍯 **Enveloppement** - Nutrition intense
- 🧂 **Balnéo** - Détox & drainage
- 🌺 **Rituel** - Expérience complète

## 💎 FORFAITS ZEN

### 🌸 Forfait Évasion (1h30)
**{{ price_evasion }}€**
- Massage 60 min
- Accès hammam/sauna
- Thé & collation
- Peignoir fourni

### 🌟 Forfait Harmonie (3h)
**{{ price_harmony }}€**
- Gommage corps
- Soin visage
- Massage 60 min
- Accès spa
- **BESTSELLER**

### 👑 Forfait Royauté (5h)
**{{ price_royalty }}€**
- Rituel complet corps
- Soin visage luxe
- Massage pierres chaudes
- Manucure & pédicure
- Accès privatif spa
- Déjeuner zen inclus

## ✨ L'EXPÉRIENCE

Dès votre arrivée :
- 🍵 Accueil avec tisane bio
- 🛁 Accès espaces détente
- 🎶 Ambiance musicale apaisante
- 🕯️ Aromathérapie subtile
- 👘 Peignoir & chaussons fournis

## 🏆 NOTRE EXPERTISE

✅ **Praticiens certifiés** {{ certifications }}  
✅ **Produits bio** 100% naturels  
✅ **Équipements premium** Dernier cri  
✅ **Hygiène irréprochable** Normes strictes  
✅ **{{ years_experience }}+ ans** d'expérience  

## 🎁 CARTE CADEAU

Le cadeau parfait pour vos proches !
- Valable 1 an
- Tous soins
- Livraison immédiate
- Personnalisable

## ⭐ AVIS CLIENTS

> "Moment magique ! Personnel aux petits soins, ambiance parfaite." - **Sophie**

> "Meilleur massage de ma vie. Je reviens chaque mois !" - **Marie**

## 📅 RÉSERVATION

**Ouvert 7j/7** - 9h à 21h

📞 {{ phone }}  
📧 {{ email }}  
🌐 Réservation en ligne 24/7

**Offre spéciale : -20% sur votre 1ère visite !**

---

**Prenez soin de vous, vous le méritez** 🌸`,
    price: 120.00,
    currency: 'EUR',
    images: [{ url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1280&h=720&fit=crop', alt: 'Spa Wellness', isPrimary: true, sortOrder: 1 }],
    colors: { primary: '#8B7355', secondary: '#D4C5B9', accent: '#E8DED2', background: '#FAF8F5', text: '#4A4A4A' },
    seo: { metaTitle: 'Spa & Bien-Être | Massages, Soins | Ambiance Zen | {{ city }}', metaDescription: 'Spa professionnel. Massages, soins visage & corps. Praticiens certifiés, produits bio. Offre découverte -20%. Réservation en ligne.', keywords: ['spa', 'massage', 'bien-être', 'mindbody', 'relaxation', 'soins'] },
    service: { duration: 90, durationUnit: 'minutes', packages: [
      { id: 'evasion', name: 'Évasion', price: 120, sessions: 1, description: '1h30 massage + spa' },
      { id: 'harmony', name: 'Harmonie', price: 220, sessions: 1, description: '3h soins complets', isPopular: true },
      { id: 'royalty', name: 'Royauté', price: 450, sessions: 1, description: '5h expérience luxe' },
    ]},
  },
};

export default spaWellnessTemplate;

