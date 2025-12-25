# 🎨 ANALYSE - Système de Produits pour Artistes

## 📋 OBJECTIF

Créer un système complet et professionnel pour permettre aux artistes (écrivains, musiciens, artistes visuels, etc.) de vendre leurs œuvres sur la plateforme avec des fonctionnalités spécialisées adaptées à chaque métier.

---

## 🎯 TYPES D'ARTISTES SUPPORTÉS

### 1. **Écrivains / Auteurs**
- Livres (papier, ebook)
- Romans, nouvelles, poèmes
- Guides, manuels
- Contenu éditorial

### 2. **Musiciens / Compositeurs**
- Albums physiques (CD, vinyle)
- Téléchargements numériques
- Partitions musicales
- Merchandising (t-shirts, posters)

### 3. **Artistes Visuels**
- Peintures (originales, reproductions)
- Dessins, croquis
- Photographies (tirages, licences)
- Sculptures
- Artisanat

### 4. **Designers / Créateurs**
- Designs graphiques
- Templates
- Illustrations
- Logos, branding

### 5. **Artistes Multimédia**
- Vidéos d'art
- Installations
- NFTs (optionnel)
- Contenu interactif

---

## 🗄️ STRUCTURE BASE DE DONNÉES

### Nouveau Type de Produit

```sql
-- Ajouter 'artist' au type de produit
ALTER TABLE products 
ALTER COLUMN product_type TYPE TEXT 
CHECK (product_type IN ('digital', 'physical', 'service', 'course', 'artist'));
```

### Table `artist_products` (Extension)

```sql
CREATE TABLE IF NOT EXISTS public.artist_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  
  -- Type d'artiste
  artist_type TEXT NOT NULL CHECK (artist_type IN (
    'writer',      -- Écrivain
    'musician',    -- Musicien
    'visual_artist', -- Artiste visuel
    'designer',    -- Designer
    'multimedia',  -- Multimédia
    'other'        -- Autre
  )),
  
  -- Informations artiste
  artist_name TEXT NOT NULL,
  artist_bio TEXT,
  artist_website TEXT,
  artist_social_links JSONB, -- {instagram, facebook, twitter, etc.}
  
  -- Informations œuvre
  artwork_title TEXT NOT NULL,
  artwork_year INTEGER,
  artwork_medium TEXT, -- "Huile sur toile", "Acrylique", "Photographie", etc.
  artwork_dimensions JSONB, -- {width, height, depth, unit}
  artwork_edition_type TEXT, -- 'original', 'limited_edition', 'print', 'reproduction'
  edition_number INTEGER, -- Pour éditions limitées
  total_editions INTEGER, -- Nombre total d'éditions
  
  -- Spécificités par type
  -- Pour écrivains
  book_isbn TEXT,
  book_pages INTEGER,
  book_language TEXT,
  book_format TEXT, -- 'paperback', 'hardcover', 'ebook'
  book_genre TEXT,
  book_publisher TEXT,
  book_publication_date DATE,
  
  -- Pour musiciens
  album_format TEXT, -- 'cd', 'vinyl', 'digital', 'cassette'
  album_tracks JSONB, -- [{title, duration, artist}]
  album_genre TEXT,
  album_label TEXT,
  album_release_date DATE,
  album_duration INTEGER, -- En secondes
  
  -- Pour artistes visuels
  artwork_style TEXT, -- 'realism', 'abstract', 'impressionism', etc.
  artwork_subject TEXT, -- 'portrait', 'landscape', 'still_life', etc.
  artwork_framed BOOLEAN DEFAULT false,
  artwork_certificate_of_authenticity BOOLEAN DEFAULT false,
  
  -- Pour designers
  design_category TEXT, -- 'logo', 'template', 'illustration', etc.
  design_format JSONB, -- ['PSD', 'AI', 'PNG', 'SVG']
  design_license_type TEXT, -- 'exclusive', 'non_exclusive', 'royalty_free'
  design_commercial_use BOOLEAN DEFAULT false,
  
  -- Livraison & Expédition
  requires_shipping BOOLEAN DEFAULT true,
  shipping_handling_time INTEGER, -- Jours
  shipping_fragile BOOLEAN DEFAULT false,
  shipping_insurance_required BOOLEAN DEFAULT false,
  
  -- Authentification & Certification
  certificate_of_authenticity BOOLEAN DEFAULT false,
  certificate_file_url TEXT,
  signature_authenticated BOOLEAN DEFAULT false,
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_products_product_id ON public.artist_products(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_store_id ON public.artist_products(store_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_artist_type ON public.artist_products(artist_type);
CREATE INDEX IF NOT EXISTS idx_artist_products_edition_type ON public.artist_products(edition_type);
```

---

## 📝 TYPES TYPESCRIPT

### Interface Principale

```typescript
export interface ArtistProductFormData {
  // Informations de base (héritées de PhysicalProductFormData)
  name: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category_id: string | null;
  tags: string[];
  
  // Type d'artiste
  artist_type: 'writer' | 'musician' | 'visual_artist' | 'designer' | 'multimedia' | 'other';
  
  // Informations artiste
  artist_name: string;
  artist_bio: string;
  artist_website: string;
  artist_social_links: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    website?: string;
  };
  
  // Informations œuvre
  artwork_title: string;
  artwork_year: number | null;
  artwork_medium: string;
  artwork_dimensions: {
    width: number | null;
    height: number | null;
    depth: number | null;
    unit: 'cm' | 'in';
  };
  edition_type: 'original' | 'limited_edition' | 'print' | 'reproduction';
  edition_number: number | null;
  total_editions: number | null;
  
  // Spécificités par type
  writer_specific?: WriterProductData;
  musician_specific?: MusicianProductData;
  visual_artist_specific?: VisualArtistProductData;
  designer_specific?: DesignerProductData;
  multimedia_specific?: MultimediaProductData;
  
  // Livraison
  requires_shipping: boolean;
  shipping_handling_time: number;
  shipping_fragile: boolean;
  shipping_insurance_required: boolean;
  
  // Authentification
  certificate_of_authenticity: boolean;
  certificate_file_url: string;
  signature_authenticated: boolean;
  
  // Meta
  is_active: boolean;
}

// Spécificités par type
export interface WriterProductData {
  book_isbn: string;
  book_pages: number | null;
  book_language: string;
  book_format: 'paperback' | 'hardcover' | 'ebook';
  book_genre: string;
  book_publisher: string;
  book_publication_date: string | null;
}

export interface MusicianProductData {
  album_format: 'cd' | 'vinyl' | 'digital' | 'cassette';
  album_tracks: Array<{
    title: string;
    duration: number; // secondes
    artist: string;
  }>;
  album_genre: string;
  album_label: string;
  album_release_date: string | null;
  album_duration: number; // secondes totales
}

export interface VisualArtistProductData {
  artwork_style: string;
  artwork_subject: string;
  artwork_framed: boolean;
  artwork_certificate_of_authenticity: boolean;
}

export interface DesignerProductData {
  design_category: string;
  design_format: string[];
  design_license_type: 'exclusive' | 'non_exclusive' | 'royalty_free';
  design_commercial_use: boolean;
}

export interface MultimediaProductData {
  media_type: 'video' | 'interactive' | 'installation' | 'nft';
  media_duration: number | null;
  media_resolution: string;
  media_format: string[];
}
```

---

## 🎨 COMPOSANTS UI

### 1. **ArtistTypeSelector**
Sélection du type d'artiste avec icônes et descriptions

### 2. **ArtistBasicInfoForm**
- Informations artiste (nom, bio, site web, réseaux sociaux)
- Informations œuvre (titre, année, médium, dimensions)
- Type d'édition (original, édition limitée, reproduction)

### 3. **ArtistSpecificForms** (par type)
- **WriterForm** : ISBN, pages, langue, format, genre, éditeur
- **MusicianForm** : Format album, pistes, genre, label, date de sortie
- **VisualArtistForm** : Style, sujet, encadré, certificat
- **DesignerForm** : Catégorie, formats, licence, usage commercial
- **MultimediaForm** : Type média, durée, résolution, formats

### 4. **ArtistShippingConfig**
- Gestion de l'expédition (fragile, assurance, délai)
- Spécifique aux œuvres d'art

### 5. **ArtistAuthenticationConfig**
- Certificat d'authenticité
- Signature authentifiée
- Upload de certificats

### 6. **ArtistPreview**
Aperçu spécialisé avec galerie d'images et informations artiste

---

## 🔄 WORKFLOW DE CRÉATION

### Étapes du Wizard

1. **Type d'Artiste** - Sélection du type (écrivain, musicien, etc.)
2. **Informations Artiste** - Nom, bio, réseaux sociaux
3. **Informations Œuvre** - Titre, médium, dimensions, édition
4. **Spécificités** - Champs spécifiques selon le type
5. **Prix & Images** - Tarification et galerie
6. **Livraison** - Configuration expédition
7. **Authentification** - Certificats et signatures
8. **SEO & FAQs** - Référencement
9. **Aperçu** - Validation finale

---

## 🎯 FONCTIONNALITÉS AVANCÉES

### 1. **Galerie d'Art Virtuelle**
- Affichage en galerie avec filtres par type d'artiste
- Vue détaillée avec zoom sur les images
- Certificat d'authenticité visible

### 2. **Portfolio Artiste**
- Page dédiée par artiste
- Toutes les œuvres de l'artiste
- Biographie et réseaux sociaux

### 3. **Éditions Limitées**
- Gestion automatique des numéros d'édition
- Suivi des éditions vendues
- Alertes quand édition complète

### 4. **Certificats d'Authenticité**
- Génération automatique de certificats
- Upload de certificats existants
- Affichage sur la page produit

### 5. **Gestion des Dimensions**
- Calcul automatique des frais d'expédition selon dimensions
- Recommandations d'emballage
- Assurance automatique pour œuvres fragiles

### 6. **Réseaux Sociaux**
- Intégration des réseaux sociaux de l'artiste
- Partage automatique lors de la publication
- Liens vers portfolio externe

---

## 📊 ANALYTICS SPÉCIALISÉS

- Vues par type d'artiste
- Ventes par médium
- Popularité des styles
- Performance des éditions limitées
- Géolocalisation des acheteurs

---

## 🔒 SÉCURITÉ & AUTHENTIFICATION

- Vérification de l'identité de l'artiste
- Validation des certificats
- Protection contre la contrefaçon
- Traçabilité des œuvres

---

**Date** : 28 Janvier 2025  
**Statut** : 📋 **ANALYSE COMPLÈTE**  
**Prochaine étape** : Implémentation

