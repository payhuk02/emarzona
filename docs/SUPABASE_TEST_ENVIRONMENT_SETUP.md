# 🧪 Configuration de l'Environnement Supabase de Test

**Date** : Janvier 2025  
**Statut** : ✅ **Documentation complète**

---

## 📋 Vue d'ensemble

Ce guide explique comment créer et configurer un environnement Supabase dédié aux tests E2E et CI/CD.

---

## 🎯 Objectifs

- ✅ Créer un projet Supabase dédié aux tests
- ✅ Configurer les tables et migrations nécessaires
- ✅ Configurer les RLS policies pour les tests
- ✅ Créer des comptes de test
- ✅ Configurer les Edge Functions de test

---

## 📝 Étapes de Configuration

### Étape 1 : Créer un Nouveau Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Cliquez sur **New Project**
3. Remplissez les informations :
   - **Name** : `emarzona-test` (ou votre nom préféré)
   - **Database Password** : Générez un mot de passe fort
   - **Region** : Choisissez la région la plus proche
   - **Pricing Plan** : Free tier est suffisant pour les tests

4. Attendez que le projet soit créé (2-3 minutes)

### Étape 2 : Récupérer les Clés API

1. Dans votre projet Supabase, allez sur **Settings** → **API**
2. Notez les informations suivantes :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **anon public key** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. Ces valeurs seront utilisées comme secrets GitHub :
   - `VITE_SUPABASE_TEST_URL` = Project URL
   - `VITE_SUPABASE_TEST_ANON_KEY` = anon public key

### Étape 3 : Appliquer les Migrations

#### Option A : Via Supabase CLI (Recommandé)

```bash
# Installer Supabase CLI si nécessaire
npm install -g supabase

# Se connecter à Supabase
supabase login

# Lier le projet de test
supabase link --project-ref xxxxx

# Appliquer les migrations
supabase db push
```

#### Option B : Via SQL Editor

1. Allez sur **SQL Editor** dans votre projet Supabase
2. Copiez le contenu de `supabase/migrations/` un par un
3. Exécutez chaque migration dans l'ordre chronologique

### Étape 4 : Configurer les RLS Policies pour les Tests

Les tests nécessitent des RLS policies plus permissives que la production.

#### Créer une Policy de Test Globale

```sql
-- Permettre toutes les opérations pour les tests (UNIQUEMENT en environnement de test)
-- ⚠️ NE JAMAIS utiliser en production

-- Pour la table products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_all_access_products" ON products
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Pour la table stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_all_access_stores" ON stores
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Répéter pour les autres tables nécessaires aux tests
```

#### Alternative : Désactiver RLS Temporairement (Non Recommandé)

```sql
-- ⚠️ UNIQUEMENT pour les tests, jamais en production
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
-- etc.
```

### Étape 5 : Créer des Comptes de Test

#### Compte Admin de Test

```sql
-- Créer un utilisateur de test via Supabase Auth (via Dashboard)
-- Email: test-admin@emarzona.test
-- Password: TestPassword123!

-- Ensuite, lui donner les permissions admin dans la base de données
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object('role', 'admin')
WHERE email = 'test-admin@emarzona.test';
```

#### Compte Utilisateur de Test

```sql
-- Créer un utilisateur normal de test
-- Email: test-user@emarzona.test
-- Password: TestPassword123!
```

### Étape 6 : Configurer les Edge Functions de Test

Si vous utilisez des Edge Functions dans vos tests :

1. Allez sur **Edge Functions** dans votre projet Supabase
2. Déployez les fonctions nécessaires :

   ```bash
   supabase functions deploy rate-limiter --project-ref xxxxx
   ```

3. Vérifiez que les fonctions sont accessibles :
   ```bash
   curl https://xxxxx.supabase.co/functions/v1/rate-limiter \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

### Étape 7 : Configurer les Storage Buckets (si nécessaire)

Si vos tests nécessitent des uploads de fichiers :

1. Allez sur **Storage** dans votre projet Supabase
2. Créez les buckets nécessaires :
   - `products` (public)
   - `attachments` (public)
   - `avatars` (public)

3. Configurez les policies :

   ```sql
   -- Permettre les uploads pour les tests
   CREATE POLICY "test_upload_access" ON storage.objects
     FOR INSERT
     WITH CHECK (true);

   CREATE POLICY "test_read_access" ON storage.objects
     FOR SELECT
     USING (true);
   ```

---

## 🧪 Configuration des Tests

### Variables d'Environnement pour les Tests Locaux

Créez un fichier `.env.test` :

```env
VITE_SUPABASE_TEST_URL=https://xxxxx.supabase.co
VITE_SUPABASE_TEST_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Utilisation dans Playwright

Le fichier `playwright.config.ts` devrait déjà être configuré pour utiliser ces variables :

```typescript
use: {
  baseURL: process.env.VITE_SUPABASE_TEST_URL || 'http://localhost:5173',
  // ...
}
```

---

## ✅ Checklist de Vérification

- [ ] Projet Supabase de test créé
- [ ] Clés API récupérées et ajoutées aux secrets GitHub
- [ ] Migrations appliquées
- [ ] RLS policies configurées pour les tests
- [ ] Comptes de test créés
- [ ] Edge Functions déployées (si nécessaire)
- [ ] Storage buckets configurés (si nécessaire)
- [ ] Tests E2E passent avec l'environnement de test

---

## 🔒 Sécurité

### ⚠️ Important

- **NE JAMAIS** utiliser le projet de production pour les tests
- **NE JAMAIS** commiter les clés API dans le code
- **NE JAMAIS** utiliser des RLS policies permissives en production
- **TOUJOURS** isoler l'environnement de test de la production

### Bonnes Pratiques

- ✅ Utiliser un projet Supabase dédié aux tests
- ✅ Régénérer les clés régulièrement
- ✅ Limiter l'accès aux comptes de test
- ✅ Nettoyer les données de test régulièrement
- ✅ Utiliser des données de test réalistes mais non sensibles

---

## 🧹 Nettoyage des Données de Test

Pour éviter l'accumulation de données de test :

```sql
-- Script de nettoyage (à exécuter régulièrement)
DELETE FROM products WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM stores WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM orders WHERE created_at < NOW() - INTERVAL '7 days';
-- etc.
```

---

## 🆘 Dépannage

### Les migrations échouent

- Vérifiez que vous êtes connecté au bon projet Supabase
- Vérifiez que les migrations sont dans le bon ordre
- Vérifiez les logs Supabase pour les erreurs détaillées

### Les tests ne peuvent pas créer de données

- Vérifiez que les RLS policies permettent les opérations nécessaires
- Vérifiez que les comptes de test ont les bonnes permissions
- Vérifiez les logs Supabase pour les erreurs RLS

### Les Edge Functions ne fonctionnent pas

- Vérifiez que les fonctions sont déployées
- Vérifiez que les clés API sont correctes
- Vérifiez les logs Edge Functions dans Supabase Dashboard

---

## 📚 Ressources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)

---

**Note** : Cette documentation est mise à jour régulièrement. Si vous rencontrez des problèmes, consultez la dernière version.
