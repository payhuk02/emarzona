/**
 * 💡 ARTIST PRODUCT HELP HINTS - Phase 3 UX
 * Date: 31 Janvier 2025
 *
 * Messages d'aide contextuels améliorés pour les champs du formulaire
 */

export interface HelpHint {
  hint: string;
  examples?: string[];
  tips?: string[];
}

/**
 * Messages d'aide par champ
 */
export const FIELD_HELP_HINTS: Record<string, HelpHint> = {
  artist_name: {
    hint: "Nom complet de l'artiste tel qu'il apparaîtra sur la fiche produit",
    examples: ['Jean Dupont', 'Marie Martin', 'Collectif Artiste'],
  },
  artist_bio: {
    hint: "Présentez l'artiste, son parcours, son style artistique, ses influences...",
    tips: [
      'Mentionnez sa formation et son expérience',
      'Décrivez son style et ses techniques',
      'Ajoutez des informations sur ses expositions ou réalisations',
    ],
  },
  artist_website: {
    hint: "Site web officiel de l'artiste (portfolio, galerie, etc.)",
    examples: ['https://jean-dupont.com', 'https://galerie-artiste.fr'],
  },
  artwork_title: {
    hint: "Titre de l'œuvre tel qu'il apparaîtra dans le catalogue",
    examples: ['Soleil couchant', 'Portrait de femme', 'Composition abstraite'],
    tips: ['Soyez descriptif mais concis', 'Utilisez un titre évocateur'],
  },
  artwork_year: {
    hint: "Année de création de l'œuvre",
    examples: ['2024', '2023'],
    tips: ["Utilisez l'année réelle de création", "Permet de dater l'œuvre"],
  },
  artwork_medium: {
    hint: "Technique et matériaux utilisés pour créer l'œuvre",
    examples: [
      'Huile sur toile',
      'Acrylique sur papier',
      'Sculpture en bronze',
      'Photographie numérique',
      'Aquarelle',
    ],
    tips: ['Soyez précis sur les matériaux', 'Mentionnez la technique utilisée'],
  },
  artwork_dimensions: {
    hint: "Dimensions de l'œuvre (largeur x hauteur x profondeur si applicable)",
    examples: ['80 x 60 cm', '100 x 80 x 5 cm'],
    tips: [
      'Indiquez les dimensions réelles',
      'Utilisez des unités cohérentes (cm, m, inch)',
      'Pour les œuvres 2D, profondeur = épaisseur du support',
    ],
  },
  artwork_link_url: {
    hint: "Lien vers une page dédiée, portfolio, ou galerie en ligne de l'œuvre",
    examples: [
      'https://votre-site.com/oeuvre-soleil-couchant',
      'https://galerie.com/artiste/oeuvre-123',
    ],
    tips: [
      'Obligatoire pour les œuvres non physiques (numériques)',
      "Permet aux acheteurs de voir l'œuvre en détail",
    ],
  },
  description: {
    hint: "Description complète et détaillée de l'œuvre",
    tips: [
      "Décrivez l'histoire et la signification de l'œuvre",
      'Expliquez la technique utilisée',
      "Mentionnez l'inspiration ou le contexte de création",
      'Minimum 10 caractères requis',
    ],
  },
  short_description: {
    hint: 'Description courte pour les aperçus et listes de produits',
    examples: [
      'Œuvre abstraite aux couleurs vives, créée en 2024',
      "Portrait réaliste d'une femme, technique huile sur toile",
    ],
    tips: [
      'Maximum 160 caractères',
      'Soyez concis mais informatif',
      'Utilisé dans les résultats de recherche',
    ],
  },
  price: {
    hint: "Prix de vente de l'œuvre en XOF",
    examples: ['50000', '125000.50'],
    tips: ['Prix en francs CFA (XOF)', 'Maximum 2 décimales', 'Prix minimum: 1 XOF'],
  },
  compare_at_price: {
    hint: 'Prix de comparaison (prix barré) pour montrer une réduction',
    examples: ['75000', '150000'],
    tips: [
      'Doit être supérieur ou égal au prix de vente',
      'Affiché barré pour montrer la réduction',
      'Optionnel',
    ],
  },
  book_isbn: {
    hint: 'Numéro ISBN du livre (ISBN-10 ou ISBN-13)',
    examples: ['978-2-1234-5678-9', '2-1234-5678-9'],
    tips: [
      'Format: ISBN-10 (10 chiffres) ou ISBN-13 (13 chiffres)',
      'Les tirets sont optionnels',
      'ISBN-13 commence généralement par 978 ou 979',
    ],
  },
  book_language: {
    hint: 'Langue du livre (code ISO 639-1 ou nom complet)',
    examples: ['fr', 'Français', 'en', 'English'],
    tips: [
      'Code ISO 639-1: 2 lettres (ex: fr, en, es)',
      'Ou nom complet de la langue (ex: Français, English)',
    ],
  },
  book_genre: {
    hint: 'Genre littéraire du livre',
    examples: ['Roman', 'Science-fiction', 'Polar', 'Biographie'],
  },
  book_publisher: {
    hint: "Nom de la maison d'édition",
    examples: ['Gallimard', 'Flammarion', 'Éditions du Seuil'],
  },
  album_genre: {
    hint: "Genre musical de l'album",
    examples: ['Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Classique'],
  },
  album_label: {
    hint: "Label discographique qui a édité l'album",
    examples: ['Universal Music', 'Sony Music', 'Label indépendant'],
  },
  artwork_style: {
    hint: "Style artistique de l'œuvre",
    examples: ['Réalisme', 'Abstrait', 'Impressionnisme', 'Contemporain'],
  },
  artwork_subject: {
    hint: "Sujet principal de l'œuvre",
    examples: ['Portrait', 'Paysage', 'Nature morte', 'Abstrait'],
  },
  design_category: {
    hint: 'Catégorie du design',
    examples: ['Logo', 'Template', 'Illustration', 'Packaging'],
  },
  signature_location: {
    hint: "Emplacement de la signature sur l'œuvre",
    examples: ['En bas à droite', 'Au dos du tableau', 'Sur le cadre', 'Sur le socle'],
    tips: [
      'Indiquez précisément où se trouve la signature',
      "Augmente la valeur et l'authenticité de l'œuvre",
    ],
  },
  edition_number: {
    hint: 'Numéro de cette édition dans la série limitée',
    examples: ['1', '25', '100'],
    tips: ["Numéro de l'exemplaire (ex: 1/100)", "Doit être inférieur ou égal au total d'éditions"],
  },
  total_editions: {
    hint: "Nombre total d'exemplaires dans l'édition limitée",
    examples: ['10', '50', '100', '500'],
    tips: ["Nombre total d'exemplaires produits", "Détermine la rareté de l'œuvre"],
  },
  meta_title: {
    hint: 'Titre optimisé pour les moteurs de recherche',
    tips: [
      '30-60 caractères recommandés',
      'Incluez les mots-clés principaux',
      'Soyez descriptif et attractif',
    ],
  },
  meta_description: {
    hint: 'Description optimisée pour les moteurs de recherche',
    tips: [
      '120-160 caractères recommandés',
      'Décrivez le produit de manière attractive',
      "Incluez un appel à l'action",
    ],
  },
  meta_keywords: {
    hint: 'Mots-clés pertinents pour le référencement',
    examples: ['art, peinture, artiste africain, œuvre originale'],
    tips: [
      '3-5 mots-clés recommandés',
      'Séparés par des virgules',
      'Utilisez des termes recherchés',
    ],
  },
  og_title: {
    hint: 'Titre affiché lors du partage sur les réseaux sociaux',
    tips: ['Maximum 90 caractères', 'Soyez attractif et descriptif', 'Incluez le nom du produit'],
  },
  og_description: {
    hint: 'Description affichée lors du partage sur les réseaux sociaux',
    tips: [
      'Maximum 200 caractères',
      'Décrivez brièvement le produit',
      "Incluez un appel à l'action",
    ],
  },
  og_image: {
    hint: "URL de l'image affichée lors du partage",
    examples: ['https://example.com/image.jpg'],
    tips: ['Format recommandé: 1200x630px', 'Image de haute qualité', 'Représente bien le produit'],
  },
  faq_question: {
    hint: 'Question fréquente sur le produit',
    examples: [
      'Comment fonctionne la livraison ?',
      'Quels sont les délais de livraison ?',
      'Puis-je retourner le produit ?',
    ],
    tips: ['Soyez clair et concis', 'Maximum 255 caractères', 'Répondez aux questions courantes'],
  },
  faq_answer: {
    hint: 'Réponse détaillée à la question',
    tips: [
      'Soyez complet et informatif',
      'Maximum 1000 caractères',
      'Fournissez toutes les informations nécessaires',
    ],
  },
};

/**
 * Obtient le message d'aide pour un champ
 */
export function getFieldHelpHint(fieldKey: string): HelpHint | null {
  return FIELD_HELP_HINTS[fieldKey] || null;
}

/**
 * Formate un message d'aide pour affichage
 */
export function formatHelpHint(hint: HelpHint): string {
  let formatted = hint.hint;

  if (hint.examples && hint.examples.length > 0) {
    formatted += `\n\nExemples: ${hint.examples.join(', ')}`;
  }

  if (hint.tips && hint.tips.length > 0) {
    formatted += `\n\n💡 Conseils:\n${hint.tips.map(tip => `• ${tip}`).join('\n')}`;
  }

  return formatted;
}
