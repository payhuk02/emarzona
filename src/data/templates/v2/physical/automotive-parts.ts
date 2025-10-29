import { Template } from '@/types/templates-v2';

/**
 * PHYSICAL TEMPLATE #9: AUTOMOTIVE PARTS
 * Inspired by: AutoZone
 * Design: Technical, reliable, professional
 * Perfect for: Car parts, accessories, maintenance, tools
 * Tier: Free
 */
export const automotivePartsTemplate: Template = {
  id: 'physical-automotive-parts-autozone',
  name: 'Automotive Parts & Accessories',
  description: 'Template professionnel pour pièces auto et accessoires - Style AutoZone technique',
  category: 'physical',
  subCategory: 'automotive',
  
  metadata: {
    version: '2.0.0',
    author: 'Payhuk Templates',
    authorUrl: 'https://payhuk.com/templates',
    tags: [
      'automotive', 'car', 'parts', 'accessories', 'maintenance',
      'technical', 'repair', 'vehicle', 'tools', 'garage',
      'autozone', 'professional', 'specs', 'compatibility'
    ],
    difficulty: 'intermediate',
    estimatedSetupTime: 5,
    requiredFields: ['name', 'price', 'compatibility', 'part_number'],
    optionalFields: ['installation', 'warranty', 'oem_reference'],
    isPopular: true,
    isFeatured: false,
    usageCount: 1923,
    rating: 4.7,
    reviewCount: 287,
    lastUpdated: '2025-01-15',
    tier: 'free',
    designStyle: 'professional',
    industry: 'automotive',
    language: 'fr',
    previewImages: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1280&h=720',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1280&h=720',
    ],
  },

  data: {
    // === INFORMATIONS DE BASE ===
    productName: '{{ product_name }}',
    slug: '{{ product_name | slugify }}',
    shortDescription: 'Pièce auto de qualité OEM, compatible {{ vehicle_make }} {{ vehicle_model }}, garantie fabricant.',
    longDescription: `# Pièce Automobile de Qualité Professionnelle

## 🚗 **{{ product_name }}** - Performance & Fiabilité Garanties

Pièce de remplacement de **qualité OEM** (Original Equipment Manufacturer), conçue pour offrir les mêmes performances et la même durabilité que la pièce d'origine.

## ✅ Compatibilité Véhicule

**Compatible avec:**
- {{ vehicle_make }} {{ vehicle_model }}
- Années: {{ year_range }}
- Moteur: {{ engine_type }}
- Transmission: {{ transmission_type }}

__if__ {{ additional_compatibility }}
**Également compatible avec:**
{{ additional_compatibility }}
__endif__

## 🔧 Spécifications Techniques

| Caractéristique | Valeur |
|----------------|--------|
| **Numéro de pièce** | {{ part_number }} |
| **Référence OEM** | {{ oem_reference }} |
| **Marque** | {{ brand_name }} |
| **Matériau** | {{ material }} |
| **Poids** | {{ weight }}kg |
| **Garantie** | {{ warranty_period }} |

## 🏆 Avantages Clés

✅ **Qualité OEM**: Performances identiques à la pièce d'origine  
✅ **Installation Facile**: Compatible avec l'équipement existant  
✅ **Garantie Étendue**: {{ warranty_period }} de garantie fabricant  
✅ **Certifié**: Conforme aux normes ISO et SAE  
✅ **Support Tech**: Assistance technique gratuite par téléphone  

## 📦 Contenu du Kit

__for__ item in kit_contents
- {{ item.quantity }}× {{ item.name }}
__endfor__

**Outils nécessaires** (non inclus):
__for__ tool in required_tools
- {{ tool }}
__endfor__

## 🔨 Installation

**Niveau de difficulté**: {{ installation_difficulty }}  
**Temps estimé**: {{ installation_time }}  
**Expertise requise**: {{ expertise_level }}

### Guide d'Installation Rapide

1. **Préparation**: Garez le véhicule sur une surface plane, frein à main serré
2. **Dépose**: Retirez l'ancienne pièce en suivant les instructions du manuel
3. **Installation**: Positionnez la nouvelle pièce et fixez selon les spécifications
4. **Vérification**: Testez le bon fonctionnement avant de reprendre la route

**📹 Vidéo d'installation disponible** - Scannez le QR code sur l'emballage

## ⚠️ Informations Importantes

- Vérifiez la compatibilité exacte avec votre véhicule avant l'achat
- Installation par un professionnel recommandée pour les pièces critiques
- Conservez la facture pour la garantie
- Ne convient pas aux véhicules modifiés sauf indication contraire

## 💰 Économisez sur l'Installation

**Option 1**: Installation chez nos partenaires agréés (+ {{ professional_install_price }}€)  
**Option 2**: Installation DIY avec notre guide vidéo (gratuit)

## 🛡️ Garantie & Support

- **Garantie fabricant**: {{ warranty_period }}
- **Support technique**: 7j/7 par téléphone et email
- **Retour**: 30 jours satisfait ou remboursé
- **Remplacement**: Pièce défectueuse remplacée sous 48h

---

**Note**: Les spécifications peuvent varier selon l'année et le modèle. Vérifiez toujours la compatibilité avec votre VIN.`,
    
    price: 149.99,
    compareAtPrice: 249.99,
    currency: 'EUR',
    
    sku: 'AUTO-{{ part_number }}-{{ variant_id }}',
    barcode: '{{ generate_barcode }}',
    trackInventory: true,
    inventoryQuantity: 85,
    allowBackorder: true,
    
    weight: 3.5,
    weightUnit: 'kg',
    
    // === VISUELS & MÉDIAS ===
    images: [
      {
        url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Vue principale de la pièce',
        isPrimary: true,
        sortOrder: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Détails techniques',
        isPrimary: false,
        sortOrder: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1280&h=720&fit=crop',
        alt: '{{ product_name }} - Installation sur véhicule',
        isPrimary: false,
        sortOrder: 3,
      },
    ],
    
    videoUrl: 'https://www.youtube.com/watch?v=installation-guide',
    video360Url: '',
    arEnabled: false,
    
    // === COULEURS & DESIGN ===
    colors: {
      primary: '#E31837',      // AutoZone Red
      secondary: '#000000',    // Black
      accent: '#FFB81C',       // Yellow accent
      background: '#FFFFFF',
      text: '#1A1A1A',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
    },
    
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      headingFont: 'Roboto, sans-serif',
      bodyFont: 'Roboto, sans-serif',
      fontSize: {
        base: '16px',
        heading: '28px',
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
      metaTitle: '{{ product_name }} - Pièce Auto Qualité OEM | {{ vehicle_make }} | Payhuk',
      metaDescription: 'Achetez {{ product_name }} pour {{ vehicle_make }} {{ vehicle_model }}. Qualité OEM, garantie {{ warranty_period }}, installation facile. En stock.',
      keywords: [
        'pièce auto',
        'automotive parts',
        '{{ vehicle_make }}',
        '{{ part_number }}',
        'OEM quality',
        'car repair',
        'vehicle maintenance',
        'autozone style',
      ],
      ogImage: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=630&fit=crop',
      twitterCard: 'summary_large_image',
    },
    
    // === FAQ ===
    faq: [
      {
        question: 'Comment vérifier la compatibilité avec mon véhicule ?',
        answer: 'Utilisez notre outil de compatibilité en haut de page. Entrez votre numéro VIN ou sélectionnez marque/modèle/année. Vous pouvez aussi appeler notre support technique.',
      },
      {
        question: 'Est-ce une pièce d\'origine ou aftermarket ?',
        answer: 'C\'est une pièce de qualité OEM (Original Equipment Manufacturer), fabriquée selon les mêmes spécifications que la pièce d\'origine, mais par un fabricant tiers certifié.',
      },
      {
        question: 'Puis-je installer cette pièce moi-même ?',
        answer: 'Oui, si vous avez des compétences mécaniques de base et les outils nécessaires. Nous fournissons un guide vidéo détaillé. Pour les pièces critiques, nous recommandons un professionnel.',
      },
      {
        question: 'Quelle est la garantie ?',
        answer: '{{ warranty_period }} de garantie fabricant contre tout défaut de matériau ou de fabrication. Si un problème survient, nous remplaçons la pièce gratuitement.',
      },
      {
        question: 'Proposez-vous l\'installation ?',
        answer: 'Oui ! Nous avons un réseau de garages partenaires agréés. Sélectionnez l\'option "Installation professionnelle" lors de l\'achat pour +{{ professional_install_price }}€.',
      },
      {
        question: 'Combien de temps prend la livraison ?',
        answer: 'En stock : expédition sous 24h, livraison 2-3 jours ouvrés. Sur commande : 5-7 jours. Livraison express disponible (+19.99€).',
      },
    ],
    
    // === CHAMPS PERSONNALISÉS ===
    customFields: [
      {
        key: 'part_number',
        label: 'Numéro de pièce',
        value: 'AP-{{ random_number }}',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'oem_reference',
        label: 'Référence OEM',
        value: 'OEM-{{ random_number }}',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'vehicle_compatibility',
        label: 'Compatibilité véhicule',
        value: '{{ vehicle_make }} {{ vehicle_model }} ({{ year_range }})',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'installation_difficulty',
        label: 'Difficulté d\'installation',
        value: 'Intermédiaire',
        type: 'select',
        isPublic: true,
      },
      {
        key: 'installation_time',
        label: 'Temps d\'installation',
        value: '1-2 heures',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'warranty_period',
        label: 'Période de garantie',
        value: '2 ans / 40,000 km',
        type: 'text',
        isPublic: true,
      },
      {
        key: 'certifications',
        label: 'Certifications',
        value: 'ISO 9001, SAE, TÜV',
        type: 'text',
        isPublic: true,
      },
    ],
    
    // === SPÉCIFIQUE PRODUIT PHYSIQUE ===
    physical: {
      dimensions: {
        length: 35,
        width: 25,
        height: 12,
        unit: 'cm',
      },
      
      packageDimensions: {
        length: 40,
        width: 30,
        height: 15,
        weight: 4,
        unit: 'cm',
      },
      
      shippingClass: 'standard',
      requiresShipping: true,
      isFreeShipping: false,
      shippingPrice: 9.99,
      
      isFragile: true,
      requiresAssembly: false,
      assemblyDifficulty: 'none',
      assemblyTime: 0,
      
      materials: [
        'Acier haute résistance',
        'Aluminium usiné CNC',
        'Joints caoutchouc synthétique',
        'Revêtement anticorrosion',
      ],
      
      colors: ['Noir', 'Silver', 'Chrome'],
      sizes: ['Standard'],
      
      warranty: {
        duration: 2,
        unit: 'years',
        type: 'manufacturer',
        coverage: '2 ans ou 40,000 km - Défauts matériaux et fabrication',
      },
      
      countryOfOrigin: 'Allemagne',
      manufacturer: 'AutoTech Premium Parts GmbH',
      
      certifications: ['ISO 9001', 'SAE J2534', 'TÜV', 'CE'],
      ecoFriendly: false,
      recycable: true,
      
      careInstructions: [
        'Vérifier le serrage des boulons tous les 5,000 km',
        'Inspecter visuellement lors de chaque vidange',
        'Nettoyer avec un dégraissant doux si nécessaire',
        'Ne pas exposer à des températures extrêmes pendant le stockage',
        'Remplacer si signes d\'usure ou de corrosion',
      ],
      
      inventory: {
        trackInventory: true,
        quantity: 85,
        lowStockThreshold: 15,
        allowBackorder: true,
        backorderMessage: 'Disponible en précommande - Livraison sous 5-7 jours',
        maxOrderQuantity: 5,
      },
      
      preOrder: {
        isPreOrder: false,
        releaseDate: '',
        preOrderMessage: '',
      },
      
      variants: [
        {
          id: 'var-standard',
          name: 'Standard - Pièce seule',
          sku: 'AUTO-STD-PART',
          price: 149.99,
          compareAtPrice: 249.99,
          color: 'Standard',
          size: 'Standard',
          inventory: 50,
          image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&h=600',
        },
        {
          id: 'var-kit',
          name: 'Kit Complet avec accessoires',
          sku: 'AUTO-KIT-COMPLETE',
          price: 199.99,
          compareAtPrice: 299.99,
          color: 'Standard',
          size: 'Kit',
          inventory: 30,
          image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=600',
        },
        {
          id: 'var-install',
          name: 'Avec Installation Professionnelle',
          sku: 'AUTO-WITH-INSTALL',
          price: 249.99,
          compareAtPrice: 399.99,
          color: 'Standard',
          size: 'Standard + Install',
          inventory: 5,
          image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&h=600',
        },
      ],
    },
  },
};

export default automotivePartsTemplate;

