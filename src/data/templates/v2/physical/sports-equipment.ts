import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #12: SPORTS EQUIPMENT
 * Inspired by: Nike
 * Design: Athletic, motivational, performance-driven
 * Perfect for: Sports gear, fitness equipment, athletic wear
 * Tier: Free
 */
export const sportsEquipmentTemplate: Template = {
  id: 'physical-sports-equipment-nike',
  name: 'Sports Equipment & Athletic Gear',
  description: 'Template professionnel pour équipements sportifs - Style Nike motivant et performance',
  category: 'physical',
  subCategory: 'sports',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'sports', 'fitness', 'athletic', 'performance', 'training',
      'nike', 'gear', 'equipment', 'workout', 'activewear',
      'motivation', 'athlete', 'running', 'gym'
    ],
    difficulty: 'beginner',
    estimatedSetupTime: 3,
    requiredFields: ['name', 'price', 'size', 'sport_type'],
    optionalFields: ['technology', 'performance_features', 'athlete_tested'],
    isPopular: true,
    isFeatured: true,
    usageCount: 2954,
    rating: 4.8,
    reviewCount: 487,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'bold',
    industry: 'sports-fitness',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1280&h=720',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Équipement sportif haute performance conçu pour les athlètes exigeants. Technologie avancée et confort optimal.',
    longDescription: `# 🏆 DÉPASSEZ VOS LIMITES

## {{ product_name }} - PERFORMANCE SANS COMPROMIS

Conçu pour les **athlètes qui refusent les compromis**. Que vous soyez débutant ou professionnel, cet équipement vous accompagne vers vos objectifs.

## ⚡ JUST DO IT

Ne laissez rien vous arrêter. Notre **{{ product_name }}** combine technologie de pointe et design innovant pour maximiser vos performances.

## 🚀 TECHNOLOGIES INNOVANTES

### {{ tech_name_1 }}
{{ tech_description_1 }}

### {{ tech_name_2 }}
{{ tech_description_2 }}

### {{ tech_name_3 }}
{{ tech_description_3 }}

## 💪 CARACTÉRISTIQUES PERFORMANCE

✅ **Léger & Résistant** - Matériaux techniques haute performance  
✅ **Respirant** - Évacuation optimale de l'humidité  
✅ **Confort Ultime** - Ergonomie étudiée pour le mouvement naturel  
✅ **Durabilité** - Résiste aux entraînements les plus intenses  
✅ **Design Moderne** - Style athlétique et motivant  

## 📊 SPÉCIFICATIONS TECHNIQUES

| Caractéristique | Détails |
|----------------|---------|
| **Poids** | {{ weight }}g |
| **Matériaux** | {{ materials }} |
| **Technologie** | {{ technology }} |
| **Sport** | {{ sport_type }} |
| **Niveau** | {{ skill_level }} |

## 🎯 POUR QUI ?

**Niveau débutant:**
Idéal pour commencer votre parcours sportif avec du matériel de qualité professionnelle.

**Niveau intermédiaire:**
Accompagnez votre progression avec un équipement qui évolue avec vous.

**Niveau avancé:**
Performance maximale pour les athlètes exigeants qui visent l'excellence.

## 🔬 TESTÉ PAR DES ATHLÈTES

> "J'ai testé {{ product_name }} pendant mes entraînements de préparation marathon. Confort exceptionnel même après 30km." - **Sarah M., marathonienne**

> "Exactement ce que je recherchais ! Léger, respirant, durable. Parfait pour mes sessions HIIT." - **Marc D., coach sportif**

> "Meilleur rapport qualité-prix du marché. Je recommande à tous mes clients." - **Julie T., personal trainer**

## 📐 GUIDE DES TAILLES

| Taille | FR | UK | US | Tour de {{ measurement }} |
|--------|----|----|----|-----------------------|
| XS | 34-36 | 6-8 | 2-4 | 85-90cm |
| S | 38-40 | 10-12 | 6-8 | 90-95cm |
| M | 42-44 | 14-16 | 10-12 | 95-100cm |
| L | 46-48 | 18-20 | 14-16 | 100-105cm |
| XL | 50-52 | 22-24 | 18-20 | 105-110cm |

**Conseil:** En cas d'hésitation entre 2 tailles, choisissez la taille au-dessus pour plus de confort.

**Aide au choix:** Notre service client est disponible pour vous conseiller !

## 🧪 COMPOSITION & ENTRETIEN

### Matériaux
__for__ material in materials_list
- **{{ material.percentage }}% {{ material.name }}**: {{ material.benefit }}
__endfor__

### Instructions d'Entretien
- 🌡️ Lavage machine 30°C maximum
- 🚫 Pas de sèche-linge
- 🚫 Pas de javel ni adoucissant
- 👕 Séchage à l'air libre
- ♻️ Matériaux recyclables en fin de vie

## 🌍 ENGAGEMENT DURABLE

**MOVE TO ZERO** - Notre engagement vers un avenir sans déchet et neutre en carbone :

- ♻️ **Matériaux recyclés**: {{ recycled_percentage }}% de matériaux recyclés
- 🌱 **Production durable**: Fabrication responsable certifiée
- 📦 **Emballage écologique**: 100% recyclable sans plastique
- 🌳 **Compensation carbone**: Transport compensé
- 💧 **Économie d'eau**: Process de fabrication optimisé

## 🎁 INCLUS DANS VOTRE COMMANDE

- ✅ {{ product_name }}
- ✅ Sac de transport premium
- ✅ Guide d'utilisation et d'entretien
- ✅ Carte de garantie
- ✅ Stickers motivation Nike-style

## 📦 LIVRAISON EXPRESS

- 🚚 **Livraison standard**: 2-3 jours ouvrés (GRATUITE dès 50€)
- ⚡ **Livraison express**: Sous 24h (+9.99€)
- 📍 **Click & Collect**: Disponible en boutique partenaire
- 🌍 **International**: Expédition mondiale

## 🛡️ GARANTIE & RETOURS

- **Garantie**: 2 ans constructeur
- **Retour**: 60 jours pour changer d'avis
- **Échange taille**: Gratuit sous 30 jours
- **SAV**: Support expert 7j/7

## 💳 PAIEMENT SÉCURISÉ

- Carte bancaire
- PayPal
- Apple Pay / Google Pay
- Klarna (Paiement en 3× sans frais)

## 🏅 REJOIGNEZ LA COMMUNAUTÉ

Partagez vos performances avec **#JustDoIt** et **#{{ product_name_hashtag }}**

📱 Suivez-nous sur Instagram: @payhuk_sports  
🎥 Tutoriels & conseils sur YouTube  
💪 Rejoignez notre groupe Strava  

---

**"THE ONLY ONE WHO CAN TELL YOU 'YOU CAN'T' IS YOU. AND YOU DON'T HAVE TO LISTEN."** - Nike

Commandez maintenant et **DÉPASSEZ VOS LIMITES** ! 🚀`,
    
    price: 89.99,
    compareAtPrice: 149.99,
    currency: 'EUR',
    
    sku: 'SPORT-{{ category }}-{{ variant_id }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 150,
    allowBackorder: false,
    
    weight: 0.8,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue principale action shot',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails techniques et finitions',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue portée par athlète',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=athlete-performance',
    video360Url: '',
    arEnabled: true,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#000000',      // Nike Black
      secondary: '#FFFFFF',    // White
      accent: '#FF6B35',       // Orange accent
      background: '#F5F5F5',
      text: '#111111',
      success: '#4CAF50',
      warning: '#FFC107',
      error: '#FF1744',
    },
    
    typography: {
      fontFamily: 'Futura, Helvetica Neue, Arial, sans-serif',
      headingFont: 'Futura, sans-serif',
      bodyFont: 'Helvetica Neue, sans-serif',
      fontSize: {
        base: '16px',
        heading: '36px',
        small: '14px',
      },
      fontWeight: {
        normal: 400,
        medium: 600,
        bold: 800,
      },
    },
    
    // === SEO & META ===
    seo: {
      metaTitle: '{{ product_name }} - Équipement Sportif Performance | Payhuk Sports',
      metaDescription: 'Achetez {{ product_name }}. Technologie avancée, confort optimal, testé par athlètes. Livraison 24h. Garantie 2 ans. Just Do It!',
      keywords: [
        'equipment sportif',
        'performance',
        'nike style',
        '{{ sport_type }}',
        'athletic gear',
        'fitness equipment',
        'high performance',
        'athlete tested',
      ],
      ogImage: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Quelle taille dois-je choisir ?',
        answer: 'Consultez notre guide des tailles ci-dessus. En cas d\'hésitation, prenez la taille au-dessus. Échange gratuit sous 30 jours si la taille ne convient pas.',
      },
      {
        question: 'Est-ce adapté aux débutants ?',
        answer: 'Absolument ! Cet équipement convient à tous les niveaux, du débutant au professionnel. La technologie s\'adapte à votre pratique.',
      },
      {
        question: 'Quelle est la durabilité du produit ?',
        answer: 'Conçu pour résister aux entraînements intensifs. Matériaux premium testés pour + de 500 heures d\'utilisation. Garantie 2 ans incluse.',
      },
      {
        question: 'Puis-je laver en machine ?',
        answer: 'Oui, lavage machine 30°C. N\'utilisez pas de sèche-linge ni d\'adoucissant pour préserver les propriétés techniques. Séchage à l\'air libre.',
      },
      {
        question: 'Livraison express disponible ?',
        answer: 'Oui ! Livraison express sous 24h pour +9.99€. Livraison standard gratuite dès 50€ d\'achat (2-3 jours ouvrés).',
      },
      {
        question: 'Puis-je retourner si ça ne me convient pas ?',
        answer: 'Oui, retour gratuit sous 60 jours. Même si vous avez utilisé le produit (usage normal). Remboursement intégral sans question.',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'sport_type',
        label: 'Type de sport',
        value: 'Running, Training, Fitness',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'skill_level',
        label: 'Niveau recommandé',
        value: 'Tous niveaux',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'technology',
        label: 'Technologies',
        value: 'Dri-FIT, Flyknit, Zoom Air',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'athlete_tested',
        label: 'Testé athlètes',
        value: 'true',
        type: 'boolean',
        isPublic: true,
      },
      {
        key: 'recycled_percentage',
        label: '% Matériaux recyclés',
        value: '75',
        type: 'number',
        isPublic: true,
      },
      {
        key: 'gender',
        label: 'Genre',
        value: 'Mixte',
        type: 'text',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 30,
        width: 20,
        height: 15,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 35,
        width: 25,
        height: 10,
        weight: 1,
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
        'Polyester recyclé 75%',
        'Elasthanne 15%',
        'Mesh respirant 10%',
        'Technologies Dri-FIT',
      ],
      
      colors: ['Noir', 'Blanc', 'Gris', 'Bleu Navy', 'Rouge'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      
      warranty: {
        duration: 2,
        unit: 'years',
        type: 'manufacturer',
        coverage: 'Défauts matériaux et fabrication',
      },
      
      countryOfOrigin: 'Vietnam',
      manufacturer: 'Nike Inc.',
      
      certifications: ['OEKO-TEX', 'Fair Trade', 'Bluesign', 'ISO 14001'],
      ecoFriendly: true,
      recycable: true,
      
      careInstructions: [
        'Laver en machine à 30°C maximum',
        'Ne pas utiliser de sèche-linge',
        'Pas de javel ni d\'adoucissant',
        'Sécher à l\'air libre à plat',
        'Repasser à basse température si nécessaire',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 150,
        lowStockThreshold: 30,
        allowBackorder: false,
        backorderMessage: '',
        maxOrderQuantity: 10,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-black-m',
          name: 'Noir - M',
          sku: 'SPORT-BLK-M',
          price: 89.99,
          compareAtPrice: 149.99,
          color: 'Noir',
          size: 'M',
          inventory: 40,
          image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600',
        },
        {
          id: 'var-white-l',
          name: 'Blanc - L',
          sku: 'SPORT-WHT-L',
          price: 89.99,
          compareAtPrice: 149.99,
          color: 'Blanc',
          size: 'L',
          inventory: 35,
          image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600',
        },
        {
          id: 'var-red-xl',
          name: 'Rouge - XL',
          sku: 'SPORT-RED-XL',
          price: 94.99,
          compareAtPrice: 154.99,
          color: 'Rouge',
          size: 'XL',
          inventory: 25,
          image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600',
        },
      ],
    },
  },
};

export default sportsEquipmentTemplate;

