# 🚨 PLAN D'ACTION CRITIQUE - PRIORITÉ P0
## Corrections de Sécurité et Tests Minimaux

**Date de création** : 27 Janvier 2025  
**Priorité** : CRITIQUE (P0)  
**Délai estimé** : 1-2 semaines  
**Impact** : Blocage production si non résolu

---

## 📋 TABLE DES MATIÈRES

1. [Vulnérabilité Critique : Clés Supabase Exposées](#1-vulnérabilité-critique--clés-supabase-exposées)
2. [Tests Minimaux Requis](#2-tests-minimaux-requis)
3. [Checklist de Validation](#3-checklist-de-validation)
4. [Calendrier d'Exécution](#4-calendrier-dexécution)

---

## 1. 🔴 VULNÉRABILITÉ CRITIQUE : CLÉS SUPABASE EXPOSÉES

### 1.1 Contexte

**Problème** : Les clés Supabase ont été exposées publiquement dans l'historique Git (détecté dans `PRODUCTINFOTAB_IMPROVEMENTS_REPORT.md`).

**Impact** :
- 🔴 Accès non autorisé à la base de données
- 🔴 Vol de données utilisateurs
- 🔴 Manipulation des données
- 🔴 Coûts Supabase incontrôlés
- 🔴 Violation RGPD/Conformité

**Statut actuel** :
- ✅ Fichier `.env` retiré du Git
- ✅ `.env` ajouté au `.gitignore`
- 🔴 Clés toujours dans l'historique Git
- 🔴 Clés non régénérées
- 🔴 Audit logs non vérifiés

### 1.2 Actions Immédiates (URGENT - Aujourd'hui)

#### Étape 1.1 : Régénérer les Clés Supabase

**Temps estimé** : 30 minutes

1. **Se connecter à Supabase Dashboard**
   - URL : https://app.supabase.com
   - Aller dans Settings → API

2. **Régénérer les clés suivantes** :
   - `SUPABASE_URL` (project URL)
   - `SUPABASE_ANON_KEY` (anon/public key)
   - `SUPABASE_SERVICE_ROLE_KEY` (service_role key) ⚠️ CRITIQUE
   - `SUPABASE_JWT_SECRET` (JWT Secret)

3. **Mettre à jour les variables d'environnement** :
   ```bash
   # Local
   cp .env .env.backup
   # Mettre à jour .env avec les nouvelles clés
   
   # Vercel
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add SUPABASE_JWT_SECRET
   ```

4. **Vérifier les variables** :
   ```bash
   # Vérifier que les nouvelles clés fonctionnent
   npm run dev
   # Tester une connexion à Supabase
   ```

**✅ Validation** :
- [ ] Toutes les clés régénérées
- [ ] Variables mises à jour (local + Vercel)
- [ ] Application fonctionne avec nouvelles clés
- [ ] Anciennes clés désactivées dans Supabase

#### Étape 1.2 : Auditer les Logs d'Accès Supabase

**Temps estimé** : 1 heure

1. **Vérifier les logs d'accès** :
   - Supabase Dashboard → Logs → Postgres Logs
   - Vérifier les connexions suspectes
   - Vérifier les requêtes inhabituelles
   - Vérifier les heures d'accès anormales

2. **Vérifier les utilisateurs** :
   ```sql
   -- Vérifier les utilisateurs récents
   SELECT 
     id, 
     email, 
     created_at, 
     last_sign_in_at,
     raw_user_meta_data
   FROM auth.users
   WHERE created_at > NOW() - INTERVAL '30 days'
   ORDER BY created_at DESC;
   
   -- Vérifier les stores créés récemment
   SELECT 
     id, 
     name, 
     user_id, 
     created_at
   FROM stores
   WHERE created_at > NOW() - INTERVAL '30 days'
   ORDER BY created_at DESC;
   ```

3. **Vérifier les actions suspectes** :
   ```sql
   -- Vérifier les actions admin récentes
   SELECT 
     id, 
     user_id, 
     action_type, 
     resource_type,
     created_at
   FROM admin_actions
   WHERE created_at > NOW() - INTERVAL '30 days'
   ORDER BY created_at DESC
   LIMIT 100;
   ```

**✅ Validation** :
- [ ] Logs d'accès vérifiés
- [ ] Aucune activité suspecte détectée
- [ ] Utilisateurs suspects identifiés (si applicable)
- [ ] Actions correctives prises (si nécessaire)

#### Étape 1.3 : Activer 2FA sur Compte Supabase

**Temps estimé** : 15 minutes

1. **Activer 2FA** :
   - Supabase Dashboard → Account Settings → Security
   - Activer Two-Factor Authentication
   - Utiliser une application d'authentification (Google Authenticator, Authy)

2. **Vérifier les accès** :
   - Vérifier les membres de l'équipe
   - Révoquer les accès non nécessaires
   - Vérifier les permissions

**✅ Validation** :
- [ ] 2FA activé sur compte Supabase
- [ ] Accès équipe vérifiés
- [ ] Permissions revues

#### Étape 1.4 : Nettoyer l'Historique Git

**Temps estimé** : 2 heures

**⚠️ ATTENTION** : Cette opération modifie l'historique Git. À faire avec précaution.

1. **Installer BFG Repo Cleaner** :
   ```bash
   # Windows (avec Chocolatey)
   choco install bfg
   
   # Ou télécharger depuis : https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Créer un backup du dépôt** :
   ```bash
   # Cloner le dépôt dans un nouveau dossier
   git clone --mirror https://github.com/payhuk02/payhula.git payhula-backup.git
   ```

3. **Nettoyer les clés de l'historique** :
   ```bash
   # Créer un fichier avec les clés à supprimer
   # passwords.txt contient les clés à supprimer (une par ligne)
   
   # Exécuter BFG
   bfg --replace-text passwords.txt payhula-backup.git
   
   # Nettoyer les références
   cd payhula-backup.git
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

4. **Forcer la mise à jour du dépôt distant** :
   ```bash
   # ⚠️ DANGER : Cette commande réécrit l'historique
   git push --force --all
   git push --force --tags
   ```

5. **Alternative plus sûre : Utiliser git-filter-repo** :
   ```bash
   # Installer git-filter-repo
   pip install git-filter-repo
   
   # Créer un fichier .env avec les anciennes clés (pour référence)
   # Puis supprimer
   git filter-repo --path .env --invert-paths
   
   # Forcer push (si nécessaire)
   git push --force --all
   ```

**✅ Validation** :
- [ ] Historique Git nettoyé
- [ ] Clés non visibles dans l'historique
- [ ] Dépôt distant mis à jour
- [ ] Collaborateurs notifiés du changement

#### Étape 1.5 : Vérifier les Fichiers Sensibles

**Temps estimé** : 30 minutes

1. **Vérifier .gitignore** :
   ```bash
   # Vérifier que .env est bien ignoré
   cat .gitignore | grep -E "\.env|\.env\..*"
   
   # Vérifier les autres fichiers sensibles
   cat .gitignore
   ```

2. **Vérifier les fichiers commités** :
   ```bash
   # Vérifier si .env est tracké
   git ls-files | grep -E "\.env"
   
   # Si oui, le retirer
   git rm --cached .env
   git commit -m "Remove .env from tracking"
   ```

3. **Créer .env.example** :
   ```bash
   # Créer un fichier .env.example avec les variables sans valeurs
   cat > .env.example << EOF
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Autres variables
   # ...
   EOF
   
   git add .env.example
   git commit -m "Add .env.example template"
   ```

**✅ Validation** :
- [ ] `.env` dans `.gitignore`
- [ ] `.env` non tracké dans Git
- [ ] `.env.example` créé et commité
- [ ] Autres fichiers sensibles vérifiés

### 1.3 Checklist Complète de Sécurité

**✅ Actions Complétées** :
- [ ] Clés Supabase régénérées
- [ ] Variables mises à jour (local + Vercel)
- [ ] Logs d'accès audités
- [ ] Activité suspecte vérifiée
- [ ] 2FA activé sur compte Supabase
- [ ] Historique Git nettoyé
- [ ] `.env` vérifié et ignoré
- [ ] `.env.example` créé
- [ ] Collaborateurs notifiés
- [ ] Documentation mise à jour

---

## 2. 🧪 TESTS MINIMAUX REQUIS

### 2.1 Objectif

**Couverture minimale** : 50% des fichiers critiques  
**Délai** : 1 semaine  
**Priorité** : Tests des hooks et utilitaires critiques

### 2.2 Tests à Implémenter

#### 2.2.1 Hooks Critiques (Priorité 1)

**Temps estimé** : 20 heures

**Hooks à tester** :

1. **`useCart`** (src/hooks/cart/useCart.ts)
   - Tests : addItem, updateItem, removeItem, clearCart
   - Temps : 4h

2. **`useCreateOrder`** (src/hooks/orders/useCreateOrder.ts)
   - Tests : création commande, gestion erreurs
   - Temps : 3h

3. **`useCreateServiceOrder`** (src/hooks/orders/useCreateServiceOrder.ts)
   - Tests : création réservation, validation
   - Temps : 3h

4. **`usePayments`** (src/hooks/usePayments.ts)
   - Tests : récupération paiements, filtres
   - Temps : 2h

5. **`useProducts`** (src/hooks/useProducts.ts)
   - Tests : récupération produits, filtres
   - Temps : 2h

6. **`useStore`** (src/hooks/useStore.ts)
   - Tests : récupération store, validation
   - Temps : 2h

7. **`useAuth`** (via AuthContext)
   - Tests : authentification, session
   - Temps : 2h

8. **`useCart` - Coupons** (src/hooks/cart/useCart.ts)
   - Tests : application coupon, validation
   - Temps : 2h

**Structure de test** :
```typescript
// src/hooks/__tests__/useCart.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCart } from '../cart/useCart';

describe('useCart', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('should add item to cart', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    await waitFor(() => {
      expect(result.current.items).toBeDefined();
    });

    // Test addItem
    await result.current.addItem({
      product_id: 'test-product',
      product_type: 'physical',
      quantity: 1,
    });

    await waitFor(() => {
      expect(result.current.items.length).toBeGreaterThan(0);
    });
  });
});
```

#### 2.2.2 Utilitaires Critiques (Priorité 2)

**Temps estimé** : 10 heures

**Utilitaires à tester** :

1. **`html-sanitizer`** (src/lib/html-sanitizer.ts)
   - Tests : sanitization XSS, tags autorisés
   - Temps : 2h

2. **`validation-utils`** (src/lib/validation-utils.ts)
   - Tests : validation email, URL, slug, téléphone
   - Temps : 3h

3. **`schemas`** (src/lib/schemas.ts)
   - Tests : validation Zod, erreurs
   - Temps : 2h

4. **`logger`** (src/lib/logger.ts)
   - Tests : niveaux de log, intégration Sentry
   - Temps : 2h

5. **`uploadToSupabase`** (src/utils/uploadToSupabase.ts)
   - Tests : upload fichier, validation, erreurs
   - Temps : 1h

**Structure de test** :
```typescript
// src/lib/__tests__/html-sanitizer.test.ts
import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../html-sanitizer';

describe('sanitizeHTML', () => {
  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitizeHTML(input, 'productDescription');
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Hello</p>');
  });

  it('should allow safe tags', () => {
    const input = '<p>Hello <strong>World</strong></p>';
    const output = sanitizeHTML(input, 'productDescription');
    expect(output).toContain('<p>');
    expect(output).toContain('<strong>');
  });
});
```

#### 2.2.3 Composants Critiques (Priorité 3)

**Temps estimé** : 10 heures

**Composants à tester** :

1. **`ProtectedRoute`** (src/components/ProtectedRoute.tsx)
   - Tests : redirection si non authentifié
   - Temps : 2h

2. **`AdminRoute`** (src/components/AdminRoute.tsx)
   - Tests : redirection si non admin
   - Temps : 2h

3. **`CreatePaymentDialog`** (src/components/payments/CreatePaymentDialog.tsx)
   - Tests : création paiement, validation formulaire
   - Temps : 3h

4. **`ReturnRequestForm`** (src/components/physical/returns/ReturnRequestForm.tsx)
   - Tests : upload photos, validation
   - Temps : 3h

### 2.3 Configuration CI/CD

**Temps estimé** : 5 heures

1. **Créer GitHub Actions Workflow** :
   ```yaml
   # .github/workflows/tests.yml
   name: Tests
   
   on:
     push:
       branches: [main, develop]
     pull_request:
       branches: [main, develop]
   
   jobs:
     test:
       runs-on: ubuntu-latest
       
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm run test:unit
         - run: npm run lint
   ```

2. **Configurer les secrets** :
   - Ajouter les variables d'environnement dans GitHub Secrets
   - Configurer Supabase pour les tests

3. **Badge de couverture** :
   - Configurer coverage reporting
   - Ajouter badge dans README

**✅ Validation** :
- [ ] Workflow GitHub Actions créé
- [ ] Tests exécutés automatiquement
- [ ] Badge de couverture ajouté
- [ ] Secrets configurés

### 2.4 Checklist Tests

**✅ Tests Complétés** :
- [ ] Hooks critiques testés (8 hooks)
- [ ] Utilitaires critiques testés (5 utilitaires)
- [ ] Composants critiques testés (4 composants)
- [ ] CI/CD configuré
- [ ] Couverture > 50%
- [ ] Tests passent en CI

---

## 3. ✅ CHECKLIST DE VALIDATION

### 3.1 Sécurité

- [ ] Clés Supabase régénérées
- [ ] Variables mises à jour (local + Vercel)
- [ ] Logs d'accès audités
- [ ] 2FA activé sur compte Supabase
- [ ] Historique Git nettoyé
- [ ] `.env` vérifié et ignoré
- [ ] `.env.example` créé
- [ ] Aucune clé dans l'historique Git

### 3.2 Tests

- [ ] 8 hooks critiques testés
- [ ] 5 utilitaires critiques testés
- [ ] 4 composants critiques testés
- [ ] CI/CD configuré et fonctionnel
- [ ] Couverture > 50%
- [ ] Tous les tests passent

### 3.3 Documentation

- [ ] Documentation sécurité mise à jour
- [ ] Guide de contribution créé
- [ ] README principal mis à jour
- [ ] Changelog créé

---

## 4. 📅 CALENDRIER D'EXÉCUTION

### Semaine 1 : Sécurité (Jours 1-3)

**Jour 1** :
- [ ] Matin : Régénérer clés Supabase (30 min)
- [ ] Matin : Mettre à jour variables (30 min)
- [ ] Après-midi : Auditer logs d'accès (1h)
- [ ] Après-midi : Activer 2FA (15 min)

**Jour 2** :
- [ ] Matin : Préparer backup Git (30 min)
- [ ] Après-midi : Nettoyer historique Git (2h)

**Jour 3** :
- [ ] Matin : Vérifier fichiers sensibles (30 min)
- [ ] Après-midi : Créer .env.example (30 min)
- [ ] Après-midi : Documentation (1h)

### Semaine 1-2 : Tests (Jours 4-10)

**Jours 4-5** :
- [ ] Tests hooks critiques (10h)

**Jours 6-7** :
- [ ] Tests utilitaires critiques (10h)

**Jours 8-9** :
- [ ] Tests composants critiques (10h)

**Jour 10** :
- [ ] Configuration CI/CD (5h)

---

## 📊 MÉTRIQUES DE SUCCÈS

### Sécurité
- ✅ 0 clé exposée dans l'historique Git
- ✅ 100% des clés régénérées
- ✅ 2FA activé sur compte Supabase
- ✅ 0 activité suspecte détectée

### Tests
- ✅ Couverture > 50%
- ✅ Tous les tests passent
- ✅ CI/CD fonctionnel
- ✅ Tests exécutés automatiquement

---

## 🚀 PROCHAINES ÉTAPES

Après la complétion de ce plan P0 :

1. **P1** : Performance et optimisation
2. **P1** : Documentation organisée
3. **P2** : Monitoring avancé
4. **P2** : Accessibilité

---

**Date de création** : 27 Janvier 2025  
**Dernière mise à jour** : 27 Janvier 2025  
**Statut** : En attente d'exécution

