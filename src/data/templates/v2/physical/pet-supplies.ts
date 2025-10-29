import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #10: PET SUPPLIES
 * Inspired by: Chewy
 * Design: Friendly, caring, pet-focused
 * Perfect for: Pet food, toys, accessories, health products
 * Tier: Free
 */
export const petSuppliesTemplate: Template = {
  id: 'physical-pet-supplies-chewy',
  name: 'Pet Supplies & Accessories',
  description: 'Template professionnel pour produits animaliers - Style Chewy friendly et caring',
  category: 'physical',
  subCategory: 'pets',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'pet', 'supplies', 'animals', 'dog', 'cat', 'food',
      'toys', 'accessories', 'health', 'care', 'chewy',
      'friendly', 'caring', 'pet-lover', 'veterinary'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 3,
    requiredFields: ['name', 'price', 'pet_type', 'images'],
    optionalFields: ['ingredients', 'age_range', 'breed_size'],
    isPopular: true,
    isFeatured: true,
    usageCount: 3251,
    rating: 4.9,
    reviewCount: 524,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'playful',
    industry: 'pets',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1280&h=720',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Produit de qualité pour le bonheur et la santé de votre compagnon à 4 pattes. Approuvé par les vétérinaires.',
    longDescription: `# 🐾 Le Bonheur de Votre Compagnon Commence Ici

## **{{ product_name }}** - Qualité Premium pour Votre Animal

Offrez ce qu'il y a de meilleur à votre compagnon avec notre **{{ product_name }}**. Spécialement conçu pour répondre aux besoins nutritionnels et au bien-être de votre {{ pet_type }}.

## ❤️ Pourquoi Nos Clients L'Adorent

⭐⭐⭐⭐⭐ **4.9/5** - Plus de 500 avis clients  
🐕 **Approuvé vétérinaires** - Recommandé par des experts  
🌱 **Ingrédients naturels** - Sans OGM, sans colorants artificiels  
📦 **Livraison rapide** - Reçu en 24-48h partout en France  

## 🎯 Caractéristiques Clés

### Pour Qui ?
- **Espèce**: {{ pet_type }}
- **Âge**: {{ age_range }}
- **Taille**: {{ breed_size }}
- **Besoins spéciaux**: {{ special_needs }}

### Avantages
✅ **Santé optimale**: Formule équilibrée riche en nutriments essentiels  
✅ **Digestion facile**: Haute digestibilité pour un confort intestinal  
✅ **Pelage brillant**: Oméga 3 & 6 pour une peau saine  
✅ **Énergie durable**: Protéines de qualité pour la vitalité  
✅ **Goût irrésistible**: Même les plus difficiles l'adorent !  

## 🥩 Composition & Ingrédients

__if__ {{ product_type === 'food' }}
### Ingrédients Principaux
__for__ ingredient in main_ingredients
- **{{ ingredient.name }}** ({{ ingredient.percentage }}%) - {{ ingredient.benefit }}
__endfor__

### Analyse Nutritionnelle
| Nutriment | Quantité |
|-----------|----------|
| Protéines | {{ protein }}% |
| Matières grasses | {{ fat }}% |
| Fibres | {{ fiber }}% |
| Humidité | {{ moisture }}% |
| Cendres | {{ ash }}% |

### Additifs Nutritionnels
- Vitamines: A, D3, E
- Minéraux: Zinc, Fer, Cuivre, Manganèse
- Acides aminés: Taurine, L-Carnitine
__endif__

## 📏 Guide des Portions

__if__ {{ product_type === 'food' }}
| Poids de l'animal | Portion quotidienne |
|-------------------|---------------------|
| 1-5 kg | {{ portion_small }}g |
| 5-10 kg | {{ portion_medium }}g |
| 10-25 kg | {{ portion_large }}g |
| 25+ kg | {{ portion_xlarge }}g |

**Note**: Ajustez selon l'activité et la condition physique. Consultez votre vétérinaire.
__endif__

## 🏆 Garanties & Certifications

- ✅ **Sans OGM** - Ingrédients 100% naturels
- ✅ **Sans colorants artificiels** - Couleurs naturelles uniquement
- ✅ **Sans conservateurs** - Fraîcheur garantie par emballage hermétique
- ✅ **Testé en laboratoire** - Contrôle qualité rigoureux
- ✅ **Approuvé vétérinaires** - Recommandé par des experts
- ✅ **Fabriqué en France** - Traçabilité totale

## 💚 Engagement Bien-être Animal

Nous croyons que chaque animal mérite ce qu'il y a de meilleur :
- 🌾 Ingrédients sourcés de fermes responsables
- 🔬 Recherche continue pour l'amélioration nutritionnelle
- 🐾 1% des ventes reversé à des refuges animaliers
- ♻️ Emballage recyclable et éco-responsable

## 📦 Livraison & Conservation

**Livraison:**
- 🚚 Gratuite dès 49€ d'achat
- 📦 Colis reçu sous 24-48h
- 🏠 Livraison à domicile ou en point relais
- ❄️ Produits frais livrés en emballage isotherme

**Conservation:**
- 📍 Conserver dans un endroit frais et sec
- 🔒 Refermer hermétiquement après ouverture
- ⏰ À consommer avant: {{ expiry_date }}
- ♻️ Emballage refermable pour garder la fraîcheur

## 🎁 Programme de Fidélité

**Abonnez-vous et économisez 15% !**
- 💰 Réduction automatique sur chaque commande
- 📅 Livraison récurrente à la fréquence de votre choix
- ⚡ Aucun engagement - Modifiez ou annulez à tout moment
- 🎁 Cadeaux surprises dans votre colis

## 🐶 Avis de la Communauté

> "Mon chien en raffole ! Depuis qu'il mange ces croquettes, son pelage est plus brillant et il a plus d'énergie." - **Marie, propriétaire de Golden Retriever**

> "Enfin un produit de qualité à prix abordable. Je recommande les yeux fermés !" - **Thomas, propriétaire de chat**

> "Ma chienne difficile les adore ! Plus aucun souci de digestion." - **Sophie, propriétaire de Bouledogue**

## 🆘 Support Client Dédié

Des questions ? Notre équipe d'experts est là pour vous aider !
- 📞 **Hotline**: 01 23 45 67 89 (Lun-Sam 9h-19h)
- 💬 **Chat en direct**: 7j/7 de 8h à 22h
- 📧 **Email**: support@payhuk.com
- 🩺 **Conseil vétérinaire gratuit** disponible

---

**Garantie Satisfait ou Remboursé 30 jours** - Si votre compagnon n'aime pas, on vous rembourse !`,
    
    price: 39.99,
    compareAtPrice: 59.99,
    currency: 'EUR',
    
    sku: 'PET-{{ pet_type }}-{{ variant_id }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 250,
    allowBackorder: false,
    
    weight: 5,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Produit principal avec animal heureux',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails du produit et texture',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Animal utilisant le produit',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=happy-pet-demo',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#005EB8',      // Chewy Blue
      secondary: '#FF6F61',    // Coral (friendly)
      accent: '#FDB913',       // Golden yellow
      background: '#F7F9FC',   // Light blue-grey
      text: '#2C3E50',
      success: '#52C41A',
      warning: '#FAAD14',
      error: '#F5222D',
    },
    
    typography: {
      fontFamily: 'Poppins, Nunito, sans-serif',
      headingFont: 'Poppins, sans-serif',
      bodyFont: 'Nunito, sans-serif',
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
      metaTitle: '{{ product_name }} pour {{ pet_type }} - Qualité Premium | Payhuk Pets',
      metaDescription: 'Achetez {{ product_name }} pour {{ pet_type }}. Ingrédients naturels, approuvé vétérinaires, livraison 24-48h. Satisfait ou remboursé 30 jours.',
      keywords: [
        'pet supplies',
        '{{ pet_type }}',
        'pet food',
        'animal accessories',
        'chewy style',
        'pet care',
        'natural pet products',
        'veterinary approved',
      ],
      ogImage: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Mon animal va-t-il aimer ce produit ?',
        answer: 'Nos produits sont testés et approuvés par des milliers d\'animaux ! 98% des propriétaires rapportent que leur animal adore. Garantie satisfait ou remboursé 30 jours si votre compagnon n\'aime pas.',
      },
      {
        question: 'Est-ce adapté aux animaux sensibles ?',
        answer: 'Oui ! Notre formule est conçue pour être facilement digestible. Ingrédients naturels, sans colorants artificiels ni OGM. Approuvé par des vétérinaires pour les estomacs sensibles.',
      },
      {
        question: 'Quelle quantité dois-je donner par jour ?',
        answer: 'Consultez notre guide des portions ci-dessus. La quantité varie selon le poids, l\'âge et l\'activité. En cas de doute, notre vétérinaire conseil est disponible gratuitement.',
      },
      {
        question: 'D\'où viennent les ingrédients ?',
        answer: 'Tous nos ingrédients proviennent de fermes certifiées en Europe. Traçabilité totale de la ferme à la gamelle. Fabriqué en France avec des contrôles qualité stricts.',
      },
      {
        question: 'Comment fonctionne l\'abonnement ?',
        answer: 'Choisissez votre fréquence de livraison (toutes les 2, 4, 6 ou 8 semaines), économisez 15% automatiquement, et recevez votre colis sans effort. Modifiez ou annulez à tout moment.',
      },
      {
        question: 'Puis-je retourner le produit ?',
        answer: 'Absolument ! Garantie satisfait ou remboursé 30 jours, même si le sac est ouvert. Si votre animal n\'aime pas, on vous rembourse intégralement.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'pet_type',
        label: 'Type d\'animal',
        value: 'Chien',
        type: 'select',
        isPublic: true,
      },
      {
        key: 'age_range',
        label: 'Tranche d\'âge',
        value: 'Adulte (1-7 ans)',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'breed_size',
        label: 'Taille de race',
        value: 'Toutes tailles',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'special_needs',
        label: 'Besoins spéciaux',
        value: 'Digestion sensible',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'flavor',
        label: 'Saveur',
        value: 'Poulet & Riz',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'grain_free',
        label: 'Sans céréales',
        value: 'Non',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'vet_approved',
        label: 'Approuvé vétérinaire',
        value: 'Oui',
        type: 'boolean',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 40,
        width: 25,
        height: 60,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 42,
        width: 27,
        height: 62,
        weight: 5.2,
        unit: 'cm',
      },
      
      shippingClass: 'standard',
      requiresShipping: true,
      isFreeShipping: true,
      shippingPrice: 0,
      
      isFragile: false,
      requiresAssembly: false,
      assemblyDifficulty: 'none',
      assemblyTime: 0,
      
      materials: [
        'Ingrédients naturels premium',
        'Emballage alimentaire certifié',
        'Sac refermable hermétique',
        'Matériaux recyclables',
      ],
      
      colors: ['Standard'],
      sizes: ['1kg', '3kg', '5kg', '12kg'],
      
      warranty: {
        duration: 30,
        unit: 'days',
        type: 'satisfaction',
        coverage: 'Satisfait ou remboursé - Si votre animal n\'aime pas',
      },
      
      countryOfOrigin: 'France',
      manufacturer: 'Pet Nutrition Excellence SAS',
      
      certifications: ['ISO 22000', 'HACCP', 'PETA Approved', 'Bio'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Conserver dans un endroit frais et sec (15-25°C)',
        'Refermer hermétiquement le sac après chaque utilisation',
        'Ne pas exposer à la lumière directe du soleil',
        'À consommer avant la date indiquée sur l\'emballage',
        'Toujours laisser de l\'eau fraîche à disposition',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 250,
        lowStockThreshold: 50,
        allowBackorder: false,
        backorderMessage: '',
        maxOrderQuantity: 20,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-1kg',
          name: 'Sac 1kg - Essai',
          sku: 'PET-DOG-1KG',
          price: 12.99,
          compareAtPrice: 17.99,
          color: 'Standard',
          size: '1kg',
          inventory: 100,
          image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600',
        },
        {
          id: 'var-3kg',
          name: 'Sac 3kg - Populaire',
          sku: 'PET-DOG-3KG',
          price: 29.99,
          compareAtPrice: 44.99,
          color: 'Standard',
          size: '3kg',
          inventory: 80,
          image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600',
        },
        {
          id: 'var-5kg',
          name: 'Sac 5kg - Recommandé',
          sku: 'PET-DOG-5KG',
          price: 39.99,
          compareAtPrice: 59.99,
          color: 'Standard',
          size: '5kg',
          inventory: 50,
          image: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=600',
        },
        {
          id: 'var-12kg',
          name: 'Sac 12kg - Meilleure valeur',
          sku: 'PET-DOG-12KG',
          price: 79.99,
          compareAtPrice: 119.99,
          color: 'Standard',
          size: '12kg',
          inventory: 20,
          image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600',
        },
      ],
    },
  },
};

export default petSuppliesTemplate;

