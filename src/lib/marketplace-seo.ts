import { FilterState } from '@/types/marketplace';
import { filtersToSearchParams } from '@/lib/marketplace-url-filters';

const PRODUCT_TYPE_SEO: Record<string, { title: string; description: string; keywords: string }> = {
  digital: {
    title: 'Produits digitaux',
    description:
      'eBooks, templates, logiciels et ressources numériques sur Emarzona. Téléchargement instantané, paiement sécurisé.',
    keywords: 'produits digitaux, ebook, template, logiciel, téléchargement',
  },
  physical: {
    title: 'Produits physiques',
    description:
      'Articles physiques avec livraison sur Emarzona. Boutiques vérifiées, stock en temps réel.',
    keywords: 'produits physiques, livraison, ecommerce, stock',
  },
  service: {
    title: 'Services',
    description:
      'Prestations et consultations à réserver en ligne sur Emarzona. Freelances et experts.',
    keywords: 'services, prestation, réservation, consultation',
  },
  course: {
    title: 'Cours en ligne',
    description:
      'Formations et cours en ligne sur Emarzona. Apprenez à votre rythme avec des créateurs certifiés.',
    keywords: 'cours en ligne, formation, e-learning, LMS',
  },
  artist: {
    title: "Œuvres d'artistes",
    description:
      "Art digital, illustrations et œuvres uniques sur Emarzona. Éditions limitées et certificats d'authenticité.",
    keywords: 'art, artiste, œuvre, illustration, NFT',
  },
};

export interface MarketplaceSEOData {
  title: string;
  description: string;
  keywords: string;
  url: string;
  h1?: string;
}

function buildCanonical(
  origin: string,
  filters: FilterState,
  search: string,
  page: number
): string {
  const params = filtersToSearchParams({ ...filters, search }, page, search);
  const qs = params.toString();
  return `${origin}/marketplace${qs ? `?${qs}` : ''}`;
}

function humanizeCategory(slug: string): string {
  return slug
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Meta title / description dynamiques selon filtres actifs (partage URL + indexation).
 */
export function buildMarketplaceSEO(
  filters: FilterState,
  options: {
    totalProducts: number;
    searchQuery: string;
    origin: string;
    page?: number;
  }
): MarketplaceSEOData {
  const { totalProducts, searchQuery, origin, page = 1 } = options;
  const countLabel = totalProducts > 0 ? ` (${totalProducts})` : '';
  const canonical = buildCanonical(origin, filters, searchQuery, page);

  if (searchQuery.trim()) {
    const q = searchQuery.trim();
    return {
      title: `Recherche « ${q} »${countLabel} | Marketplace Emarzona`,
      description: `${totalProducts} résultat${totalProducts !== 1 ? 's' : ''} pour « ${q} » sur le marketplace Emarzona. Produits digitaux, physiques, services, cours et art.`,
      keywords: `${q}, marketplace, recherche produits, emarzona`,
      url: canonical,
      h1: `Résultats pour « ${q} »`,
    };
  }

  const typeSeo = filters.productType !== 'all' ? PRODUCT_TYPE_SEO[filters.productType] : undefined;
  const categoryLabel =
    filters.category === 'featured'
      ? 'En vedette'
      : filters.category !== 'all'
        ? humanizeCategory(filters.category)
        : null;

  if (typeSeo && categoryLabel) {
    return {
      title: `${typeSeo.title} — ${categoryLabel}${countLabel} | Emarzona`,
      description: `${totalProducts} ${typeSeo.title.toLowerCase()} dans la catégorie ${categoryLabel}. ${typeSeo.description}`,
      keywords: `${typeSeo.keywords}, ${categoryLabel}`,
      url: canonical,
      h1: `${typeSeo.title} · ${categoryLabel}`,
    };
  }

  if (typeSeo) {
    return {
      title: `${typeSeo.title}${countLabel} | Marketplace Emarzona`,
      description: `${totalProducts} offres : ${typeSeo.description}`,
      keywords: typeSeo.keywords,
      url: canonical,
      h1: typeSeo.title,
    };
  }

  if (categoryLabel) {
    return {
      title: `${categoryLabel}${countLabel} | Marketplace Emarzona`,
      description: `Parcourez ${totalProducts} produits dans la catégorie ${categoryLabel} sur Emarzona.`,
      keywords: `${categoryLabel}, marketplace, catégorie, emarzona`,
      url: canonical,
      h1: categoryLabel,
    };
  }

  if (filters.featuredOnly) {
    return {
      title: `Produits en vedette${countLabel} | Marketplace Emarzona`,
      description: `Sélection de ${totalProducts} produits mis en avant par nos vendeurs sur Emarzona.`,
      keywords: 'vedette, featured, marketplace, bestsellers',
      url: canonical,
      h1: 'Produits en vedette',
    };
  }

  return {
    title: `Marketplace Emarzona${countLabel}`,
    description: `Découvrez ${totalProducts} produits sur Emarzona : digitaux, physiques, services, cours en ligne et œuvres d'art. Paiement sécurisé Mobile Money & Moneroo.`,
    keywords:
      "marketplace afrique, produits digitaux, produits physiques, services, cours en ligne, œuvres d'art, ecommerce afrique, XOF, FCFA",
    url: canonical,
    h1: 'Marketplace',
  };
}

export function buildMarketplaceBreadcrumbs(
  filters: FilterState,
  searchQuery: string,
  origin: string
): Array<{ name: string; url: string }> {
  const items: Array<{ name: string; url: string }> = [
    { name: 'Accueil', url: `${origin}/` },
    { name: 'Marketplace', url: `${origin}/marketplace` },
  ];

  const seo = buildMarketplaceSEO(filters, {
    totalProducts: 0,
    searchQuery,
    origin,
  });

  if (searchQuery.trim()) {
    items.push({
      name: `Recherche`,
      url: seo.url,
    });
    return items;
  }

  if (filters.productType !== 'all') {
    const typeLabel = PRODUCT_TYPE_SEO[filters.productType]?.title ?? filters.productType;
    items.push({
      name: typeLabel,
      url: buildCanonical(origin, { ...filters, category: 'all' }, '', 1),
    });
  }

  if (filters.category !== 'all' && filters.category !== 'featured') {
    items.push({
      name: humanizeCategory(filters.category),
      url: seo.url,
    });
  } else if (filters.category === 'featured') {
    items.push({ name: 'En vedette', url: seo.url });
  }

  return items;
}
