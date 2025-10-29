/**
 * Templates Pré-configurés - Produits Physiques
 * 10 templates professionnels pour produits physiques
 */

import { Template } from '@/types/templates';

export const PHYSICAL_TEMPLATES: Template[] = [
  // 1. MODE & VÊTEMENTS
  {
    metadata: {
      id: 'physical-fashion-001',
      name: 'Vêtement Mode',
      description: 'Template complet pour vêtements avec tailles, couleurs, et guide des tailles',
      category: 'fashion',
      productType: 'physical',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/physical/fashion-thumb.jpg',
      preview_images: [],
      tags: ['mode', 'vêtement', 'fashion', 'taille', 'couleur'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Type de vêtement] - [Style/Collection]',
        description_template: `# Description du produit

## Caractéristiques

- Matière : [composition]
- Coupe : [type de coupe]
- Style : [style]
- Saison : [printemps/été/automne/hiver]

## Composition

- 95% Coton
- 5% Élasthanne

## Entretien

- Lavage machine à 30°C
- Séchage à basse température
- Repassage faible température
- Ne pas nettoyer à sec

## Détails

✅ Coupe [ajustée/regular/oversize]
✅ Col [type]
✅ Manches [longueur]
✅ Poches [nombre et type]`,
        short_description_template: '[Type de vêtement] en [matière] - Coupe [type] - Disponible en plusieurs tailles et couleurs',
        category: 'Mode & Vêtements',
        pricing_model: 'one_time',
        price: 15000,
        currency: 'XOF',
        features: [
          'Matière de qualité premium',
          'Coupe confortable',
          'Plusieurs coloris disponibles',
          'Guide des tailles inclus',
          'Livraison gratuite dès 50000 FCFA',
        ],
        specifications: [
          { label: 'Matière', value: '95% Coton, 5% Élasthanne' },
          { label: 'Poids', value: '200g' },
          { label: 'Pays de fabrication', value: 'Sénégal' },
          { label: 'Garantie', value: '30 jours satisfait ou remboursé' },
        ],
      },
      visuals: {
        image_placeholders: [
          'Photo produit face',
          'Photo produit dos',
          'Photo détail matière',
          'Photo portée modèle',
        ],
        gallery_placeholders: [
          'Couleur 1',
          'Couleur 2',
          'Couleur 3',
          'Détails coutures',
        ],
      },
      seo: {
        meta_title_template: '[Vêtement] [Style] - Mode [Homme/Femme] | Qualité Premium',
        meta_description_template: 'Découvrez notre [vêtement] en [matière]. Coupe [type], disponible en plusieurs tailles et couleurs. Livraison rapide. Prix: [prix] FCFA',
        meta_keywords: ['mode', 'vêtement', 'fashion', 'boutique', 'qualité'],
      },
      faqs: [
        {
          question: 'Comment choisir ma taille ?',
          answer: 'Consultez notre guide des tailles ci-dessus. En cas de doute, prenez la taille supérieure pour plus de confort.',
        },
        {
          question: 'Puis-je retourner le produit ?',
          answer: 'Oui, vous avez 30 jours pour retourner le produit s\'il ne vous convient pas (non porté, avec étiquettes).',
        },
        {
          question: 'Quels sont les délais de livraison ?',
          answer: 'Livraison en 3-5 jours ouvrés à Dakar, 5-7 jours en province. Livraison gratuite dès 50000 FCFA.',
        },
        {
          question: 'Comment entretenir ce vêtement ?',
          answer: 'Lavage machine à 30°C, séchage basse température. Voir étiquette d\'entretien pour plus de détails.',
        },
      ],
      physical: {
        variants: [
          {
            name: 'Taille',
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          },
          {
            name: 'Couleur',
            options: ['Noir', 'Blanc', 'Gris', 'Bleu Marine', 'Beige'],
          },
        ],
        shipping_required: true,
        weight: 0.2, // kg
        dimensions: {
          length: 30,
          width: 25,
          height: 5,
          unit: 'cm',
        },
        inventory: {
          track_quantity: true,
          low_stock_threshold: 5,
        },
      },
      affiliate: {
        enabled: true,
        commission_rate: 15,
        commission_type: 'percentage',
      },
      tracking: {
        pixels_enabled: true,
        analytics_enabled: true,
        events: ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'],
      },
    },
  },

  // 2. ÉLECTRONIQUE
  {
    metadata: {
      id: 'physical-electronics-001',
      name: 'Appareil Électronique',
      description: 'Template pour smartphones, tablettes, accessoires tech avec specs techniques',
      category: 'electronics',
      productType: 'physical',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/physical/electronics-thumb.jpg',
      preview_images: [],
      tags: ['électronique', 'tech', 'gadget', 'smartphone', 'tablette'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Marque] [Modèle] - [Capacité/Specs]',
        description_template: `# Spécifications Techniques

## Écran

- Taille : [pouces]
- Résolution : [résolution]
- Technologie : [type d'écran]
- Taux de rafraîchissement : [Hz]

## Performance

- Processeur : [modèle]
- RAM : [Go]
- Stockage : [Go/To]
- GPU : [modèle]

## Appareil Photo

- Caméra principale : [MP]
- Caméra frontale : [MP]
- Vidéo : [résolution] à [fps]

## Batterie

- Capacité : [mAh]
- Charge rapide : Oui/Non
- Autonomie : [heures]

## Connectivité

- 4G/5G
- Wi-Fi [version]
- Bluetooth [version]
- NFC : Oui/Non

## Contenu de la boîte

✅ Appareil
✅ Chargeur
✅ Câble USB-C
✅ Manuel d'utilisation
✅ Garantie 1 an`,
        short_description_template: '[Marque] [Modèle] avec [RAM]GB RAM, [Stockage]GB - Écran [taille]" - Garantie 1 an',
        category: 'Électronique',
        pricing_model: 'one_time',
        price: 200000,
        currency: 'XOF',
        features: [
          'Processeur dernière génération',
          'Écran haute résolution',
          'Batterie longue durée',
          'Appareil photo professionnel',
          'Garantie constructeur 1 an',
        ],
        specifications: [
          { label: 'Marque', value: '[Marque]' },
          { label: 'Modèle', value: '[Modèle]' },
          { label: 'Système', value: '[OS Version]' },
          { label: 'Année', value: '2024' },
          { label: 'Garantie', value: '1 an constructeur' },
        ],
      },
      seo: {
        meta_title_template: '[Marque] [Modèle] - [RAM]GB/[Stockage]GB | Prix Sénégal',
        meta_description_template: 'Achetez le [Marque] [Modèle] avec [RAM]GB RAM et [Stockage]GB de stockage. Écran [taille]", garantie 1 an. Prix: [prix] FCFA',
        meta_keywords: ['smartphone', 'téléphone', 'électronique', 'tech', 'mobile'],
      },
      faqs: [
        {
          question: 'Le produit est-il neuf ou reconditionné ?',
          answer: 'Ce produit est 100% neuf, scellé dans son emballage d\'origine avec garantie constructeur.',
        },
        {
          question: 'Quelle est la durée de la garantie ?',
          answer: 'Garantie constructeur de 1 an couvrant les défauts de fabrication. Service après-vente disponible.',
        },
        {
          question: 'Y a-t-il une protection d\'écran ou une coque incluse ?',
          answer: 'Le produit est livré avec ses accessoires d\'origine. Protection d\'écran et coque vendues séparément.',
        },
        {
          question: 'Acceptez-vous les paiements échelonnés ?',
          answer: 'Oui, paiement en 2 ou 3 fois disponible pour les commandes supérieures à 100000 FCFA.',
        },
      ],
      physical: {
        variants: [
          {
            name: 'Capacité',
            options: ['64GB', '128GB', '256GB', '512GB'],
          },
          {
            name: 'Couleur',
            options: ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Or'],
          },
        ],
        shipping_required: true,
        weight: 0.5, // kg
        dimensions: {
          length: 20,
          width: 15,
          height: 8,
          unit: 'cm',
        },
        inventory: {
          track_quantity: true,
          low_stock_threshold: 3,
        },
      },
      affiliate: {
        enabled: true,
        commission_rate: 5,
        commission_type: 'percentage',
      },
    },
  },

  // 3. COSMÉTIQUES / BEAUTÉ
  {
    metadata: {
      id: 'physical-cosmetics-001',
      name: 'Produit Cosmétique',
      description: 'Template pour crèmes, maquillage, soins avec liste d\'ingrédients',
      category: 'cosmetics',
      productType: 'physical',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/physical/cosmetics-thumb.jpg',
      preview_images: [],
      tags: ['cosmétique', 'beauté', 'soin', 'maquillage', 'crème'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Nom du Produit] - [Type de soin]',
        description_template: `# Produit de Beauté Professionnel

## Description

[Description du produit et ses bienfaits]

## Bénéfices

✨ Hydrate intensément
✨ Nourrit en profondeur
✨ Texture légère et non grasse
✨ Absorption rapide
✨ Parfum délicat

## Ingrédients Actifs

- Acide Hyaluronique
- Vitamine C
- Vitamine E
- Aloe Vera
- Beurre de Karité

## Mode d'emploi

1. Nettoyer et sécher la peau
2. Appliquer une noisette de produit
3. Masser délicatement par mouvements circulaires
4. Utiliser matin et/ou soir

## Précautions

- Usage externe uniquement
- Éviter le contact avec les yeux
- Test d'allergie recommandé
- Conserver à l'abri de la lumière

## Certifications

✅ Testé dermatologiquement
✅ Non testé sur les animaux
✅ Sans parabènes
✅ Formule hypoallergénique`,
        short_description_template: '[Produit] pour [type de peau] - [volume]ml - Formule [caractéristique]',
        category: 'Beauté & Cosmétiques',
        pricing_model: 'one_time',
        price: 12000,
        currency: 'XOF',
        features: [
          'Testé dermatologiquement',
          'Sans parabènes',
          'Non testé sur animaux',
          'Formule naturelle',
          'Résultats visibles en 7 jours',
        ],
        specifications: [
          { label: 'Volume', value: '50ml' },
          { label: 'Type de peau', value: 'Tous types' },
          { label: 'Durée', value: '6 mois après ouverture' },
          { label: 'Origine', value: 'Fabriqué en France' },
        ],
      },
      seo: {
        meta_title_template: '[Produit Beauté] - [Type] | Sans Parabènes',
        meta_description_template: '[Produit] pour [type de peau]. Formule [caractéristique], testé dermatologiquement. Résultats visibles en 7 jours. Prix: [prix] FCFA',
        meta_keywords: ['cosmétique', 'beauté', 'soin', 'peau', 'naturel'],
      },
      faqs: [
        {
          question: 'Ce produit convient-il aux peaux sensibles ?',
          answer: 'Oui, testé dermatologiquement et hypoallergénique, convient à tous types de peaux y compris sensibles.',
        },
        {
          question: 'Combien de temps dure le produit ?',
          answer: 'Une fois ouvert, le produit se conserve 6 mois. Non ouvert, 24 mois à partir de la date de fabrication.',
        },
        {
          question: 'Le produit est-il testé sur les animaux ?',
          answer: 'Non, nos produits ne sont jamais testés sur les animaux. Nous sommes certifiés cruelty-free.',
        },
      ],
      physical: {
        variants: [
          {
            name: 'Volume',
            options: ['30ml', '50ml', '100ml'],
          },
        ],
        shipping_required: true,
        weight: 0.1, // kg
        dimensions: {
          length: 10,
          width: 5,
          height: 12,
          unit: 'cm',
        },
        inventory: {
          track_quantity: true,
          low_stock_threshold: 10,
        },
      },
      affiliate: {
        enabled: true,
        commission_rate: 20,
        commission_type: 'percentage',
      },
    },
  },

  // 4. MOBILIER / DÉCORATION
  {
    metadata: {
      id: 'physical-furniture-001',
      name: 'Meuble / Décoration',
      description: 'Template pour meubles avec dimensions, matériaux, et instructions de montage',
      category: 'furniture',
      productType: 'physical',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/physical/furniture-thumb.jpg',
      preview_images: [],
      tags: ['meuble', 'décoration', 'mobilier', 'maison', 'design'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Type de meuble] - [Style]',
        description_template: `# Meuble Design pour votre intérieur

## Caractéristiques

- Style : [moderne/classique/scandinave]
- Matériaux : [bois/métal/tissu]
- Finition : [type de finition]
- Couleur : [couleurs disponibles]

## Dimensions

- Longueur : [cm]
- Largeur : [cm]
- Hauteur : [cm]
- Poids : [kg]

## Matériaux

✅ Bois massif [type]
✅ Finition [type]
✅ Quincaillerie de qualité
✅ Traitements anti-humidité

## Assemblage

- Assemblage requis : Oui/Non
- Temps d'assemblage : [minutes]
- Outils nécessaires : Inclus/Non inclus
- Instructions détaillées fournies

## Entretien

- Nettoyer avec un chiffon doux
- Éviter les produits abrasifs
- Protéger de l'humidité excessive`,
        short_description_template: '[Meuble] en [matériau] - Style [style] - Dimensions: [L]x[l]x[H]cm',
        category: 'Mobilier & Décoration',
        pricing_model: 'one_time',
        price: 75000,
        currency: 'XOF',
        features: [
          'Design moderne et élégant',
          'Matériaux de qualité',
          'Montage facile',
          'Instructions détaillées',
          'Garantie 2 ans',
        ],
        specifications: [
          { label: 'Matériaux', value: 'Bois massif de chêne' },
          { label: 'Dimensions', value: '120 x 60 x 75 cm' },
          { label: 'Poids', value: '25 kg' },
          { label: 'Garantie', value: '2 ans' },
        ],
      },
      seo: {
        meta_title_template: '[Meuble] [Style] - [Matériau] | Design Moderne',
        meta_description_template: '[Meuble] en [matériau], style [style]. Dimensions: [L]x[l]x[H]cm. Montage facile, garantie 2 ans. Prix: [prix] FCFA',
        meta_keywords: ['meuble', 'mobilier', 'décoration', 'design', 'maison'],
      },
      faqs: [
        {
          question: 'Le montage est-il difficile ?',
          answer: 'Non, le montage est simple avec les instructions illustrées. Temps estimé: 30-45 minutes. Tous les outils nécessaires sont inclus.',
        },
        {
          question: 'Quelle est la capacité de charge ?',
          answer: 'Ce meuble peut supporter jusqu\'à [kg] kg de charge uniformément répartie.',
        },
        {
          question: 'Livrez-vous et montez-vous le meuble ?',
          answer: 'Livraison incluse. Service de montage disponible sur demande pour [prix] FCFA supplémentaires.',
        },
      ],
      physical: {
        variants: [
          {
            name: 'Couleur',
            options: ['Chêne naturel', 'Chêne foncé', 'Blanc', 'Noir'],
          },
        ],
        shipping_required: true,
        weight: 25, // kg
        dimensions: {
          length: 120,
          width: 60,
          height: 75,
          unit: 'cm',
        },
        inventory: {
          track_quantity: true,
          low_stock_threshold: 2,
        },
      },
      affiliate: {
        enabled: true,
        commission_rate: 10,
        commission_type: 'percentage',
      },
    },
  },

  // 5. ALIMENTATION / BOISSONS
  {
    metadata: {
      id: 'physical-food-001',
      name: 'Produit Alimentaire',
      description: 'Template pour produits alimentaires avec informations nutritionnelles',
      category: 'food',
      productType: 'physical',
      author: 'Payhula Team',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 5.0,
      thumbnail: '/templates/physical/food-thumb.jpg',
      preview_images: [],
      tags: ['alimentaire', 'nourriture', 'bio', 'nutrition', 'food'],
      premium: false,
    },
    data: {
      basicInfo: {
        name_template: '[Nom du Produit] - [Poids/Volume]',
        description_template: `# Produit Alimentaire de Qualité

## Description

[Description du produit alimentaire]

## Ingrédients

- Ingrédient 1
- Ingrédient 2
- Ingrédient 3

## Valeurs Nutritionnelles

Pour 100g:
- Énergie : [kcal]
- Protéines : [g]
- Glucides : [g]
  dont sucres : [g]
- Lipides : [g]
  dont acides gras saturés : [g]
- Fibres : [g]
- Sel : [g]

## Allergènes

⚠️ Contient : [liste des allergènes]
⚠️ Peut contenir des traces de : [traces]

## Conservation

- À conserver au frais/sec
- Température : [°C]
- À consommer avant le : [date]
- Après ouverture : [durée]

## Conseils d'utilisation

- Idéal pour [utilisation]
- Se consomme [chaud/froid]
- Accompagne parfaitement [suggestions]

## Certifications

✅ Bio certifié
✅ Sans OGM
✅ Sans conservateurs
✅ Produit local`,
        short_description_template: '[Produit] [Bio/Naturel] - [Poids/Volume] - [Caractéristique principale]',
        category: 'Alimentation & Boissons',
        pricing_model: 'one_time',
        price: 5000,
        currency: 'XOF',
        features: [
          'Produit 100% naturel',
          'Sans conservateurs',
          'Certification bio',
          'Production locale',
          'Fraîcheur garantie',
        ],
        specifications: [
          { label: 'Poids/Volume', value: '500g' },
          { label: 'Origine', value: 'Sénégal' },
          { label: 'Certification', value: 'Bio Afrique' },
          { label: 'DLC', value: '6 mois' },
        ],
      },
      seo: {
        meta_title_template: '[Produit Alimentaire] Bio - [Poids] | 100% Naturel',
        meta_description_template: '[Produit] bio [caractéristique]. Sans conservateurs, production locale. Informations nutritionnelles complètes. Prix: [prix] FCFA',
        meta_keywords: ['bio', 'naturel', 'alimentaire', 'nutrition', 'local'],
      },
      faqs: [
        {
          question: 'Le produit est-il bio certifié ?',
          answer: 'Oui, certifié bio par [organisme de certification]. Tous nos ingrédients sont 100% naturels et sans OGM.',
        },
        {
          question: 'Quelle est la durée de conservation ?',
          answer: 'Le produit se conserve [durée] avant ouverture. Après ouverture, consommer dans les [jours/semaines].',
        },
        {
          question: 'Y a-t-il des allergènes ?',
          answer: 'Consultez la liste des allergènes ci-dessus. Le produit peut contenir des traces de [allergènes].',
        },
      ],
      physical: {
        variants: [
          {
            name: 'Conditionnement',
            options: ['250g', '500g', '1kg'],
          },
        ],
        shipping_required: true,
        weight: 0.5, // kg
        dimensions: {
          length: 15,
          width: 10,
          height: 5,
          unit: 'cm',
        },
        inventory: {
          track_quantity: true,
          low_stock_threshold: 20,
        },
      },
      affiliate: {
        enabled: true,
        commission_rate: 15,
        commission_type: 'percentage',
      },
    },
  },
];

