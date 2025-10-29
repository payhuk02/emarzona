import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #8: HOME & GARDEN
 * Inspired by: IKEA
 * Design: Scandinavian minimalism, functional, affordable
 * Perfect for: Furniture, décor, gardening, home improvement
 * Tier: Free
 */
export const homeGardenTemplate: Template = {
  id: 'physical-home-garden-ikea',
  name: 'Home & Garden Essentials',
  description: 'Template professionnel pour meubles, décoration et jardin - Style IKEA minimaliste',
  category: 'physical',
  subCategory: 'home-garden',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'home', 'garden', 'furniture', 'decor', 'DIY',
      'scandinavian', 'minimalist', 'IKEA', 'affordable',
      'room', 'outdoor', 'interior', 'renovation'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 3,
    requiredFields: ['name', 'price', 'images', 'dimensions'],
    optionalFields: ['assembly', 'materials', 'care_instructions'],
    isPopular: true,
    isFeatured: false,
    usageCount: 2847,
    rating: 4.8,
    reviewCount: 412,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'minimalist',
    industry: 'home-garden',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1280&h=720',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Produit de qualité pour la maison et le jardin, design scandinave épuré et fonctionnel.',
    longDescription: `# Transformez Votre Intérieur avec Style

Notre **{{ product_name }}** combine l'élégance scandinave et la fonctionnalité moderne pour créer un espace de vie harmonieux.

## 🏠 Design Intemporel

Design minimaliste inspiré des maisons nordiques, créé pour s'adapter à tous les intérieurs. Lignes épurées, couleurs neutres, et matériaux durables.

## ✨ Caractéristiques Clés

- **Matériaux Premium**: Bois massif certifié FSC et finitions écologiques
- **Multifonctionnel**: S'adapte à différents espaces et usages
- **Montage Facile**: Instructions illustrées claires, montage en 20-30 minutes
- **Rangement Intelligent**: Optimise l'espace avec des solutions astucieuses

## 📐 Dimensions & Spécifications

- **Dimensions**: {{ width }}cm (L) × {{ depth }}cm (P) × {{ height }}cm (H)
- **Poids**: {{ weight }}kg
- **Capacité de charge**: {{ max_load }}kg
- **Matériaux**: {{ materials }}

## 🌱 Éco-Responsable

Nous nous engageons pour un avenir durable :
- Bois provenant de forêts gérées durablement
- Emballage 100% recyclable
- Production à faibles émissions de CO2
- Matériaux recyclables en fin de vie

## 🔧 Montage & Entretien

**Montage**: Facile avec outils fournis (clé Allen incluse)  
**Temps**: 20-30 minutes pour 1 personne  
**Entretien**: Nettoyer avec un chiffon humide, éviter les produits abrasifs

## 📦 Livraison & Garantie

- **Livraison**: Colis plat pour faciliter le transport
- **Garantie**: 10 ans sur défauts de fabrication
- **Retour**: 365 jours pour changer d'avis

## 💡 Idées d'Aménagement

Parfait pour :
- 🛋️ Salon moderne et accueillant
- 🍽️ Salle à manger conviviale
- 🛏️ Chambre à coucher apaisante
- 🌿 Balcon et terrasse relaxants

---

**Note**: Couleurs et dimensions peuvent légèrement varier selon les écrans. Photos non contractuelles.`,
    
    price: 79.99,
    compareAtPrice: 129.99,
    currency: 'EUR',
    
    sku: 'HG-{{ product_id }}-{{ variant_id }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 120,
    allowBackorder: true,
    
    weight: 15,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue d\'ensemble dans un salon moderne',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails et finitions',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Dimensions et proportions',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=assembly-guide',
    video360Url: '',
    arEnabled: true,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#0051BA',      // IKEA Blue
      secondary: '#FFDB00',    // IKEA Yellow
      accent: '#111111',       // Black
      background: '#F5F5F5',   // Light Grey
      text: '#111111',
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#F44336',
    },
    
    typography: {
      fontFamily: 'Inter, Noto Sans, system-ui, sans-serif',
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      fontSize: {
        base: '16px',
        heading: '32px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 500,
        bold: 700,
      },
    },
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ product_name }} - Meuble & Décoration Style Scandinave | Payhuk',
      metaDescription: 'Découvrez notre {{ product_name }} au design scandinave. Qualité, fonctionnalité et prix accessible. Garantie 10 ans. Livraison rapide.',
      keywords: [
        'meuble scandinave',
        'décoration nordique',
        'home & garden',
        'mobilier design',
        'IKEA style',
        'meuble abordable',
        'intérieur moderne',
        'rangement maison',
      ],
      ogImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Le montage est-il difficile ?',
        answer: 'Non ! Notre système de montage a été conçu pour être simple et rapide. Instructions illustrées claires incluses, outils fournis. Comptez 20-30 minutes.',
      },
      {
        question: 'Quels sont les matériaux utilisés ?',
        answer: 'Bois massif certifié FSC (gestion durable des forêts), panneau de particules, et finitions écologiques à base d\'eau. Tous nos matériaux sont testés et certifiés.',
      },
      {
        question: 'Quelle est la garantie ?',
        answer: '10 ans sur les défauts de fabrication. Si un problème survient dans les conditions normales d\'utilisation, nous le réparons ou le remplaçons gratuitement.',
      },
      {
        question: 'Puis-je retourner le produit ?',
        answer: 'Oui, vous avez 365 jours pour changer d\'avis ! Si le produit ne vous convient pas, retournez-le (même monté) pour un remboursement complet.',
      },
      {
        question: 'Est-ce disponible dans d\'autres couleurs ?',
        answer: 'Oui ! Ce produit est disponible en plusieurs finitions : blanc, noir, chêne naturel, et gris anthracite. Sélectionnez votre option préférée ci-dessus.',
      },
      {
        question: 'Comment entretenir ce produit ?',
        answer: 'Très simple : nettoyage avec un chiffon humide et doux. Évitez les produits abrasifs. Pour le bois, utilisez occasionnellement de l\'huile pour bois.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'room_type',
        label: 'Type de pièce',
        value: 'Salon, Chambre, Bureau, Entrée',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'assembly_time',
        label: 'Temps de montage',
        value: '20-30 minutes',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'package_dimensions',
        label: 'Dimensions colis',
        value: '{{ package_length }}×{{ package_width }}×{{ package_height }} cm',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'max_load',
        label: 'Charge maximale',
        value: '50 kg',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'certifications',
        label: 'Certifications',
        value: 'FSC, PEFC, CE',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'style',
        label: 'Style',
        value: 'Scandinave, Minimaliste, Moderne',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'care_instructions',
        label: 'Instructions d\'entretien',
        value: 'Nettoyer avec un chiffon humide. Éviter les produits chimiques agressifs.',
        type: 'textarea',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 120,
        width: 45,
        height: 75,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 125,
        width: 50,
        height: 15,
        weight: 17,
        unit: 'cm',
      },
      
      shippingClass: 'furniture-standard',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 19.99,
      
      isFragile: false,
      requiresAssembly: true,
      assemblyDifficulty: 'easy',
      assemblyTime: 25,
      
      materials: [
        'Bois massif certifié FSC',
        'Panneau de particules',
        'Finition peinture écologique',
        'Quincaillerie acier inoxydable',
      ],
      
      colors: ['Blanc', 'Noir', 'Chêne naturel', 'Gris anthracite'],
      sizes: ['Standard', 'Large'],
      
      warranty: {
        duration: 10,
        unit: 'years',
        type: 'manufacturer',
        coverage: 'Défauts de fabrication en usage normal',
      },
      
      countryOfOrigin: 'Suède',
      manufacturer: 'Nordic Home Furniture AB',
      
      certifications: ['FSC', 'PEFC', 'CE', 'ISO 14001'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Nettoyer avec un chiffon humide et doux',
        'Ne pas utiliser de produits abrasifs ou solvants',
        'Protéger de l\'humidité excessive',
        'Utiliser de l\'huile pour bois 1-2 fois par an (optionnel)',
        'Éviter l\'exposition directe au soleil prolongée',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 120,
        lowStockThreshold: 20,
        allowBackorder: true,
        backorderMessage: 'Disponible en précommande - Livraison sous 2-3 semaines',
        maxOrderQuantity: 10,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-white-std',
          name: 'Blanc - Standard',
          sku: 'HG-WHITE-STD',
          price: 79.99,
          compareAtPrice: 129.99,
          color: 'Blanc',
          size: 'Standard',
          inventory: 50,
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600',
        },
        {
          id: 'var-oak-std',
          name: 'Chêne naturel - Standard',
          sku: 'HG-OAK-STD',
          price: 89.99,
          compareAtPrice: 139.99,
          color: 'Chêne naturel',
          size: 'Standard',
          inventory: 40,
          image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&h=600',
        },
        {
          id: 'var-black-large',
          name: 'Noir - Large',
          sku: 'HG-BLACK-LRG',
          price: 99.99,
          compareAtPrice: 159.99,
          color: 'Noir',
          size: 'Large',
          inventory: 30,
          image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&h=600',
        },
      ],
    },
  },
};

export default homeGardenTemplate;

