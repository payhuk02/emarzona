/**
 * Module: AI Content Generator
 * Génération premium pour les 5 verticales e-commerce Emarzona.
 */
import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

export type AIProvider = 'openrouter' | 'templates' | 'fallback';
export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export interface AIGenerationOptions {
  provider?: AIProvider;
  language?: string;
  generateImage?: boolean;
}

export interface ProductInfo {
  name: string;
  type: ProductType;
  slug?: string;
  category?: string;
  price?: number;
  features?: string[];
  targetAudience?: string;
  artistName?: string;
  artworkMedium?: string;
  courseLevel?: string;
}

export interface GeneratedContent {
  shortDescription: string;
  longDescription: string;
  features: string[];
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  imageUrl?: string | null;
  imagePrompt?: string;
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  digital: 'Produit numérique',
  physical: 'Produit physique',
  service: 'Service',
  course: 'Cours en ligne',
  artist: "Œuvre d'artiste",
};

export const generateProductContent = async (
  productInfo: ProductInfo,
  options: AIGenerationOptions = {}
): Promise<GeneratedContent> => {
  const { provider = 'openrouter', language = 'fr', generateImage = true } = options;

  if (provider === 'templates' || provider === 'fallback') {
    return generateWithTemplates(productInfo, language);
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-generate-content', {
      body: { productInfo, language, generateImage },
    });

    if (error) throw error;
    if (data?.useTemplates) {
      return generateWithTemplates(productInfo, language);
    }
    if (data?.content) {
      return data.content as GeneratedContent;
    }
    throw new Error('Empty response from AI');
  } catch (error) {
    logger.warn('AI generation failed, falling back to templates', { error });
    return generateWithTemplates(productInfo, language);
  }
};

const generateWithTemplates = (productInfo: ProductInfo, _language: string): GeneratedContent => {
  const { name, type, category, price, features } = productInfo;

  const intros: Record<ProductType, string[]> = {
    digital: [
      `Découvrez ${name}, la ressource numérique premium pour`,
      `${name} — téléchargement instantané pour`,
    ],
    physical: [`${name} allie qualité et design pour`, `Découvrez ${name}, conçu pour`],
    service: [`${name} — expertise professionnelle pour`, `Bénéficiez de ${name} pour`],
    course: [`${name} — formation complète pour`, `Maîtrisez ${name} avec ce cours pour`],
    artist: [`${name} — œuvre authentique pour`, `Collectionnez ${name}, une pièce unique pour`],
  };

  const benefits: Record<ProductType, string[]> = {
    digital: ['Accès immédiat', 'Mises à jour incluses', 'Support vendeur', 'Licence claire'],
    physical: ['Qualité premium', 'Expédition sécurisée', 'Garantie satisfait', 'Packaging soigné'],
    service: ['Experts certifiés', 'Résultats mesurables', 'Suivi personnalisé', 'Flexibilité'],
    course: ['Modules structurés', 'Progression suivie', 'Contenu à vie', 'Certificat'],
    artist: [
      'Authenticité garantie',
      'Certificat disponible',
      'Édition limitée',
      'Valeur patrimoniale',
    ],
  };

  const idx = Math.floor(Math.random() * 2);
  const shortDescription = `${intros[type][idx]} ${category || 'votre projet'}.`.slice(0, 160);

  const featureList = features?.length ? features : benefits[type];
  const longDescription = `<h2>${name}</h2>
<p>${shortDescription}</p>
<h3>Points forts</h3>
<ul>${featureList.map(f => `<li>${f}</li>`).join('')}</ul>
${price ? `<p><strong>Prix :</strong> ${price.toLocaleString()} XOF</p>` : ''}
<p>Disponible sur Emarzona — la marketplace de confiance.</p>`;

  const metaTitle = `${name}${category ? ` — ${category}` : ''} | Emarzona`.slice(0, 60);
  const metaDescription = `${shortDescription} Commandez sur Emarzona.`.slice(0, 160);
  const keywords = [
    name.toLowerCase(),
    type,
    category?.toLowerCase() || '',
    'emarzona',
    'acheter en ligne',
    ...featureList.slice(0, 4).map(f => f.toLowerCase()),
  ].filter(Boolean);

  return {
    shortDescription,
    longDescription,
    features: featureList,
    metaTitle,
    metaDescription,
    keywords,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
  };
};

export const analyzeDescriptionQuality = (
  description: string
): {
  score: number;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (description.length < 200) {
    issues.push('Description trop courte');
    suggestions.push('Ajoutez plus de détails sur les bénéfices');
    score -= 20;
  }
  if (!/qualité|premium|garantie|expert|professionnel/i.test(description)) {
    suggestions.push('Ajoutez des mots-clés de confiance');
    score -= 10;
  }
  if (!/commander|acheter|profiter|découvrir|réserver|inscrire/i.test(description)) {
    issues.push("Aucun appel à l'action détecté");
    score -= 15;
  }

  return { score: Math.max(0, score), issues, suggestions };
};
