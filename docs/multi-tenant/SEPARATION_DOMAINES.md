# 🌐 SÉPARATION DES DOMAINES - PLATEFORME VS BOUTIQUES

**Date** : 1 Février 2025  
**Version** : 1.0

---

## 🎯 PRINCIPE

Séparation claire entre deux domaines distincts :

### 1. `emarzona.com` - Plateforme Principale

**Usage** : Application principale de la plateforme

**Pages accessibles** :

- `/` - Landing page
- `/auth` - Authentification
- `/marketplace` - Marketplace public
- `/dashboard` - Tableau de bord vendeur
- `/admin/*` - Pages d'administration
- `/account/*` - Portail client
- Toutes les autres pages de la plateforme

**Caractéristiques** :

- ✅ Pas de sous-domaines
- ✅ Application React SPA complète
- ✅ Gestion des utilisateurs, produits, commandes
- ✅ Dashboard et administration

### 2. `myemarzona.shop` - Boutiques Utilisateurs

**Usage** : Boutiques individuelles des vendeurs

**Format** : `https://nomboutique.myemarzona.shop`

**Pages accessibles** :

- `/` - Page d'accueil de la boutique
- `/products/:slug` - Détail d'un produit
- `/about` - À propos de la boutique
- `/contact` - Contact
- Toutes les pages publiques de la boutique

**Caractéristiques** :

- ✅ Sous-domaines dynamiques (`*.myemarzona.shop`)
- ✅ Chaque boutique a son propre sous-domaine
- ✅ Génération automatique lors de la création
- ✅ Isolation complète des données

---

## 🔄 FLUX DE CRÉATION D'UNE BOUTIQUE

### Étape 1 : Création de la Boutique

Lorsqu'un vendeur crée sa boutique depuis `emarzona.com/dashboard` :

```typescript
// Dans useStore.ts ou StoreForm.tsx
const { data, error } = await supabase.from('stores').insert({
  user_id: user.id,
  name: 'Ma Boutique',
  slug: 'ma-boutique', // Généré depuis le nom
  description: '...',
  // subdomain sera généré automatiquement par le trigger SQL
});
```

### Étape 2 : Génération Automatique du Sous-domaine

Le trigger SQL `auto_generate_subdomain()` s'exécute automatiquement :

```sql
-- Trigger s'exécute avant INSERT
-- Génère le subdomain depuis le slug
subdomain = generate_subdomain_from_slug('ma-boutique')
-- Résultat: subdomain = 'ma-boutique'
```

### Étape 3 : URL de la Boutique

La boutique est maintenant accessible via :

```
https://ma-boutique.myemarzona.shop
```

---

## 🏗️ ARCHITECTURE TECHNIQUE

### Détection du Domaine

Le système détecte automatiquement sur quel domaine on se trouve :

```typescript
const subdomainInfo = detectSubdomain();

// Sur emarzona.com
{
  subdomain: null,
  baseDomain: 'emarzona.com',
  isSubdomain: false,
  isStoreDomain: false,
  isPlatformDomain: true
}

// Sur ma-boutique.myemarzona.shop
{
  subdomain: 'ma-boutique',
  baseDomain: 'myemarzona.shop',
  isSubdomain: true,
  isStoreDomain: true,
  isPlatformDomain: false
}
```

### Middleware Multi-Tenant

Le `SubdomainMiddleware` ne s'active **QUE** sur `myemarzona.shop` :

```typescript
// Dans SubdomainMiddleware.tsx
if (subdomainInfo.isStoreDomain && subdomainInfo.isSubdomain) {
  // Charger la boutique correspondante
  const { data: store } = useCurrentStoreBySubdomain();
}
```

### Edge Function

L'Edge Function `store-by-domain` ne traite **QUE** les requêtes sur `myemarzona.shop` :

```typescript
// Dans store-by-domain/index.ts
const subdomain = extractSubdomain(host);
// Retourne null si on est sur emarzona.com
```

---

## 🔒 SÉCURITÉ

### Isolation des Domaines

- ✅ `emarzona.com` : Pas de traitement multi-tenant
- ✅ `myemarzona.shop` : Traitement multi-tenant uniquement
- ✅ Validation stricte du domaine dans chaque composant

### Validation

- ✅ Le middleware vérifie `isStoreDomain` avant de charger une boutique
- ✅ L'Edge Function ignore les requêtes sur `emarzona.com`
- ✅ Le détecteur de sous-domaine distingue clairement les deux domaines

---

## 📝 EXEMPLES D'UTILISATION

### Créer une Boutique

```typescript
// Depuis emarzona.com/dashboard
const createStore = async (name: string) => {
  const { data } = await supabase.from('stores').insert({
    name: 'Ma Super Boutique',
    slug: 'ma-super-boutique', // Généré automatiquement
    // subdomain sera 'ma-super-boutique' (généré par trigger)
  });

  // La boutique est maintenant accessible via:
  // https://ma-super-boutique.myemarzona.shop
};
```

### Accéder à une Boutique

```typescript
// Depuis ma-boutique.myemarzona.shop
const { data: store } = useCurrentStoreBySubdomain();
// store contient les données de la boutique 'ma-boutique'
```

### Vérifier le Domaine Actuel

```typescript
const subdomainInfo = detectSubdomain();

if (subdomainInfo.isPlatformDomain) {
  // On est sur emarzona.com
  // Afficher l'application principale
}

if (subdomainInfo.isStoreDomain) {
  // On est sur myemarzona.shop
  // Charger la boutique correspondante
}
```

---

## 🚀 CONFIGURATION CLOUDFLARE

### DNS Records

**Pour emarzona.com** :

- Type: A
- Name: @
- Content: IP de Vercel
- Proxy: 🟠 Activé

**Pour myemarzona.shop** :

- Type: A
- Name: \*
- Content: IP de Vercel
- Proxy: 🟠 Activé (wildcard pour tous les sous-domaines)

### SSL/TLS

- ✅ Certificat SSL wildcard pour `*.myemarzona.shop`
- ✅ Certificat SSL standard pour `emarzona.com`
- ✅ Mode: Full (strict)

---

## ✅ AVANTAGES DE CETTE SÉPARATION

1. **Clarté** : Distinction nette entre plateforme et boutiques
2. **Sécurité** : Isolation des domaines
3. **Performance** : Pas de traitement inutile sur la plateforme
4. **Scalabilité** : Facile d'ajouter d'autres domaines
5. **SEO** : Chaque boutique a son propre domaine

---

**Dernière mise à jour** : 1 Février 2025
