export type ProductAiType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export const PRODUCT_TYPE_LABELS: Record<ProductAiType, string> = {
  digital: 'produit numérique',
  physical: 'produit physique',
  service: 'service professionnel',
  course: 'cours en ligne',
  artist: "œuvre d'artiste",
};

export const CATALOG_PATH_BY_TYPE: Record<ProductAiType, string> = {
  digital: 'digital',
  physical: 'products',
  service: 'services',
  course: 'courses',
  artist: 'artist',
};

export function buildProductSystemPrompt(
  basePrompt: string,
  type: ProductAiType,
  typePrompts: Record<string, string>
): string {
  const typeHint = typePrompts[type] || PRODUCT_TYPE_LABELS[type];
  return `${basePrompt}

Verticale e-commerce : ${PRODUCT_TYPE_LABELS[type]}.
Contexte spécifique : ${typeHint}

Tu maîtrises la plateforme Emarzona et ses 5 systèmes : produits digitaux, produits physiques, services, cours en ligne et œuvres d'artiste.`;
}

export function buildProductUserPrompt(
  p: {
    name: string;
    type: ProductAiType;
    category?: string;
    price?: number;
    features?: string[];
    targetAudience?: string;
    artistName?: string;
    artworkMedium?: string;
    courseLevel?: string;
  },
  language = 'fr',
  minWords = 350
): string {
  const lines = [
    `Génère une fiche produit premium SEO en ${language} pour Emarzona.`,
    `- Nom : ${p.name}`,
    `- Type : ${PRODUCT_TYPE_LABELS[p.type]}`,
    `- Catégorie : ${p.category || 'non spécifiée'}`,
    `- Prix : ${p.price ? `${p.price} XOF` : 'non défini'}`,
  ];
  if (p.targetAudience) lines.push(`- Public cible : ${p.targetAudience}`);
  if (p.features?.length) lines.push(`- Points clés : ${p.features.join(', ')}`);
  if (p.artistName) lines.push(`- Artiste : ${p.artistName}`);
  if (p.artworkMedium) lines.push(`- Médium : ${p.artworkMedium}`);
  if (p.courseLevel) lines.push(`- Niveau cours : ${p.courseLevel}`);

  lines.push(
    '',
    `Exigences :`,
    `- Description longue en HTML (h2, h3, p, ul, strong) — minimum ${minWords} mots`,
    `- Ton premium, orienté conversion, mots-clés naturels`,
    `- 5-8 caractéristiques / bénéfices`,
    `- Meta title 50-60 car., meta description 150-160 car. avec CTA`,
    `- 10-15 mots-clés SEO`,
    `- Prompt image produit premium (sans texte dans l'image), format paysage 3:2 (1536×1024 px)`
  );
  return lines.join('\n');
}

export const PRODUCT_CONTENT_TOOL = {
  type: 'function',
  function: {
    name: 'output_product_content',
    description: 'Contenu produit structuré premium pour Emarzona',
    parameters: {
      type: 'object',
      properties: {
        shortDescription: { type: 'string', description: '120-160 caractères accrocheurs' },
        longDescription: { type: 'string', description: 'HTML structuré premium, SEO' },
        features: { type: 'array', items: { type: 'string' }, description: '5-8 points clés' },
        metaTitle: { type: 'string', description: '50-60 caractères' },
        metaDescription: { type: 'string', description: '150-160 caractères avec CTA' },
        keywords: { type: 'array', items: { type: 'string' }, description: '10-15 mots-clés' },
        ogTitle: { type: 'string', description: 'Titre Open Graph' },
        ogDescription: { type: 'string', description: 'Description Open Graph' },
        imagePrompt: { type: 'string', description: 'Prompt pour photo produit premium' },
      },
      required: [
        'shortDescription',
        'longDescription',
        'features',
        'metaTitle',
        'metaDescription',
        'keywords',
        'ogTitle',
        'ogDescription',
        'imagePrompt',
      ],
      additionalProperties: false,
    },
  },
};
