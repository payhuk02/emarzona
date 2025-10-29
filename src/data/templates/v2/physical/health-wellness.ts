import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #15: HEALTH & WELLNESS (PREMIUM)
 * Inspired by: GNC
 * Design: Health-focused, scientific, trustworthy
 * Perfect for: Supplements, vitamins, wellness products, health items
 * Tier: Premium
 */
export const healthWellnessTemplate: Template = {
  id: 'physical-health-wellness-gnc',
  name: 'Health & Wellness Products',
  description: 'Template PREMIUM pour produits santé et bien-être - Style GNC scientifique et fiable',
  category: 'physical',
  subCategory: 'health-wellness',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'health', 'wellness', 'supplements', 'vitamins', 'nutrition',
      'gnc', 'fitness', 'dietary', 'natural', 'organic',
      'science-based', 'certified', 'pharmaceutical', 'nutraceutical'
    ],
    difficulty: 'intermediate',
    estimatedSetupTime: 5,
    requiredFields: ['name', 'price', 'ingredients', 'dosage', 'certifications'],
    optionalFields: ['clinical_studies', 'nutritionist_approved', 'allergens'],
    isPopular: true,
    isFeatured: true,
    usageCount: 1876,
    rating: 4.9,
    reviewCount: 432,
    lastUpdated: '2025-01-15',
    tier: 'premium',
    designStyle: 'clean',
    industry: 'health-wellness',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=720',
      'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Complément alimentaire premium basé sur la science, certifié et testé en laboratoire pour des résultats optimaux.',
    longDescription: `# 💊 VOTRE SANTÉ, NOTRE PRIORITÉ

## {{ product_name }} - Science-Based Wellness

Complément alimentaire **premium de qualité pharmaceutique**, formulé par des experts en nutrition et validé par des études cliniques.

## 🔬 BASÉ SUR LA SCIENCE

Notre formulation repose sur des **recherches scientifiques rigoureuses** et des études cliniques publiées. Chaque ingrédient est sélectionné pour son efficacité prouvée.

### Études Cliniques
__if__ {{ has_clinical_studies }}
- **Étude 1:** {{ study_1_name }} - {{ study_1_result }}
- **Étude 2:** {{ study_2_name }} - {{ study_2_result }}
- **Étude 3:** {{ study_3_name }} - {{ study_3_result }}

**Publications:** Références disponibles sur demande
__endif__

## ✨ BÉNÉFICES PROUVÉS

__for__ benefit in benefits_list
✅ **{{ benefit.title }}**  
{{ benefit.description }}  
_Efficacité prouvée après {{ benefit.timeframe }}_
__endfor__

## 🧪 COMPOSITION SCIENTIFIQUE

### Ingrédients Actifs (Par Dose)

__for__ ingredient in active_ingredients
**{{ ingredient.name }}** - {{ ingredient.dosage }}mg
- Source: {{ ingredient.source }}
- Biodisponibilité: {{ ingredient.bioavailability }}%
- Bénéfice: {{ ingredient.benefit }}
- Étude: {{ ingredient.study_ref }}
__endfor__

### Formule Synergique

Notre formule utilise le principe de **synergie nutritionnelle**: les ingrédients sont combinés pour maximiser leur absorption et efficacité mutuelle.

## 📊 TABLEAU NUTRITIONNEL

| Nutriment | Par Dose | % VNR* |
|-----------|----------|---------|
__for__ nutrient in nutritional_facts
| {{ nutrient.name }} | {{ nutrient.amount }}{{ nutrient.unit }} | {{ nutrient.vnr }}% |
__endfor__

*VNR = Valeurs Nutritionnelles de Référence

## 🎯 POUR QUI ?

### Profil Idéal
- **Âge:** {{ target_age }}
- **Objectif:** {{ health_goal }}
- **Style de vie:** {{ lifestyle }}
- **Niveau activité:** {{ activity_level }}

### Cas d'Usage
✅ {{ use_case_1 }}  
✅ {{ use_case_2 }}  
✅ {{ use_case_3 }}  
✅ {{ use_case_4 }}  

## 💊 POSOLOGIE & UTILISATION

### Dosage Recommandé
**Dose standard:** {{ standard_dosage }} {{ dosage_unit }} par jour

**Quand prendre:**
- ⏰ **Matin:** {{ morning_dose }} (avec petit-déjeuner)
- 🌞 **Midi:** {{ noon_dose }} (avec repas)
- 🌙 **Soir:** {{ evening_dose }} (avec dîner)

### Instructions Détaillées
1. Prendre avec un grand verre d'eau (250ml minimum)
2. Consommer pendant ou immédiatement après un repas
3. Ne pas dépasser la dose recommandée
4. Utilisation continue recommandée: {{ recommended_duration }}

### Cyclage (Si Applicable)
__if__ {{ requires_cycling }}
- **Phase 1 ({{ cycle_phase_1_duration }}):** {{ cycle_phase_1_dosage }}
- **Phase 2 ({{ cycle_phase_2_duration }}):** {{ cycle_phase_2_dosage }}
- **Pause:** {{ cycle_break_duration }}
__endif__

## 🏆 CERTIFICATIONS & QUALITÉ

Nous garantissons la plus haute qualité :

✅ **GMP Certified** - Bonnes Pratiques de Fabrication  
✅ **ISO 22000** - Management sécurité alimentaire  
✅ **NSF Certified** - Testé et vérifié par tiers indépendant  
✅ **USDA Organic** - Ingrédients biologiques certifiés  
✅ **Non-GMO Project** - Sans OGM vérifié  
✅ **Vegan Society** - 100% végétalien (si applicable)  
✅ **Halal/Kosher** - Certifications religieuses (si applicable)  

### Tests de Qualité
- 🔬 **Pureté:** Testée à 99.9%
- 🧫 **Contaminants:** Aucun métaux lourds détecté
- 🧪 **Potency:** Dosage garanti ±5%
- 📋 **Third-party tested:** Laboratoire indépendant

## ⚕️ APPROUVÉ PAR DES EXPERTS

> "{{ product_name }} est formulé selon les dernières recherches en nutrition. Je le recommande à mes patients." - **Dr. {{ expert_1_name }}, Nutritionniste certifié**

> "Ingrédients de qualité pharmaceutique, dosages optimaux. Une référence dans sa catégorie." - **{{ expert_2_name }}, Pharmacien**

> "Efficacité cliniquement prouvée. J'utilise ce produit personnellement et le conseille." - **{{ expert_3_name }}, Coach sportif certifié**

## ⚠️ SÉCURITÉ & CONTRE-INDICATIONS

### Contre-Indications
__for__ contraindication in contraindications_list
- ⚠️ {{ contraindication }}
__endfor__

### Interactions Médicamenteuses
Consultez votre médecin si vous prenez :
__for__ interaction in drug_interactions
- {{ interaction }}
__endfor__

### Effets Secondaires Possibles
Rares (< 2% des utilisateurs) :
__for__ side_effect in side_effects
- {{ side_effect }}
__endfor__

**Important:** Ce produit ne remplace pas une alimentation équilibrée et un mode de vie sain.

## 🌱 ENGAGEMENT PURETÉ

### Sans Additifs Nocifs
❌ Sans gluten  
❌ Sans lactose  
❌ Sans soja  
❌ Sans sucre ajouté  
❌ Sans colorants artificiels  
❌ Sans conservateurs  
❌ Sans OGM  

### Traçabilité Totale
- 📍 **Origine ingrédients:** Traçable jusqu'à la source
- 🏭 **Fabrication:** France/UE certifiée
- 🔍 **Lot tracking:** Code traçabilité sur chaque boîte
- 📊 **Analyses:** Résultats consultables en ligne

## 📦 CONTENU & CONSERVATION

**Contenu de la boîte:**
- {{ servings_per_container }} doses
- {{ container_type }} ({{ container_material }})
- Notice d'utilisation détaillée
- Cuillère doseuse (si applicable)
- Certificat d'authenticité

**Conservation:**
- 🌡️ Température: 15-25°C
- 💧 À l'abri de l'humidité
- ☀️ Protégé de la lumière directe
- 🔒 Hors de portée des enfants
- ⏰ DDM: {{ expiry_months }} mois après ouverture

## 💳 OPTIONS D'ACHAT

### Achat Unique
**{{ price }}€** - Livraison {{ shipping_days }} jours

### Abonnement Intelligent (-20%)
**{{ subscription_price }}€/mois**
- 💰 Économisez 20% automatiquement
- 📅 Livraison récurrente personnalisable
- ⚡ Aucun engagement, annulation à tout moment
- 🎁 Cadeaux exclusifs abonnés

### Pack Cure Complète (-25%)
**{{ cure_price }}€** pour {{ cure_duration }} mois
- 💰 Meilleure valeur: -25%
- 📦 Livraison groupée ou échelonnée
- 🎯 Résultats optimaux garantis
- 🔄 Satisfait ou remboursé

## 📞 SUPPORT NUTRITIONNISTE

**Besoin de conseils personnalisés ?**

- 📧 **Email:** nutrition@payhuk.com
- 📞 **Hotline:** 01 23 45 67 89 (Lun-Sam 9h-19h)
- 💬 **Chat nutritionniste:** En direct 7j/7
- 📅 **Consultation gratuite:** Réservez votre créneau

## 🛡️ GARANTIES

- ✅ **Satisfait ou remboursé 60 jours**
- ✅ **Expédition sous 24h** (commande avant 14h)
- ✅ **Livraison gratuite** dès 50€
- ✅ **Emballage discret** garanti
- ✅ **Paiement 100% sécurisé**

## 🌟 RÉSULTATS ATTENDUS

### Timeline Typique

**Semaine 1-2:** {{ timeline_week_1_2 }}  
**Semaine 3-4:** {{ timeline_week_3_4 }}  
**Mois 2-3:** {{ timeline_month_2_3 }}  
**Après 3 mois:** {{ timeline_after_3_months }}  

**Note:** Les résultats varient selon les individus. Respectez la posologie pour des résultats optimaux.

## ⭐ AVIS VÉRIFIÉS

> "Résultats visibles après 3 semaines. Je recommande vivement !" - **Marc, 42 ans** ⭐⭐⭐⭐⭐

> "Enfin un complément qui tient ses promesses. Qualité au top." - **Sophie, 35 ans** ⭐⭐⭐⭐⭐

> "Changement notable sur mon énergie. Je ne m'en passe plus !" - **Thomas, 51 ans** ⭐⭐⭐⭐⭐

---

**"LIVE WELL"** - Investissez dans votre santé aujourd'hui ! 💪`,
    
    price: 49.99,
    compareAtPrice: 79.99,
    currency: 'EUR',
    
    sku: 'HEALTH-{{ category }}-{{ product_code }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 150,
    allowBackorder: true,
    
    weight: 0.35,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Packaging et présentation',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails du produit et ingrédients',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Certifications et qualité',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=health-benefits-explained',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#FF9900',      // GNC Gold
      secondary: '#000000',    // Black
      accent: '#0071CE',       // Trust Blue
      background: '#FFFFFF',
      text: '#333333',
      success: '#00A650',
      warning: '#FF9900',
      error: '#CC0000',
    },
    
    typography: {
      fontFamily: 'Montserrat, Helvetica, sans-serif',
      headingFont: 'Montserrat, sans-serif',
      bodyFont: 'Open Sans, sans-serif',
      fontSize: {
        base: '16px',
        heading: '30px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 600,
        bold: 700,
      },
    },
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ product_name }} - Complément Premium Certifié | Science-Based | Payhuk',
      metaDescription: 'Achetez {{ product_name }}, complément alimentaire premium certifié GMP. Formule scientifique, ingrédients purs, testé en labo. Satisfait ou remboursé 60 jours.',
      keywords: [
        'health supplements',
        'wellness products',
        'gnc style',
        'vitamins',
        'nutritional supplements',
        'certified supplements',
        'pharmaceutical grade',
        'science-based nutrition',
      ],
      ogImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Ce produit est-il sûr ?',
        answer: 'Oui, 100% sûr. Certifié GMP, ISO 22000, testé par laboratoire tiers indépendant. Aucun contaminant ni métaux lourds. Conforme à toutes les réglementations européennes.',
      },
      {
        question: 'Combien de temps avant de voir des résultats ?',
        answer: 'La plupart des utilisateurs constatent des premiers effets après 2-3 semaines. Les résultats optimaux sont généralement atteints après 2-3 mois d\'utilisation continue.',
      },
      {
        question: 'Puis-je prendre ce produit avec d\'autres compléments ?',
        answer: 'Généralement oui, mais consultez votre médecin ou notre nutritionniste pour valider la compatibilité avec vos autres suppléments ou médicaments.',
      },
      {
        question: 'D\'où proviennent les ingrédients ?',
        answer: 'Tous nos ingrédients proviennent de sources premium certifiées: USA, Europe, Nouvelle-Zélande. Traçabilité totale de la source à la boîte.',
      },
      {
        question: 'Y a-t-il des effets secondaires ?',
        answer: 'Effets secondaires très rares (< 2%). Possible: légers troubles digestifs les premiers jours. Si persistants, arrêter et consulter un médecin.',
      },
      {
        question: 'Garantie satisfait ou remboursé ?',
        answer: 'Oui, 60 jours satisfait ou remboursé. Si vous n\'êtes pas satisfait des résultats, retour gratuit et remboursement intégral, même si la boîte est entamée.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'health_goal',
        label: 'Objectif santé',
        value: 'Énergie & Vitalité',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'servings_per_container',
        label: 'Nombre de doses',
        value: '60',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'clinically_tested',
        label: 'Testé cliniquement',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'third_party_tested',
        label: 'Testé par tiers',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'vegan',
        label: 'Végétalien',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'gluten_free',
        label: 'Sans gluten',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'gmp_certified',
        label: 'Certifié GMP',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 10,
        width: 10,
        height: 12,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 12,
        width: 12,
        height: 14,
        weight: 0.4,
        unit: 'cm',
      },
      
      shippingClass: 'standard',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 6.90,
      
      isFragile: false,
      requiresAssembly: false,
      assemblyDifficulty: 'none',
      assemblyTime: 0,
      
      materials: [
        'Capsules végétales',
        'Ingrédients actifs premium',
        'Flacon HDPE alimentaire',
        'Emballage recyclable',
      ],
      
      colors: ['Standard'],
      sizes: ['60 capsules', '120 capsules', '180 capsules'],
      
      warranty: {
        duration: 60,
        unit: 'days',
        type: 'satisfaction',
        coverage: 'Satisfait ou remboursé intégral',
      },
      
      countryOfOrigin: 'France',
      manufacturer: 'NutriScience Labs France SAS',
      
      certifications: ['GMP', 'ISO 22000', 'NSF', 'USDA Organic', 'Non-GMO', 'Vegan Society'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Conserver dans un endroit frais et sec (15-25°C)',
        'Tenir hors de portée des enfants',
        'Refermer hermétiquement après chaque utilisation',
        'Protéger de la lumière directe du soleil',
        'Ne pas réfrigérer sauf indication contraire',
        'À consommer avant la date indiquée',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 150,
        lowStockThreshold: 30,
        allowBackorder: true,
        backorderMessage: 'Disponible en précommande - Livraison sous 7 jours',
        maxOrderQuantity: 10,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-60',
          name: '60 capsules - 1 mois',
          sku: 'HEALTH-ENERGY-60',
          price: 49.99,
          compareAtPrice: 79.99,
          color: 'Standard',
          size: '60 caps',
          inventory: 80,
          image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600',
        },
        {
          id: 'var-120',
          name: '120 capsules - 2 mois (Populaire)',
          sku: 'HEALTH-ENERGY-120',
          price: 89.99,
          compareAtPrice: 149.99,
          color: 'Standard',
          size: '120 caps',
          inventory: 50,
          image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=600',
        },
        {
          id: 'var-180',
          name: '180 capsules - 3 mois (Meilleure valeur -25%)',
          sku: 'HEALTH-ENERGY-180',
          price: 119.99,
          compareAtPrice: 219.99,
          color: 'Standard',
          size: '180 caps',
          inventory: 20,
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600',
        },
      ],
    },
  },
};

export default healthWellnessTemplate;

