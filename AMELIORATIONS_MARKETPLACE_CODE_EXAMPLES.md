# 💻 EXEMPLES DE CODE - AMÉLIORATIONS MARKETPLACE

## Implémentations concrètes pour les 5 systèmes e-commerce

**Date :** 31 Janvier 2025  
**Complément à :** `AUDIT_COMPLET_MARKETPLACE_2025.md`

---

## 📋 TABLE DES MATIÈRES

1. [Filtres contextuels par type](#1-filtres-contextuels-par-type)
2. [Cartes produits spécialisées](#2-cartes-produits-spécialisées)
3. [Amélioration de l'affichage des œuvres](#3-amélioration-de-laffichage-des-œuvres)
4. [Recherche améliorée](#4-recherche-améliorée)
5. [Sections dédiées par type](#5-sections-dédiées-par-type)

---

## 1. FILTRES CONTEXTUELS PAR TYPE

### 1.1 Composant ContextualFilters

```typescript
// src/components/marketplace/ContextualFilters.tsx

import { useMemo } from 'react';
import { FilterState } from '@/types/marketplace';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';

interface ContextualFiltersProps {
  productType: string;
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
}

export function ContextualFilters({ productType, filters, onFiltersChange }: ContextualFiltersProps) {
  const typeSpecificFilters = useMemo(() => {
    switch (productType) {
      case 'digital':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sous-type digital */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Sous-type</Label>
              <Select
                value={filters.digitalSubType || 'all'}
                onValueChange={(value) => onFiltersChange({ digitalSubType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les sous-types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les sous-types</SelectItem>
                  <SelectItem value="software">Logiciel</SelectItem>
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="plugin">Plugin</SelectItem>
                  <SelectItem value="music">Musique</SelectItem>
                  <SelectItem value="video">Vidéo</SelectItem>
                  <SelectItem value="graphic">Graphisme</SelectItem>
                  <SelectItem value="game">Jeu</SelectItem>
                  <SelectItem value="app">Application</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="data">Données</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type de licence */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type de licence</Label>
              <Select
                value={filters.licensingType || 'all'}
                onValueChange={(value) => onFiltersChange({ licensingType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les licences" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les licences</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="plr">PLR</SelectItem>
                  <SelectItem value="copyrighted">Droit d'auteur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Livraison instantanée */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="instantDelivery"
                checked={filters.instantDelivery || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ instantDelivery: checked as boolean })
                }
              />
              <Label htmlFor="instantDelivery" className="text-sm">
                Livraison instantanée uniquement
              </Label>
            </div>
          </div>
        );

      case 'physical':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Disponibilité stock */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Disponibilité</Label>
              <Select
                value={filters.stockAvailability || 'all'}
                onValueChange={(value) => onFiltersChange({ stockAvailability: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les disponibilités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les disponibilités</SelectItem>
                  <SelectItem value="in_stock">En stock</SelectItem>
                  <SelectItem value="low_stock">Stock faible</SelectItem>
                  <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Livraison */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Livraison</Label>
              <Select
                value={filters.shippingType || 'all'}
                onValueChange={(value) => onFiltersChange({ shippingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types de livraison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="free">Livraison gratuite</SelectItem>
                  <SelectItem value="paid">Livraison payante</SelectItem>
                  <SelectItem value="pickup">Retrait en magasin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégorie physique */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Catégorie</Label>
              <Select
                value={filters.physicalCategory || 'all'}
                onValueChange={(value) => onFiltersChange({ physicalCategory: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="vetements">Vêtements</SelectItem>
                  <SelectItem value="electronique">Électronique</SelectItem>
                  <SelectItem value="maison">Maison & Jardin</SelectItem>
                  <SelectItem value="sport">Sport</SelectItem>
                  <SelectItem value="beaute">Beauté</SelectItem>
                  <SelectItem value="jouets">Jouets</SelectItem>
                  <SelectItem value="alimentation">Alimentation</SelectItem>
                  <SelectItem value="artisanat">Artisanat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type de service */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type de service</Label>
              <Select
                value={filters.serviceType || 'all'}
                onValueChange={(value) => onFiltersChange({ serviceType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="appointment">Rendez-vous</SelectItem>
                  <SelectItem value="class">Cours</SelectItem>
                  <SelectItem value="event">Événement</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Localisation */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Localisation</Label>
              <Select
                value={filters.locationType || 'all'}
                onValueChange={(value) => onFiltersChange({ locationType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les localisations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les localisations</SelectItem>
                  <SelectItem value="online">En ligne</SelectItem>
                  <SelectItem value="on_site">Sur site</SelectItem>
                  <SelectItem value="customer_location">Chez vous</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Disponibilité calendrier */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="calendarAvailable"
                checked={filters.calendarAvailable || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ calendarAvailable: checked as boolean })
                }
              />
              <Label htmlFor="calendarAvailable" className="text-sm">
                Calendrier disponible
              </Label>
            </div>
          </div>
        );

      case 'course':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Niveau de difficulté */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Niveau</Label>
              <Select
                value={filters.difficulty || 'all'}
                onValueChange={(value) => onFiltersChange({ difficulty: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les niveaux" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les niveaux</SelectItem>
                  <SelectItem value="beginner">Débutant</SelectItem>
                  <SelectItem value="intermediate">Intermédiaire</SelectItem>
                  <SelectItem value="advanced">Avancé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type d'accès */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type d'accès</Label>
              <Select
                value={filters.accessType || 'all'}
                onValueChange={(value) => onFiltersChange({ accessType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types d'accès" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="lifetime">Accès à vie</SelectItem>
                  <SelectItem value="subscription">Abonnement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Durée totale */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Durée totale</Label>
              <Select
                value={filters.courseDuration || 'all'}
                onValueChange={(value) => onFiltersChange({ courseDuration: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les durées" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les durées</SelectItem>
                  <SelectItem value="<1h">Moins de 1h</SelectItem>
                  <SelectItem value="1-5h">1h à 5h</SelectItem>
                  <SelectItem value="5-10h">5h à 10h</SelectItem>
                  <SelectItem value="10h+">Plus de 10h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'artist':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type d'artiste */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type d'artiste</Label>
              <Select
                value={filters.artistType || 'all'}
                onValueChange={(value) => onFiltersChange({ artistType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="writer">Écrivain</SelectItem>
                  <SelectItem value="musician">Musicien</SelectItem>
                  <SelectItem value="visual_artist">Artiste visuel</SelectItem>
                  <SelectItem value="designer">Designer</SelectItem>
                  <SelectItem value="multimedia">Multimédia</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type d'édition */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Type d'édition</Label>
              <Select
                value={filters.editionType || 'all'}
                onValueChange={(value) => onFiltersChange({ editionType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                  <SelectItem value="limited_edition">Édition limitée</SelectItem>
                  <SelectItem value="print">Tirage</SelectItem>
                  <SelectItem value="reproduction">Reproduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificat d'authenticité */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="certificateOfAuthenticity"
                checked={filters.certificateOfAuthenticity || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ certificateOfAuthenticity: checked as boolean })
                }
              />
              <Label htmlFor="certificateOfAuthenticity" className="text-sm">
                Certificat d'authenticité uniquement
              </Label>
            </div>

            {/* Disponibilité */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Disponibilité</Label>
              <Select
                value={filters.artworkAvailability || 'all'}
                onValueChange={(value) => onFiltersChange({ artworkAvailability: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les disponibilités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les disponibilités</SelectItem>
                  <SelectItem value="available">Disponible</SelectItem>
                  <SelectItem value="limited">Édition limitée disponible</SelectItem>
                  <SelectItem value="sold_out">Épuisé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [productType, filters, onFiltersChange]);

  if (productType === 'all' || !typeSpecificFilters) {
    return null;
  }

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Filtres spécifiques - {getProductTypeLabel(productType)}
        </h3>
        {typeSpecificFilters}
      </CardContent>
    </Card>
  );
}

function getProductTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    digital: 'Produits Digitaux',
    physical: 'Produits Physiques',
    service: 'Services',
    course: 'Cours en ligne',
    artist: 'Œuvres d\'artistes',
  };
  return labels[type] || type;
}
```

### 1.2 Mise à jour du type FilterState

```typescript
// src/types/marketplace.ts

export interface FilterState {
  search: string;
  category: string;
  productType: string;
  licensingType?: 'all' | 'standard' | 'plr' | 'copyrighted';
  priceRange: string;
  rating: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  tags: string[];
  verifiedOnly: boolean;
  featuredOnly: boolean;
  inStock: boolean;

  // Filtres spécifiques Digital
  digitalSubType?: string;
  instantDelivery?: boolean;

  // Filtres spécifiques Physical
  stockAvailability?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  shippingType?: 'all' | 'free' | 'paid' | 'pickup';
  physicalCategory?: string;

  // Filtres spécifiques Service
  serviceType?: string;
  locationType?: 'all' | 'online' | 'on_site' | 'customer_location';
  calendarAvailable?: boolean;

  // Filtres spécifiques Course
  difficulty?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  accessType?: 'all' | 'lifetime' | 'subscription';
  courseDuration?: 'all' | '<1h' | '1-5h' | '5-10h' | '10h+';

  // Filtres spécifiques Artist
  artistType?: string;
  editionType?: 'all' | 'original' | 'limited_edition' | 'print' | 'reproduction';
  certificateOfAuthenticity?: boolean;
  artworkAvailability?: 'all' | 'available' | 'limited' | 'sold_out';
}
```

---

## 2. CARTES PRODUITS SPÉCIALISÉES

### 2.1 Carte spécialisée pour les œuvres d'artistes

```typescript
// src/components/products/ArtistProductCard.tsx

import { UnifiedProduct, ArtistProduct } from '@/types/unified-product';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Palette, Award, Shield, Package, User } from 'lucide-react';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { formatPrice } from '@/lib/product-helpers';

interface ArtistProductCardProps {
  product: ArtistProduct;
  onAction?: (action: 'view' | 'buy', product: UnifiedProduct) => void;
}

export function ArtistProductCard({ product, onAction }: ArtistProductCardProps) {
  const artistTypeLabels: Record<string, string> = {
    writer: 'Écrivain',
    musician: 'Musicien',
    visual_artist: 'Artiste visuel',
    designer: 'Designer',
    multimedia: 'Multimédia',
    other: 'Artiste',
  };

  const editionLabels: Record<string, string> = {
    original: 'Original',
    limited_edition: 'Édition limitée',
    print: 'Tirage',
    reproduction: 'Reproduction',
  };

  return (
    <Card className="group relative flex flex-col h-full bg-transparent border border-gray-200 rounded-xl overflow-hidden">
      {/* Image avec galerie */}
      <div className="relative w-full overflow-hidden bg-muted/30 flex-grow min-h-[300px]">
        {product.image_url ? (
          <ResponsiveProductImage
            src={product.image_url}
            alt={product.artwork_title || product.name}
            className="w-full h-full object-cover"
            priority={true}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-transparent">
            <Palette className="h-16 w-16 text-gray-400 opacity-20" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          <Badge variant="default" className="bg-pink-600 text-white font-semibold">
            {artistTypeLabels[product.artist_type || 'other'] || 'Artiste'}
          </Badge>

          {product.edition_type && (
            <Badge variant="secondary" className="bg-purple-600 text-white">
              {editionLabels[product.edition_type] || product.edition_type}
            </Badge>
          )}

          {product.certificate_of_authenticity && (
            <Badge variant="default" className="bg-green-600 text-white flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Certifié
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4">
        {/* Nom de l'artiste - Mise en avant */}
        {product.artist_name && (
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">
              {product.artist_name}
            </span>
          </div>
        )}

        {/* Titre de l'œuvre */}
        <h3 className="font-semibold text-lg leading-tight line-clamp-2 mb-2 text-gray-900">
          {product.artwork_title || product.name}
        </h3>

        {/* Informations spécifiques */}
        <div className="flex flex-wrap gap-2 mb-3">
          {product.artwork_year && (
            <span className="text-xs text-gray-600">
              {product.artwork_year}
            </span>
          )}

          {product.artwork_medium && (
            <span className="text-xs text-gray-600">
              {product.artwork_medium}
            </span>
          )}

          {product.artwork_dimensions && (
            <span className="text-xs text-gray-600">
              {product.artwork_dimensions.width} × {product.artwork_dimensions.height}
              {product.artwork_dimensions.unit && ` ${product.artwork_dimensions.unit}`}
            </span>
          )}
        </div>

        {/* Édition limitée */}
        {product.edition_type === 'limited_edition' && product.edition_number && product.total_editions && (
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-700">
              Édition {product.edition_number}/{product.total_editions}
            </span>
          </div>
        )}

        {/* Livraison fragile */}
        {product.shipping_fragile && (
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-orange-600">
              Livraison fragile - Assurance requise
            </span>
          </div>
        )}

        {/* Prix et Actions */}
        <div className="mt-auto pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-bold text-blue-600">
              {formatPrice(product.price, product.currency)}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onAction?.('view', product)}
            >
              Voir les détails
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => onAction?.('buy', product)}
            >
              Acheter
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## 3. AMÉLIORATION DE L'AFFICHAGE DES ŒUVRES

### 3.1 Section Galerie d'art

```typescript
// src/components/marketplace/ArtGallerySection.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';
import { ArtistProductCard } from '@/components/products/ArtistProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Sparkles } from 'lucide-react';

export function ArtGallerySection() {
  const [artworks, setArtworks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (id, name, slug, logo_url),
            artist_products!inner (
              artist_type,
              artist_name,
              artwork_title,
              artwork_year,
              artwork_medium,
              artwork_dimensions,
              edition_type,
              edition_number,
              total_editions,
              certificate_of_authenticity,
              shipping_fragile
            )
          `)
          .eq('product_type', 'artist')
          .eq('is_active', true)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;
        setArtworks((data || []) as Product[]);
      } catch (error) {
        console.error('Error fetching artworks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  if (loading) {
    return <div>Chargement de la galerie...</div>;
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto max-w-7xl">
        <CardHeader className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="h-8 w-8 text-pink-600" />
            <CardTitle className="text-3xl font-bold text-gray-900">
              Galerie d'Art
            </CardTitle>
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Découvrez des œuvres uniques d'artistes talentueux. Chaque pièce est authentique et certifiée.
          </p>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {artworks.map((artwork) => {
            const unifiedProduct = transformToUnifiedProduct(artwork);
            if (unifiedProduct.type !== 'artist') return null;

            return (
              <ArtistProductCard
                key={artwork.id}
                product={unifiedProduct}
                onAction={(action, product) => {
                  if (action === 'view') {
                    window.location.href = `/stores/${artwork.stores?.slug}/products/${artwork.slug}`;
                  } else if (action === 'buy') {
                    // Logique d'achat
                  }
                }}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

---

## 4. RECHERCHE AMÉLIORÉE

### 4.1 Mise à jour de la fonction RPC search_products

```sql
-- supabase/migrations/YYYYMMDD_improve_search_products.sql

CREATE OR REPLACE FUNCTION search_products(
  p_search_query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_category TEXT DEFAULT NULL,
  p_product_type TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_rating NUMERIC DEFAULT NULL,
  -- Nouveaux paramètres pour filtres spécifiques
  p_digital_sub_type TEXT DEFAULT NULL,
  p_licensing_type TEXT DEFAULT NULL,
  p_stock_availability TEXT DEFAULT NULL,
  p_service_type TEXT DEFAULT NULL,
  p_location_type TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_access_type TEXT DEFAULT NULL,
  p_artist_type TEXT DEFAULT NULL,
  p_edition_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  image_url TEXT,
  price NUMERIC,
  promotional_price NUMERIC,
  currency TEXT,
  category TEXT,
  product_type TEXT,
  rating NUMERIC,
  reviews_count INTEGER,
  purchases_count INTEGER,
  store_id UUID,
  store_name TEXT,
  store_slug TEXT,
  store_logo_url TEXT,
  rank NUMERIC,
  match_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH product_search AS (
    SELECT
      p.id,
      p.name,
      p.slug,
      p.description,
      p.image_url,
      p.price,
      p.promotional_price,
      p.currency,
      p.category,
      p.product_type,
      p.rating,
      p.reviews_count,
      p.purchases_count,
      p.store_id,
      s.name AS store_name,
      s.slug AS store_slug,
      s.logo_url AS store_logo_url,
      -- Calcul du rank selon la pertinence
      CASE
        WHEN p.name ILIKE '%' || p_search_query || '%' THEN 100
        WHEN p.description ILIKE '%' || p_search_query || '%' THEN 50
        ELSE 10
      END AS rank,
      CASE
        WHEN p.name ILIKE p_search_query THEN 'exact_name'
        WHEN p.name ILIKE p_search_query || '%' THEN 'starts_with'
        WHEN p.description ILIKE '%' || p_search_query || '%' THEN 'full_text'
        ELSE 'partial'
      END AS match_type
    FROM products p
    INNER JOIN stores s ON p.store_id = s.id
    WHERE
      p.is_active = true
      AND p.is_draft = false
      AND (
        p.name ILIKE '%' || p_search_query || '%'
        OR p.description ILIKE '%' || p_search_query || '%'
        OR p.category ILIKE '%' || p_search_query || '%'
      )
      -- Filtres de base
      AND (p_category IS NULL OR p.category = p_category)
      AND (p_product_type IS NULL OR p.product_type = p_product_type)
      AND (p_min_price IS NULL OR p.price >= p_min_price)
      AND (p_max_price IS NULL OR p.price <= p_max_price)
      AND (p_min_rating IS NULL OR p.rating >= p_min_rating)
      -- Filtres spécifiques Digital
      AND (
        p_product_type != 'digital'
        OR p_digital_sub_type IS NULL
        OR EXISTS (
          SELECT 1 FROM digital_products dp
          WHERE dp.product_id = p.id
          AND dp.digital_type = p_digital_sub_type
        )
      )
      AND (
        p_product_type != 'digital'
        OR p_licensing_type IS NULL
        OR p.licensing_type = p_licensing_type
      )
      -- Filtres spécifiques Physical
      AND (
        p_product_type != 'physical'
        OR p_stock_availability IS NULL
        OR (
          (p_stock_availability = 'in_stock' AND (p.stock_quantity IS NULL OR p.stock_quantity > 0))
          OR (p_stock_availability = 'low_stock' AND p.stock_quantity BETWEEN 1 AND 10)
          OR (p_stock_availability = 'out_of_stock' AND p.stock_quantity = 0)
        )
      )
      -- Filtres spécifiques Service
      AND (
        p_product_type != 'service'
        OR p_service_type IS NULL
        OR EXISTS (
          SELECT 1 FROM service_products sp
          WHERE sp.product_id = p.id
          AND sp.service_type = p_service_type
        )
      )
      AND (
        p_product_type != 'service'
        OR p_location_type IS NULL
        OR EXISTS (
          SELECT 1 FROM service_products sp
          WHERE sp.product_id = p.id
          AND sp.location_type = p_location_type
        )
      )
      -- Filtres spécifiques Course
      AND (
        p_product_type != 'course'
        OR p_difficulty IS NULL
        OR EXISTS (
          SELECT 1 FROM courses c
          WHERE c.product_id = p.id
          AND c.difficulty = p_difficulty
        )
      )
      AND (
        p_product_type != 'course'
        OR p_access_type IS NULL
        OR EXISTS (
          SELECT 1 FROM courses c
          WHERE c.product_id = p.id
          AND c.access_type = p_access_type
        )
      )
      -- Filtres spécifiques Artist
      AND (
        p_product_type != 'artist'
        OR p_artist_type IS NULL
        OR EXISTS (
          SELECT 1 FROM artist_products ap
          WHERE ap.product_id = p.id
          AND ap.artist_type = p_artist_type
        )
      )
      AND (
        p_product_type != 'artist'
        OR p_edition_type IS NULL
        OR EXISTS (
          SELECT 1 FROM artist_products ap
          WHERE ap.product_id = p.id
          AND ap.artwork_edition_type = p_edition_type
        )
      )
  )
  SELECT * FROM product_search
  ORDER BY rank DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. SECTIONS DÉDIÉES PAR TYPE

### 5.1 Composant TypeSpecificSection

```typescript
// src/components/marketplace/TypeSpecificSection.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';
import { UnifiedProductCard } from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TypeSpecificSectionProps {
  productType: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  filterType?: 'trending' | 'new' | 'bestsellers';
  limit?: number;
}

export function TypeSpecificSection({
  productType,
  title,
  subtitle,
  icon: Icon,
  filterType = 'trending',
  limit = 8,
}: TypeSpecificSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select(`
            *,
            stores!inner (id, name, slug, logo_url),
            product_affiliate_settings!left (commission_rate, affiliate_enabled)
          `)
          .eq('product_type', productType)
          .eq('is_active', true)
          .eq('is_draft', false);

        // Appliquer le filtre selon le type
        switch (filterType) {
          case 'trending':
            query = query.order('purchases_count', { ascending: false });
            break;
          case 'new':
            query = query.order('created_at', { ascending: false });
            break;
          case 'bestsellers':
            query = query.order('reviews_count', { ascending: false });
            break;
        }

        query = query.limit(limit);

        const { data, error } = await query;
        if (error) throw error;
        setProducts((data || []) as Product[]);
      } catch (error) {
        console.error(`Error fetching ${productType} products:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productType, filterType, limit]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <CardHeader className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Icon className="h-8 w-8 text-blue-600" />
            <CardTitle className="text-3xl font-bold">{title}</CardTitle>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {products.map((product) => {
            const unifiedProduct = transformToUnifiedProduct(product);
            return (
              <UnifiedProductCard
                key={product.id}
                product={unifiedProduct}
                variant="marketplace"
                showAffiliate={true}
                showActions={true}
                onAction={(action, prod) => {
                  if (action === 'view') {
                    window.location.href = `/stores/${product.stores?.slug}/products/${product.slug}`;
                  } else if (action === 'buy') {
                    // Logique d'achat
                  }
                }}
              />
            );
          })}
        </div>

        <div className="text-center">
          <Link to={`/marketplace?productType=${productType}`}>
            <Button variant="outline" size="lg">
              Voir tous les {title.toLowerCase()}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

### 5.2 Utilisation dans Marketplace.tsx

```typescript
// Dans src/pages/Marketplace.tsx, ajouter après la section hero :

{/* Sections dédiées par type */}
<TypeSpecificSection
  productType="digital"
  title="Produits Digitaux Tendances"
  subtitle="Découvrez les produits digitaux les plus populaires"
  icon={Download}
  filterType="trending"
  limit={8}
/>

<TypeSpecificSection
  productType="physical"
  title="Nouveaux Produits Physiques"
  subtitle="Les dernières arrivées dans notre catalogue"
  icon={Package}
  filterType="new"
  limit={8}
/>

<TypeSpecificSection
  productType="service"
  title="Services les Plus Demandés"
  subtitle="Les services les plus appréciés par nos clients"
  icon={Calendar}
  filterType="bestsellers"
  limit={8}
/>

<TypeSpecificSection
  productType="course"
  title="Cours en Ligne Populaires"
  subtitle="Les formations les plus suivies"
  icon={GraduationCap}
  filterType="trending"
  limit={8}
/>

{/* Section Galerie d'art */}
<ArtGallerySection />
```

---

## 📝 NOTES D'IMPLÉMENTATION

### Ordre de priorité recommandé :

1. **Semaine 1 :** Implémenter `ContextualFilters` et mettre à jour `FilterState`
2. **Semaine 2 :** Créer les cartes spécialisées (commencer par Artist)
3. **Semaine 3 :** Implémenter les sections dédiées par type
4. **Semaine 4 :** Améliorer la recherche full-text avec les nouveaux filtres
5. **Semaine 5-6 :** Tests, optimisations et polish

### Points d'attention :

- ⚠️ Vérifier que toutes les tables nécessaires existent (digital_products, service_products, artist_products, courses)
- ⚠️ S'assurer que les migrations SQL sont appliquées
- ⚠️ Tester avec des données réelles pour chaque type de produit
- ⚠️ Vérifier les performances avec un grand nombre de produits

---

**Document généré le :** 31 Janvier 2025  
**Version :** 1.0  
**Statut :** Prêt pour implémentation
