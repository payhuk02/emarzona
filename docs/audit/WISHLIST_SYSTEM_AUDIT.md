# 🔍 Audit Complet du Système de Liste de Souhaits (Wishlist)

**Date**: 2025-01-28  
**Version**: 1.0  
**Statut**: ⚠️ **AUDIT EN COURS**

---

## 📋 Résumé Exécutif

Le système de wishlist (liste de souhaits) permet aux utilisateurs de sauvegarder leurs produits favoris. L'audit révèle **plusieurs incohérences critiques** entre les différentes implémentations et une **fragmentation du système**.

---

## ⚠️ PROBLÈMES CRITIQUES IDENTIFIÉS

### 🔴 PRIORITÉ 1 - TABLE INEXISTANTE UTILISÉE (ERREUR CRITIQUE)

**Problème**: **3 fichiers utilisent une table qui n'existe pas** (`wishlist_items`)

**Fichiers avec ERREURS**:

- `src/pages/physical/PhysicalProductDetail.tsx` (lignes 267, 281) - ❌ **CASSÉ**
- `src/pages/service/ServiceDetail.tsx` (lignes 261, 275) - ❌ **CASSÉ**
- `src/pages/artist/ArtistProductDetail.tsx` (lignes 206, 220) - ❌ **CASSÉ**

**Fichiers utilisant la BONNE table (`user_favorites`)**:

- `src/hooks/useMarketplaceFavorites.ts` (lignes 154, 173) - ✅
- `src/pages/customer/CustomerMyWishlist.tsx` (ligne 134) - ✅
- `src/hooks/wishlist/useWishlistShare.ts` (ligne 120) - ✅

**Vérification**:

- ❌ `wishlist_items` **N'EXISTE PAS** dans `src/integrations/supabase/types.ts`
- ❌ Aucune migration SQL trouvée pour créer cette table
- ❌ Les requêtes vers cette table **ÉCHOUENT à l'exécution**

**Impact CRITIQUE**:

- 🔴 **Les utilisateurs ne peuvent PAS ajouter des produits à la wishlist depuis les pages de détail**
- 🔴 **Erreurs runtime garanties**
- 🔴 **Fonctionnalité complètement cassée pour 3 types de produits**

**Recommandation URGENTE**:

- ✅ **Corriger IMMÉDIATEMENT les 3 fichiers pour utiliser `user_favorites`**
- ✅ **Supprimer les références à `product_type` (colonne inexistante)**
- ✅ **Tester après correction**

---

### 🔴 PRIORITÉ 1 - COLONNE `product_type` MANQUANTE

**Problème**: Les fichiers de détail produit tentent d'insérer `product_type` dans `wishlist_items`, mais cette colonne n'existe pas dans `user_favorites`.

**Code problématique**:

```typescript
// PhysicalProductDetail.tsx ligne 281
await supabase.from('wishlist_items').insert({
  user_id: user.id,
  product_id: productId,
  product_type: 'physical', // ❌ Cette colonne n'existe pas
});
```

**Impact**:

- ⚠️ Erreurs potentielles lors de l'insertion
- ⚠️ Perte d'information sur le type de produit

**Recommandation**:

- ✅ Le `product_type` peut être récupéré depuis la table `products` via `product_id`
- ✅ Ne pas stocker de données redondantes
- ✅ Utiliser une jointure si nécessaire

---

## ✅ ARCHITECTURE ACTUELLE

### 1. Tables de Base de Données

#### ✅ Table `user_favorites`

**Fichier**: `supabase/migrations/create_user_favorites_table.sql`

**Structure**:

```sql
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- Colonnes ajoutées par wishlist_enhancements.sql:
  price_when_added NUMERIC,
  price_drop_alert_enabled BOOLEAN DEFAULT true,
  price_drop_threshold NUMERIC DEFAULT 0,
  last_price_check TIMESTAMPTZ,
  price_drop_notified BOOLEAN DEFAULT false,
  CONSTRAINT unique_user_product_favorite UNIQUE (user_id, product_id)
);
```

**Statut**: ✅ **Bien structurée**

**Fonctionnalités**:

- ✅ Contrainte unique (un produit par utilisateur)
- ✅ RLS policies configurées
- ✅ Indexes pour performance
- ✅ Colonnes pour alertes prix
- ✅ Trigger pour `updated_at`

#### ❌ Table `wishlist_items` (N'EXISTE PAS)

**Statut**: ❌ **TABLE INEXISTANTE - ERREURS GARANTIES**

**Vérification**:

- ❌ Pas de migration SQL trouvée
- ❌ Pas présente dans `src/integrations/supabase/types.ts`
- ❌ Utilisée dans 3 fichiers de détail produit (ERREUR)
- ❌ Les requêtes vers cette table échoueront

**Impact Critique**:

- 🔴 **Les pages de détail produit ne peuvent pas ajouter à la wishlist**
- 🔴 **Erreurs runtime garanties**
- 🔴 **Fonctionnalité cassée pour produits physiques, services et artistes**

**Recommandation URGENTE**:

- ✅ **Corriger immédiatement les 3 fichiers pour utiliser `user_favorites`**
- ✅ **Supprimer les références à `product_type` (colonne inexistante)**

---

### 2. Tables de Fonctionnalités Avancées

#### ✅ Table `wishlist_shares`

**Fichier**: `supabase/migrations/20250127_wishlist_enhancements.sql`

**Structure**:

```sql
CREATE TABLE public.wishlist_shares (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Statut**: ✅ **Bien structurée**

**Fonctionnalités**:

- ✅ Partage de wishlist avec token unique
- ✅ Expiration configurable
- ✅ Compteur de vues
- ✅ RLS policies configurées

#### ✅ Table `price_drop_alerts`

**Fichier**: `supabase/migrations/20250127_wishlist_enhancements.sql`

**Structure**:

```sql
CREATE TABLE public.price_drop_alerts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  old_price NUMERIC NOT NULL,
  new_price NUMERIC NOT NULL,
  price_drop_percentage NUMERIC NOT NULL,
  alert_sent_at TIMESTAMPTZ DEFAULT now(),
  alert_sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  email_sent BOOLEAN DEFAULT false,
  UNIQUE(user_id, product_id, alert_sent_date)
);
```

**Statut**: ✅ **Bien structurée**

**Fonctionnalités**:

- ✅ Historique des alertes
- ✅ Prévention des doublons (1 alerte par jour)
- ✅ RLS policies configurées

---

### 3. Fonctions RPC

#### ✅ `generate_wishlist_share_token()`

**Statut**: ✅ **Fonctionnelle**

- Génère un token hexadécimal de 32 caractères

#### ✅ `create_wishlist_share(p_expires_in_days)`

**Statut**: ✅ **Fonctionnelle**

- Crée un lien de partage
- Désactive les anciens liens
- Retourne le token

#### ✅ `check_price_drops()`

**Statut**: ✅ **Fonctionnelle**

- Détecte les baisses de prix
- Respecte les seuils configurés
- Retourne les produits avec baisse

#### ✅ `update_favorite_price_when_added()`

**Statut**: ✅ **Fonctionnelle** (Trigger)

- Met à jour `price_when_added` automatiquement
- Met à jour `last_price_check`

#### ✅ `count_user_favorites(p_user_id)`

**Statut**: ✅ **Fonctionnelle**

- Compte les favoris d'un utilisateur

#### ✅ `is_product_favorited(p_user_id, p_product_id)`

**Statut**: ✅ **Fonctionnelle**

- Vérifie si un produit est favori

---

### 4. Hooks React

#### ✅ `useMarketplaceFavorites`

**Fichier**: `src/hooks/useMarketplaceFavorites.ts`

**Fonctionnalités**:

- ✅ Gestion des favoris (ajout/suppression)
- ✅ Synchronisation Supabase pour utilisateurs authentifiés
- ✅ Fallback localStorage pour visiteurs anonymes
- ✅ Migration automatique localStorage → Supabase
- ✅ Utilise `user_favorites` ✅

**Statut**: ✅ **Fonctionnel** (mais incomplet - voir problèmes)

#### ✅ `useWishlistShare`

**Fichier**: `src/hooks/wishlist/useWishlistShare.ts`

**Fonctionnalités**:

- ✅ `useCreateWishlistShare()` - Créer un lien
- ✅ `useWishlistShare()` - Récupérer le lien actif
- ✅ `useSharedWishlist(token)` - Récupérer une wishlist partagée
- ✅ `useDeactivateWishlistShare()` - Désactiver un lien

**Statut**: ✅ **Fonctionnel**

#### ✅ `useWishlistPriceAlerts`

**Fichier**: `src/hooks/wishlist/useWishlistPriceAlerts.ts`

**Fonctionnalités**:

- ✅ `usePriceDrops()` - Récupérer les baisses de prix
- ✅ `useUpdatePriceAlertSettings()` - Mettre à jour les paramètres
- ✅ `useMarkPriceAlertAsRead()` - Marquer comme lu

**Statut**: ✅ **Fonctionnel**

---

### 5. Pages et Composants

#### ✅ `CustomerMyWishlist.tsx`

**Fichier**: `src/pages/customer/CustomerMyWishlist.tsx`

**Fonctionnalités**:

- ✅ Affichage de tous les favoris
- ✅ Filtres par type de produit
- ✅ Recherche
- ✅ Statistiques
- ✅ Alertes prix
- ✅ Partage de wishlist
- ✅ Ajout au panier
- ✅ Utilise `user_favorites` ✅

**Statut**: ✅ **Fonctionnel**

#### ✅ `SharedWishlist.tsx`

**Fichier**: `src/pages/customer/SharedWishlist.tsx`

**Fonctionnalités**:

- ✅ Affichage d'une wishlist partagée
- ✅ Navigation vers les produits
- ✅ Utilise `useSharedWishlist()` ✅

**Statut**: ✅ **Fonctionnel**

#### ✅ `WishlistShareDialog.tsx`

**Fichier**: `src/components/wishlist/WishlistShareDialog.tsx`

**Fonctionnalités**:

- ✅ Création de lien de partage
- ✅ Copie du lien
- ✅ Désactivation du lien
- ✅ Affichage des statistiques

**Statut**: ✅ **Fonctionnel**

#### ❌ Pages de Détail Produit (PROBLÉMATIQUES)

**Fichiers**:

- `src/pages/physical/PhysicalProductDetail.tsx`
- `src/pages/service/ServiceDetail.tsx`
- `src/pages/artist/ArtistProductDetail.tsx`

**Problèmes**:

- ❌ Utilisent `wishlist_items` au lieu de `user_favorites`
- ❌ Tentent d'insérer `product_type` (colonne inexistante)
- ❌ Code dupliqué (3 implémentations similaires)

**Statut**: ⚠️ **NÉCESSITE CORRECTION**

---

## 📊 ANALYSE DES FONCTIONNALITÉS

### ✅ Fonctionnalités Implémentées

1. **Gestion Basique des Favoris**
   - ✅ Ajout/Suppression
   - ✅ Vérification si favori
   - ✅ Comptage des favoris
   - ⚠️ Incohérence entre tables

2. **Synchronisation Multi-Appareils**
   - ✅ Supabase pour utilisateurs authentifiés
   - ✅ localStorage pour visiteurs anonymes
   - ✅ Migration automatique

3. **Alertes Prix**
   - ✅ Détection automatique des baisses
   - ✅ Seuil configurable
   - ✅ Historique des alertes
   - ✅ Notification visuelle

4. **Partage de Wishlist**
   - ✅ Génération de lien unique
   - ✅ Expiration configurable
   - ✅ Compteur de vues
   - ✅ Désactivation

5. **Interface Utilisateur**
   - ✅ Page wishlist complète
   - ✅ Filtres et recherche
   - ✅ Statistiques
   - ✅ Badges d'alerte prix

### ❌ Fonctionnalités Manquantes ou Incomplètes

1. **Cohérence des Données**
   - ❌ Deux tables différentes utilisées
   - ❌ Données fragmentées

2. **Gestion des Types de Produits**
   - ❌ `product_type` stocké dans `wishlist_items` (inexistant)
   - ✅ Peut être récupéré depuis `products` (solution)

3. **Notifications Email**
   - ⚠️ Colonne `email_sent` dans `price_drop_alerts`
   - ⚠️ Pas d'implémentation trouvée

4. **Export de Wishlist**
   - ❌ Pas d'export CSV/PDF
   - ❌ Pas d'impression

5. **Wishlist Publique**
   - ⚠️ Partage existe mais pas de wishlist publique permanente

---

## 🔧 RECOMMANDATIONS DE CORRECTION

### 🔴 PRIORITÉ 1 - CORRECTION URGENTE (Table Inexistante)

**Action**: Remplacer toutes les références à `wishlist_items` (table inexistante) par `user_favorites`

**Fichiers à corriger IMMÉDIATEMENT**:

1. `src/pages/physical/PhysicalProductDetail.tsx` (lignes 267, 281)
2. `src/pages/service/ServiceDetail.tsx` (lignes 261, 275)
3. `src/pages/artist/ArtistProductDetail.tsx` (lignes 206, 220)

**Code à remplacer**:

```typescript
// ❌ AVANT (ERREUR - table n'existe pas)
if (isInWishlist) {
  const { error } = await supabase
    .from('wishlist_items') // ❌ TABLE INEXISTANTE
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);
} else {
  const { error } = await supabase.from('wishlist_items').insert({
    user_id: user.id,
    product_id: productId,
    product_type: 'physical', // ❌ COLONNE INEXISTANTE
  });
}

// ✅ APRÈS (CORRECTION)
// Option 1: Utiliser le hook unifié (RECOMMANDÉ)
const { toggleFavorite, isFavorite } = useMarketplaceFavorites();
const isInWishlist = isFavorite(productId);

const handleWishlistToggle = async () => {
  if (!user?.id) {
    toast({
      title: 'Authentification requise',
      description: 'Veuillez vous connecter pour ajouter à la wishlist',
      variant: 'destructive',
    });
    navigate('/auth');
    return;
  }
  await toggleFavorite(productId);
};

// Option 2: Utiliser directement user_favorites
if (isInWishlist) {
  const { error } = await supabase
    .from('user_favorites') // ✅ TABLE EXISTANTE
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);
} else {
  const { error } = await supabase.from('user_favorites').insert({
    user_id: user.id,
    product_id: productId,
    // product_type supprimé (récupéré depuis products si nécessaire)
  });
}
```

**Note**: La table `wishlist_items` n'existe pas, donc **aucune migration de données nécessaire**.

---

### 🟡 PRIORITÉ 2 - Créer un Hook Unifié

**Action**: Créer `useWishlistToggle` pour remplacer le code dupliqué

**Fichier**: `src/hooks/wishlist/useWishlistToggle.ts`

```typescript
export const useWishlistToggle = (productId: string) => {
  const { favorites, toggleFavorite } = useMarketplaceFavorites();
  const isInWishlist = favorites.has(productId);

  const toggle = async () => {
    await toggleFavorite(productId);
  };

  return { isInWishlist, toggle };
};
```

**Utilisation**:

```typescript
// Dans les pages de détail
const { isInWishlist, toggle } = useWishlistToggle(productId);
```

---

### ✅ PRIORITÉ 3 - Vérification Confirmée

**Action**: ✅ **VÉRIFIÉ - La table `wishlist_items` N'EXISTE PAS**

**Preuves**:

- ✅ Absente de `src/integrations/supabase/types.ts` (types générés)
- ✅ Aucune migration SQL trouvée
- ✅ Aucune référence dans les migrations existantes

**Conclusion**:

- ✅ **Aucune migration de données nécessaire**
- ✅ **Corriger uniquement les fichiers TypeScript**
- ✅ **Les erreurs sont garanties à l'exécution actuellement**

---

### 🟢 PRIORITÉ 4 - Améliorations Futures

1. **Notifications Email**
   - Implémenter l'envoi d'emails pour les alertes prix
   - Utiliser la colonne `email_sent`

2. **Export de Wishlist**
   - Export CSV
   - Export PDF
   - Impression

3. **Wishlist Publique**
   - Option pour rendre la wishlist publique
   - URL permanente

4. **Organisation**
   - Catégories personnalisées
   - Tags
   - Notes sur les produits

---

## 📈 STATISTIQUES

- **Fichiers analysés**: 15+
- **Tables de base de données**: 3
- **Fonctions RPC**: 6
- **Hooks React**: 3
- **Pages**: 3
- **Composants**: 1
- **Problèmes critiques**: 2
- **Problèmes mineurs**: 3

---

## ✅ CHECKLIST DE CORRECTION

### Priorité 1 (Critique - URGENT)

- [x] ✅ Vérifier l'existence de `wishlist_items` - **CONFIRMÉ: N'EXISTE PAS**
- [x] ✅ Migrer les données si nécessaire - **NON NÉCESSAIRE**
- [ ] 🔴 Corriger `PhysicalProductDetail.tsx` - **URGENT**
- [ ] 🔴 Corriger `ServiceDetail.tsx` - **URGENT**
- [ ] 🔴 Corriger `ArtistProductDetail.tsx` - **URGENT**
- [ ] Tester l'ajout depuis les pages de détail
- [ ] Tester l'affichage dans `CustomerMyWishlist`
- [ ] Vérifier que les produits ajoutés apparaissent dans la wishlist

### Priorité 2 (Important)

- [ ] Créer `useWishlistToggle` hook
- [ ] Refactoriser les pages de détail
- [ ] Ajouter tests unitaires

### Priorité 3 (Amélioration)

- [ ] Implémenter notifications email
- [ ] Ajouter export CSV/PDF
- [ ] Ajouter wishlist publique

---

## 🎯 CONCLUSION

Le système de wishlist est **globalement bien conçu** avec des fonctionnalités avancées (alertes prix, partage). Cependant, il souffre d'une **fragmentation critique** due à l'utilisation de deux tables différentes.

**Actions immédiates requises**:

1. Unifier sur `user_favorites`
2. Corriger les 3 pages de détail produit
3. Vérifier et migrer les données si nécessaire

Une fois ces corrections effectuées, le système sera **robuste et cohérent**.

---

**Statut Final**: 🔴 **SYSTÈME PARTIELLEMENT CASSÉ - CORRECTIONS URGENTES REQUISES**

## 🚨 ALERTE CRITIQUE

**3 fichiers utilisent une table inexistante (`wishlist_items`)**. Les fonctionnalités de wishlist sont **cassées** pour :

- Produits physiques
- Services
- Produits artistes

**Action immédiate requise**: Corriger les 3 fichiers pour utiliser `user_favorites`.
