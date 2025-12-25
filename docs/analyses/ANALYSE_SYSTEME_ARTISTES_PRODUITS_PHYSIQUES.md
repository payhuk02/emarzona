# 🎨 ANALYSE - Système E-commerce pour Artistes (Produits Physiques)

## 📋 OBJECTIF

Ajouter un système spécialisé pour les artistes (écrivains, musiciens, artistes visuels, etc.) dans le système e-commerce de produits physiques avec des fonctionnalités avancées adaptées à leurs besoins spécifiques.

---

## 🔍 ANALYSE DU SYSTÈME ACTUEL

### Structure Actuelle des Produits Physiques

**Wizard en 9 étapes** :
1. Informations de base (nom, description, prix, images)
2. Variantes & Options (couleurs, tailles, options)
3. Inventaire (stock, SKU, tracking)
4. Expédition (poids, dimensions, frais)
5. Guide des Tailles (size chart)
6. Affiliation (commission, affiliés)
7. SEO & FAQs
8. Options de Paiement
9. Aperçu & Validation

**Tables Supabase** :
- `products` (table centrale)
- `physical_products` (détails produits physiques)
- `product_variants` (variantes)
- `inventory_items` (inventaire)
- `stock_movements` (mouvements de stock)

---

## 🎨 BESOINS SPÉCIFIQUES DES ARTISTES

### 1. ÉCRIVAINS / AUTEURS

**Produits** :
- Livres (papier, reliés, brochés)
- E-books (version physique)
- Manuscrits
- Livres dédicacés
- Collections limitées

**Fonctionnalités nécessaires** :
- ✅ **Informations du livre** : ISBN, nombre de pages, format, langue, date de publication
- ✅ **Auteur** : Nom, biographie, photo, autres œuvres
- ✅ **Édition** : Éditeur, collection, numéro d'édition
- ✅ **Dédicace** : Option de dédicace personnalisée, message personnalisé
- ✅ **Édition limitée** : Numérotation, signature, certificat d'authenticité
- ✅ **Aperçu** : Extrait, table des matières, critiques
- ✅ **Format** : Broché, relié, poche, grand format
- ✅ **Langue** : Français, anglais, etc.

### 2. MUSICIENS / ARTISTES MUSICAUX

**Produits** :
- CDs, Vinyls, Cassettes
- Partitions musicales
- Merchandising (t-shirts, posters, accessoires)
- Instruments de musique
- Équipements audio

**Fonctionnalités nécessaires** :
- ✅ **Informations musicales** : Genre, durée, nombre de pistes, année de sortie
- ✅ **Artiste** : Nom, biographie, photo, autres albums
- ✅ **Format audio** : CD, Vinyl, Cassette, Digital (physique)
- ✅ **Édition spéciale** : Édition limitée, collector, autographiée
- ✅ **Aperçu** : Extrait audio, liste des pistes, paroles
- ✅ **Merchandising** : T-shirts, posters, accessoires liés
- ✅ **Instruments** : Type, marque, modèle, état (neuf/occasion)

### 3. ARTISTES VISUELS

**Produits** :
- Tableaux, peintures
- Photographies imprimées
- Sculptures
- Artisanat
- Œuvres numérotées

**Fonctionnalités nécessaires** :
- ✅ **Informations artistiques** : Technique, dimensions, matériaux, support
- ✅ **Artiste** : Nom, biographie, photo, portfolio
- ✅ **Édition** : Original, reproduction, tirage limité, numéroté
- ✅ **Certificat d'authenticité** : Inclus, téléchargeable
- ✅ **Encadrement** : Option d'encadrement, type de cadre
- ✅ **Dimensions** : Largeur, hauteur, profondeur (pour sculptures)
- ✅ **Technique** : Huile, acrylique, aquarelle, photographie, sculpture, etc.
- ✅ **Support** : Toile, papier, bois, métal, etc.

### 4. ARTISANS / CRÉATEURS

**Produits** :
- Bijoux artisanaux
- Vêtements sur mesure
- Accessoires personnalisés
- Objets décoratifs

**Fonctionnalités nécessaires** :
- ✅ **Personnalisation** : Options de personnalisation (texte, couleur, taille)
- ✅ **Matériaux** : Matériaux utilisés, origine
- ✅ **Fait main** : Certification "fait main", temps de fabrication
- ✅ **Sur mesure** : Options de mesure personnalisées
- ✅ **Édition limitée** : Nombre d'exemplaires disponibles
- ✅ **Artisan** : Nom, biographie, photo, autres créations

---

## 🎯 FONCTIONNALITÉS AVANCÉES PROPOSÉES

### 1. Type d'Artiste (Sélection)

**Catégories** :
- Écrivain / Auteur
- Musicien / Artiste musical
- Artiste visuel (peintre, photographe, sculpteur)
- Artisan / Créateur
- Autre

### 2. Informations Artistiques (Communes)

**Champs** :
- Nom de l'artiste / Auteur
- Biographie de l'artiste
- Photo de l'artiste
- Portfolio / Galerie (liens)
- Réseaux sociaux (Instagram, Facebook, Twitter, etc.)
- Site web personnel
- Autres œuvres / Produits de l'artiste

### 3. Informations Spécifiques par Type

#### A. ÉCRIVAINS
- ISBN
- Nombre de pages
- Format (Broché, Relié, Poche, Grand format)
- Langue
- Date de publication
- Éditeur
- Collection
- Numéro d'édition
- Extrait (preview)
- Table des matières
- Option dédicace (personnalisable)
- Édition limitée (numérotée, signée)
- Certificat d'authenticité

#### B. MUSICIENS
- Genre musical
- Durée totale
- Nombre de pistes
- Année de sortie
- Format (CD, Vinyl, Cassette)
- Liste des pistes
- Extrait audio (preview)
- Paroles (optionnel)
- Édition spéciale (limitée, collector, autographiée)
- Merchandising associé

#### C. ARTISTES VISUELS
- Technique (Huile, Acrylique, Aquarelle, Photographie, Sculpture, etc.)
- Support (Toile, Papier, Bois, Métal, etc.)
- Dimensions (largeur, hauteur, profondeur)
- Matériaux utilisés
- Type d'œuvre (Original, Reproduction, Tirage limité)
- Numérotation (si édition limitée)
- Certificat d'authenticité
- Option encadrement
- Type de cadre (si encadré)

#### D. ARTISANS
- Matériaux utilisés
- Origine des matériaux
- Technique de fabrication
- Temps de fabrication
- Certification "fait main"
- Options de personnalisation
- Sur mesure (options)
- Édition limitée

### 4. Options Avancées

**Dédicace / Personnalisation** :
- Activer la dédicace
- Message par défaut
- Champs personnalisables (nom, message, date)
- Prévisualisation

**Édition Limitée / Numérotée** :
- Activer l'édition limitée
- Nombre total d'exemplaires
- Numérotation automatique
- Signature de l'artiste
- Certificat d'authenticité

**Certificat d'Authenticité** :
- Générer automatiquement
- Template personnalisable
- Téléchargeable après achat
- Inclus dans l'emballage

**Aperçu / Preview** :
- Extrait (livre, musique, etc.)
- Galerie d'images
- Vidéo de présentation
- Audio preview

---

## 🗄️ MODIFICATIONS BASE DE DONNÉES

### Nouvelle Table : `artist_products`

```sql
CREATE TABLE public.artist_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  physical_product_id UUID REFERENCES public.physical_products(id) ON DELETE CASCADE,
  
  -- === TYPE D'ARTISTE ===
  artist_type TEXT NOT NULL CHECK (artist_type IN (
    'writer',      -- Écrivain / Auteur
    'musician',    -- Musicien / Artiste musical
    'visual_artist', -- Artiste visuel
    'craftsman',   -- Artisan / Créateur
    'other'        -- Autre
  )),
  
  -- === INFORMATIONS ARTISTE (Communes) ===
  artist_name TEXT NOT NULL,
  artist_biography TEXT,
  artist_photo_url TEXT,
  artist_portfolio_urls JSONB DEFAULT '[]', -- Array of URLs
  artist_social_media JSONB DEFAULT '{}', -- {instagram, facebook, twitter, etc.}
  artist_website TEXT,
  artist_other_works JSONB DEFAULT '[]', -- Array of product IDs or links
  
  -- === INFORMATIONS SPÉCIFIQUES (JSONB pour flexibilité) ===
  specific_info JSONB DEFAULT '{}',
  -- Pour écrivains: {isbn, pages, format, language, publisher, etc.}
  -- Pour musiciens: {genre, duration, tracks, year, format, etc.}
  -- Pour artistes visuels: {technique, support, dimensions, materials, etc.}
  -- Pour artisans: {materials, origin, technique, handmade, etc.}
  
  -- === OPTIONS AVANCÉES ===
  -- Dédicace
  dedication_enabled BOOLEAN DEFAULT FALSE,
  dedication_default_message TEXT,
  dedication_customizable_fields JSONB DEFAULT '[]', -- ['name', 'message', 'date']
  
  -- Édition limitée
  limited_edition_enabled BOOLEAN DEFAULT FALSE,
  limited_edition_total INTEGER, -- Nombre total d'exemplaires
  limited_edition_numbered BOOLEAN DEFAULT FALSE,
  limited_edition_signed BOOLEAN DEFAULT FALSE,
  limited_edition_certificate BOOLEAN DEFAULT FALSE,
  
  -- Certificat d'authenticité
  authenticity_certificate_enabled BOOLEAN DEFAULT FALSE,
  authenticity_certificate_template TEXT, -- Template personnalisable
  authenticity_certificate_downloadable BOOLEAN DEFAULT TRUE,
  authenticity_certificate_included BOOLEAN DEFAULT TRUE,
  
  -- Preview / Aperçu
  preview_type TEXT CHECK (preview_type IN ('excerpt', 'gallery', 'video', 'audio', 'none')),
  preview_content TEXT, -- Extrait, URL vidéo, etc.
  preview_gallery JSONB DEFAULT '[]', -- Array of image URLs
  
  -- Encadrement (pour artistes visuels)
  framing_enabled BOOLEAN DEFAULT FALSE,
  framing_options JSONB DEFAULT '[]', -- [{type, price}, ...]
  framing_default TEXT,
  
  -- Personnalisation (pour artisans)
  customization_enabled BOOLEAN DEFAULT FALSE,
  customization_options JSONB DEFAULT '[]', -- [{field, type, required}, ...]
  
  -- Sur mesure
  made_to_order_enabled BOOLEAN DEFAULT FALSE,
  made_to_order_fields JSONB DEFAULT '[]', -- [{field, type, unit}, ...]
  made_to_order_lead_time_days INTEGER, -- Délai de fabrication
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_products_product_id ON public.artist_products(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_physical_product_id ON public.artist_products(physical_product_id);
CREATE INDEX IF NOT EXISTS idx_artist_products_artist_type ON public.artist_products(artist_type);
CREATE INDEX IF NOT EXISTS idx_artist_products_artist_name ON public.artist_products(artist_name);
```

### Table : `artist_product_dedications`

```sql
CREATE TABLE public.artist_product_dedications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Dédicace
  dedication_to_name TEXT NOT NULL, -- Nom de la personne à qui dédier
  dedication_message TEXT,
  dedication_date DATE,
  dedication_signature TEXT, -- Signature de l'artiste
  
  -- Statut
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_product_dedications_order_id ON public.artist_product_dedications(order_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_dedications_product_id ON public.artist_product_dedications(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_dedications_status ON public.artist_product_dedications(status);
```

### Table : `artist_product_certificates`

```sql
CREATE TABLE public.artist_product_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  artist_product_id UUID NOT NULL REFERENCES public.artist_products(id) ON DELETE CASCADE,
  
  -- Certificat
  certificate_number TEXT UNIQUE NOT NULL, -- Numéro unique du certificat
  certificate_type TEXT DEFAULT 'authenticity' CHECK (certificate_type IN ('authenticity', 'limited_edition', 'handmade')),
  
  -- Informations
  edition_number INTEGER, -- Si édition limitée
  total_edition INTEGER, -- Nombre total d'exemplaires
  signed_by_artist BOOLEAN DEFAULT FALSE,
  signed_date DATE,
  
  -- Fichier
  certificate_pdf_url TEXT, -- URL du PDF généré
  certificate_downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  
  -- === TIMESTAMPS ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_artist_product_certificates_order_id ON public.artist_product_certificates(order_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_certificates_product_id ON public.artist_product_certificates(product_id);
CREATE INDEX IF NOT EXISTS idx_artist_product_certificates_certificate_number ON public.artist_product_certificates(certificate_number);
```

---

## 🎨 COMPOSANTS UI À CRÉER

### 1. `ArtistTypeSelector.tsx`
- Sélection du type d'artiste
- Affichage conditionnel des champs selon le type

### 2. `ArtistInfoForm.tsx`
- Informations communes de l'artiste
- Biographie, photo, portfolio, réseaux sociaux

### 3. `WriterSpecificForm.tsx`
- Champs spécifiques pour écrivains
- ISBN, pages, format, éditeur, etc.

### 4. `MusicianSpecificForm.tsx`
- Champs spécifiques pour musiciens
- Genre, durée, pistes, format audio, etc.

### 5. `VisualArtistSpecificForm.tsx`
- Champs spécifiques pour artistes visuels
- Technique, support, dimensions, matériaux, etc.

### 6. `CraftsmanSpecificForm.tsx`
- Champs spécifiques pour artisans
- Matériaux, technique, personnalisation, etc.

### 7. `ArtistAdvancedOptions.tsx`
- Options de dédicace
- Édition limitée
- Certificat d'authenticité
- Preview / Aperçu

### 8. `DedicationForm.tsx`
- Formulaire de dédicace (côté client lors de la commande)
- Champs personnalisables

### 9. `CertificateGenerator.tsx`
- Génération de certificats d'authenticité
- Templates personnalisables
- Export PDF

---

## 🔄 INTÉGRATION DANS LE WIZARD

### Nouvelle Étape dans le Wizard

**Étape 1.5 ou 2.5** : "Informations Artiste" (conditionnelle)

- S'affiche uniquement si l'utilisateur sélectionne "Produit d'artiste"
- Contient tous les formulaires spécialisés selon le type d'artiste

**Ordre proposé** :
1. Informations de base
2. **Informations Artiste** (NOUVEAU - conditionnel)
3. Variantes & Options
4. Inventaire
5. Expédition
6. Guide des Tailles
7. Affiliation
8. SEO & FAQs
9. Options de Paiement
10. Aperçu & Validation

---

## 📝 TYPES TYPESCRIPT

```typescript
export type ArtistType = 'writer' | 'musician' | 'visual_artist' | 'craftsman' | 'other';

export interface ArtistInfo {
  name: string;
  biography?: string;
  photo_url?: string;
  portfolio_urls?: string[];
  social_media?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  };
  website?: string;
  other_works?: string[];
}

export interface WriterSpecificInfo {
  isbn?: string;
  pages?: number;
  format?: 'broche' | 'relié' | 'poche' | 'grand_format';
  language?: string;
  publication_date?: string;
  publisher?: string;
  collection?: string;
  edition_number?: number;
  excerpt?: string;
  table_of_contents?: string;
}

export interface MusicianSpecificInfo {
  genre?: string;
  duration?: number; // en minutes
  track_count?: number;
  release_year?: number;
  format?: 'cd' | 'vinyl' | 'cassette' | 'digital_physical';
  track_list?: Array<{ title: string; duration: number }>;
  audio_preview_url?: string;
  lyrics_url?: string;
}

export interface VisualArtistSpecificInfo {
  technique?: string;
  support?: string;
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
    unit: 'cm' | 'in';
  };
  materials?: string[];
  artwork_type?: 'original' | 'reproduction' | 'limited_print';
  edition_number?: number;
  total_edition?: number;
}

export interface CraftsmanSpecificInfo {
  materials?: string[];
  material_origin?: string;
  technique?: string;
  fabrication_time_days?: number;
  handmade_certified?: boolean;
  customization_options?: Array<{
    field: string;
    type: 'text' | 'color' | 'size' | 'number';
    required: boolean;
  }>;
  made_to_order?: boolean;
  made_to_order_fields?: Array<{
    field: string;
    type: 'text' | 'number';
    unit?: string;
  }>;
  lead_time_days?: number;
}

export interface ArtistProductFormData {
  // Type
  artist_type: ArtistType | null;
  
  // Informations artiste
  artist_info: ArtistInfo;
  
  // Informations spécifiques
  writer_info?: WriterSpecificInfo;
  musician_info?: MusicianSpecificInfo;
  visual_artist_info?: VisualArtistSpecificInfo;
  craftsman_info?: CraftsmanSpecificInfo;
  
  // Options avancées
  dedication?: {
    enabled: boolean;
    default_message?: string;
    customizable_fields?: string[];
  };
  limited_edition?: {
    enabled: boolean;
    total?: number;
    numbered: boolean;
    signed: boolean;
    certificate: boolean;
  };
  authenticity_certificate?: {
    enabled: boolean;
    template?: string;
    downloadable: boolean;
    included: boolean;
  };
  preview?: {
    type: 'excerpt' | 'gallery' | 'video' | 'audio' | 'none';
    content?: string;
    gallery?: string[];
  };
  framing?: {
    enabled: boolean;
    options?: Array<{ type: string; price: number }>;
    default?: string;
  };
}
```

---

## 🎯 PLAN D'IMPLÉMENTATION

### Phase 1 : Base de données
1. ✅ Créer la migration SQL pour `artist_products`
2. ✅ Créer la migration SQL pour `artist_product_dedications`
3. ✅ Créer la migration SQL pour `artist_product_certificates`

### Phase 2 : Types TypeScript
1. ✅ Créer `src/types/artist-product.ts`
2. ✅ Étendre `PhysicalProductFormData` avec les champs artistiques

### Phase 3 : Composants UI
1. ✅ Créer `ArtistTypeSelector.tsx`
2. ✅ Créer `ArtistInfoForm.tsx`
3. ✅ Créer les formulaires spécifiques par type
4. ✅ Créer `ArtistAdvancedOptions.tsx`

### Phase 4 : Intégration
1. ✅ Intégrer dans `CreatePhysicalProductWizard_v2.tsx`
2. ✅ Ajouter l'étape conditionnelle "Informations Artiste"
3. ✅ Mettre à jour la logique de sauvegarde

### Phase 5 : Fonctionnalités avancées
1. ✅ Créer `DedicationForm.tsx` (côté client)
2. ✅ Créer `CertificateGenerator.tsx`
3. ✅ Créer les templates de certificats

---

**Date** : 28 Janvier 2025  
**Statut** : 📋 **ANALYSE TERMINÉE** - Prêt pour implémentation

