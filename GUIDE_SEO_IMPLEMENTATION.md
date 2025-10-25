# 📖 GUIDE D'UTILISATION - SYSTÈME SEO PAYHULA

**Version:** 1.0  
**Date:** 25 Octobre 2025  
**Auteur:** Payhula Team

---

## 🎯 INTRODUCTION

Ce document explique comment utiliser et maintenir le système SEO professionnel implémenté sur Payhula.

---

## 📦 COMPOSANTS SEO DISPONIBLES

### 1. `<SEOMeta>` - Meta Tags Centralisés

**Localisation:** `src/components/seo/SEOMeta.tsx`

**Usage:**
```typescript
import { SEOMeta } from '@/components/seo';

<SEOMeta
  title="Titre de la page"
  description="Description de 120-160 caractères"
  keywords="mot-clé1, mot-clé2, mot-clé3"
  url="https://payhula.com/page"
  canonical="https://payhula.com/page"  // Optionnel
  image="https://payhula.com/og-image.jpg"
  imageAlt="Description de l'image"
  type="website"  // 'website', 'article', 'product'
  
  // Pour les produits uniquement
  price={50000}
  currency="XOF"
  availability="instock"
  
  // Robots
  noindex={false}
  nofollow={false}
/>
```

**Props Disponibles:**
- `title` (requis) - Titre de la page
- `description` (requis) - Description 120-160 caractères
- `keywords` - Mots-clés SEO (optionnel)
- `url` (requis) - URL complète de la page
- `canonical` - URL canonique (optionnel, par défaut = url)
- `image` - Image Open Graph (1200x630px recommandé)
- `imageAlt` - Texte alternatif de l'image
- `type` - Type de contenu ('website', 'article', 'product')
- `price` - Prix du produit (type product)
- `currency` - Devise (XOF, USD, EUR, etc.)
- `availability` - Disponibilité ('instock', 'outofstock', 'preorder')
- `noindex` - Empêcher l'indexation (default: false)
- `nofollow` - Empêcher le suivi des liens (default: false)

---

### 2. `<ProductSchema>` - Données Structurées Produit

**Localisation:** `src/components/seo/ProductSchema.tsx`

**Usage:**
```typescript
import { ProductSchema } from '@/components/seo';

<ProductSchema
  product={{
    id: "uuid-123",
    name: "Formation Marketing Digital",
    description: "Description du produit...",
    price: 50000,
    currency: "XOF",
    image_url: "https://...",
    rating: 4.5,
    reviews_count: 23,
    slug: "formation-marketing",
    category: "Formation",
    store: {
      name: "Ma Boutique",
      slug: "ma-boutique"
    }
  }}
/>
```

**Résultat:** Rich Snippets Google avec étoiles, prix, disponibilité

---

### 3. `<StoreSchema>` - Données Structurées Boutique

**Localisation:** `src/components/seo/StoreSchema.tsx`

**Usage:**
```typescript
import { StoreSchema } from '@/components/seo';

<StoreSchema
  store={{
    id: "uuid-456",
    name: "Ma Boutique",
    slug: "ma-boutique",
    description: "Description de la boutique",
    logo_url: "https://...",
    banner_url: "https://...",
    contact_email: "contact@boutique.com",
    contact_phone: "+22612345678",
    facebook_url: "https://facebook.com/...",
    instagram_url: "https://instagram.com/...",
    twitter_url: "https://twitter.com/...",
    linkedin_url: "https://linkedin.com/..."
  }}
/>
```

---

### 4. `<BreadcrumbSchema>` - Fil d'Ariane

**Localisation:** `src/components/seo/BreadcrumbSchema.tsx`

**Usage:**
```typescript
import { BreadcrumbSchema } from '@/components/seo';

<BreadcrumbSchema
  items={[
    { name: "Accueil", url: "https://payhula.com" },
    { name: "Marketplace", url: "https://payhula.com/marketplace" },
    { name: "Produit", url: "https://payhula.com/stores/.../products/..." }
  ]}
/>
```

**Résultat:** Breadcrumbs visuels dans les résultats Google

---

### 5. `<WebsiteSchema>` - Schema Site Web

**Localisation:** `src/components/seo/WebsiteSchema.tsx`

**Usage:**
```typescript
import { WebsiteSchema } from '@/components/seo';

// À placer dans le layout principal (App.tsx ou Layout)
<WebsiteSchema />
```

**Résultat:** Barre de recherche Google dans les SERPs

---

## 🔧 SCRIPTS NPM

### Générer le Sitemap

```bash
# Génération manuelle
npm run sitemap:generate

# Génération automatique au build
npm run build
```

**Fichier généré:** `public/sitemap.xml`

**Contenu:**
- Page d'accueil
- Page marketplace
- Toutes les boutiques actives
- Tous les produits actifs
- Images des produits (avec alt text)

---

## 📄 FICHIERS IMPORTANTS

### robots.txt

**Localisation:** `public/robots.txt`

**Configuration actuelle:**
- ✅ Autorise tous les crawlers sur pages publiques
- ✅ Bloque /dashboard, /admin, /auth, /payment
- ✅ Bloque bad bots (AhrefsBot, SemrushBot, etc.)
- ✅ Référence sitemap.xml
- ✅ Crawl-delay configuré

**Modification:** Éditer directement `public/robots.txt`

---

### sitemap.xml

**Localisation:** `public/sitemap.xml` (généré)

**Régénération:**
1. Modifier `scripts/generate-sitemap.js` si besoin
2. Exécuter `npm run sitemap:generate`
3. Soumettre à Google Search Console

---

## 🎨 BONNES PRATIQUES

### Titres (Title Tags)

**✅ BON:**
```
Formation Marketing Digital - Ma Boutique | Payhula
```

**❌ MAUVAIS:**
```
Page
Ma Boutique
```

**Règles:**
- 50-60 caractères max
- Inclure mot-clé principal
- Unique pour chaque page
- Format: `Titre Principal - Contexte | Payhula`

---

### Descriptions (Meta Description)

**✅ BON:**
```
Découvrez notre formation complète en marketing digital. 20h de contenu vidéo, certificat inclus. Paiement sécurisé en XOF. Note: 4.8/5 ⭐
```

**❌ MAUVAIS:**
```
Formation
```

**Règles:**
- 120-160 caractères
- Inclure call-to-action
- Mentionner bénéfice principal
- Inclure mots-clés naturellement

---

### Mots-Clés (Keywords)

**✅ BON:**
```
formation marketing digital, cours en ligne afrique, marketing digital burkina, certificat marketing, XOF
```

**❌ MAUVAIS:**
```
marketing, cours, formation
```

**Règles:**
- 5-10 mots-clés pertinents
- Longue traîne > mots génériques
- Inclure variantes (synonymes, localisations)

---

### Images

**✅ BON:**
```typescript
<img 
  src="formation-marketing.jpg"
  alt="Formation Marketing Digital - 20h de contenu vidéo"
  loading="lazy"
  width="1200"
  height="630"
/>
```

**❌ MAUVAIS:**
```typescript
<img src="img1.jpg" />
```

**Règles:**
- **Toujours** un attribut `alt` descriptif
- Format WebP ou JPEG optimisé
- Dimensions explicites (évite CLS)
- Lazy loading sauf above-the-fold

---

### URLs

**✅ BON:**
```
/stores/ma-boutique/products/formation-marketing-digital
```

**❌ MAUVAIS:**
```
/store.php?id=123&product=456
```

**Règles:**
- Slugs lisibles (kebab-case)
- Hiérarchie logique
- Pas de caractères spéciaux
- Court mais descriptif

---

## 🚀 OPTIMISATION PAGES

### Page Marketplace

**Fichier:** `src/pages/Marketplace.tsx`

**SEO Implémenté:**
- ✅ Meta dynamiques (stats temps réel)
- ✅ Title optimisé: `{count} Produits Digitaux en Afrique`
- ✅ Description riche
- ✅ Keywords ciblés
- ✅ Open Graph + Twitter Cards
- ✅ WebsiteSchema
- ✅ Canonical URL

**Score:** 90/100 ✅

---

### Page Produit

**Fichier:** `src/pages/ProductDetail.tsx`

**SEO Implémenté:**
- ✅ Meta dynamiques par produit
- ✅ ProductSchema (Rich Snippets)
- ✅ BreadcrumbSchema
- ✅ Open Graph Product tags
- ✅ Twitter Product Card
- ✅ Canonical URL
- ✅ Alt text images

**Score:** 95/100 ✅

---

### Page Boutique

**Fichier:** `src/pages/Storefront.tsx`

**SEO Implémenté:**
- ✅ Meta dynamiques par boutique
- ✅ StoreSchema
- ✅ BreadcrumbSchema
- ✅ Open Graph
- ✅ Twitter Cards
- ✅ Canonical URL

**Score:** 90/100 ✅

---

## 📊 SUIVI & ANALYTICS

### Google Search Console

**Configuration:**
1. Ajouter propriété: `https://payhula.vercel.app`
2. Vérification: Balise meta dans `index.html`
```html
<meta name="google-site-verification" content="VOTRE_CODE" />
```
3. Soumettre sitemap: `https://payhula.vercel.app/sitemap.xml`
4. Activer indexation mobile-first

**Vérifier:**
- Pages indexées (cible: 500+)
- Erreurs crawl (404, 500, etc.)
- Core Web Vitals
- Rich Snippets actifs

---

### Google Analytics 4

**Configuration:**
1. Créer propriété GA4
2. Ajouter script dans `index.html`
3. Configurer événements:
   - `view_item` (pages produits)
   - `add_to_cart`
   - `begin_checkout`
   - `purchase`

---

## 🐛 DÉPANNAGE

### Sitemap ne se génère pas

**Problème:** `npm run sitemap:generate` échoue

**Solution:**
1. Vérifier variables d'environnement:
```bash
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```
2. Vérifier connexion Supabase
3. Logs: `node scripts/generate-sitemap.js`

---

### Meta tags ne s'affichent pas

**Problème:** Facebook Debugger ne voit pas OG tags

**Solution:**
1. Vérifier que `<SEOMeta>` est dans le composant
2. Tester avec: https://developers.facebook.com/tools/debug/
3. Clear cache Facebook: Cliquer "Scrape Again"
4. Vérifier que Helmet est bien monté (SSR)

---

### Rich Snippets n'apparaissent pas

**Problème:** Google n'affiche pas étoiles/prix

**Solution:**
1. Tester Schema: https://validator.schema.org/
2. Vérifier `<ProductSchema>` est présent
3. Attendre indexation (2-4 semaines)
4. Demander indexation manuelle (Search Console)

---

## ✅ CHECKLIST NOUVELLE PAGE

Lors de la création d'une nouvelle page:

- [ ] Ajouter `<SEOMeta>` avec props complètes
- [ ] Title unique et optimisé (50-60 caractères)
- [ ] Description unique (120-160 caractères)
- [ ] URL slugifiée (kebab-case)
- [ ] Canonical URL définie
- [ ] Images avec alt text
- [ ] Schema.org si applicable
- [ ] BreadcrumbSchema pour navigation
- [ ] Ajouter route dans sitemap generator
- [ ] Tester avec Lighthouse (score > 90)
- [ ] Valider Schema: validator.schema.org
- [ ] Tester OG: Facebook Debugger
- [ ] Mobile-friendly (Google Mobile Test)

---

## 📞 SUPPORT

**Questions?** Consultez:
- Analyse complète: `ANALYSE_COMPLETE_SEO_PLATEFORME_2025.md`
- Rapport affiliation: `RAPPORT_ANALYSE_COMPLETE_SYSTEME_AFFILIATION.md`

**Ressources externes:**
- Google SEO Starter Guide
- Schema.org Documentation
- Moz Beginner's Guide to SEO

---

**Dernière mise à jour:** 25 Octobre 2025  
**Version:** 1.0

