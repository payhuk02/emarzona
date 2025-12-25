# 🚀 Exécuter les Migrations Supabase

**Date** : 31/01/2025  
**Statut** : Guide d'utilisation

---

## ✅ Supabase CLI Installé

- **Version** : 2.51.0
- **Projet lié** : `hbdnzajbyjakdhuavrvb` (Payhuk)
- **Statut** : ✅ Connecté et configuré

---

## 📦 Méthodes d'Exécution

### Méthode 1 : Via Supabase CLI (Recommandé)

#### Pousser toutes les migrations non appliquées

```bash
supabase db push
```

Cette commande :
- Détecte automatiquement les migrations non appliquées
- Les applique dans l'ordre chronologique
- Affiche un résumé des migrations appliquées

#### Voir quelles migrations seraient appliquées (dry-run)

```bash
supabase db push --dry-run
```

#### Pousser avec mot de passe (si requis)

```bash
supabase db push -p "votre-mot-de-passe"
```

---

### Méthode 2 : Via Supabase Dashboard (Alternative)

Si le CLI ne fonctionne pas, vous pouvez exécuter les migrations manuellement :

1. **Aller dans Supabase Dashboard**
   - URL : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb

2. **Ouvrir SQL Editor**
   - Menu de gauche → **SQL Editor**

3. **Exécuter les migrations**

   **Migration 1 : Correction fonction generate_affiliate_link_code**
   ```sql
   -- Copier le contenu de : supabase/migrations/20250131_fix_affiliate_link_code_function.sql
   ```

   **Migration 2 : Système de liens courts**
   ```sql
   -- Copier le contenu de : supabase/migrations/20250131_affiliate_short_links.sql
   ```

4. **Cliquer sur "Run"** (ou `Ctrl+Enter`)

---

### Méthode 3 : Via psql (Avancé)

Si vous avez accès direct à la base de données :

```bash
# Se connecter à la base de données
psql "postgresql://postgres:[PASSWORD]@db.hbdnzajbyjakdhuavrvb.supabase.co:5432/postgres"

# Exécuter une migration
\i supabase/migrations/20250131_fix_affiliate_link_code_function.sql
\i supabase/migrations/20250131_affiliate_short_links.sql
```

---

## 🎯 Migrations à Exécuter

### 1. Correction de la fonction generate_affiliate_link_code

**Fichier** : `supabase/migrations/20250131_fix_affiliate_link_code_function.sql`

**Objectif** :
- Activer l'extension `pgcrypto`
- Corriger la fonction `generate_affiliate_link_code` pour utiliser `digest()`

**Commande** :
```bash
supabase db push
```

Cette migration sera automatiquement détectée et appliquée.

### 2. Système de liens courts d'affiliation

**Fichier** : `supabase/migrations/20250131_affiliate_short_links.sql`

**Objectif** :
- Créer la table `affiliate_short_links`
- Créer les fonctions `generate_short_link_code` et `track_short_link_click`
- Configurer les RLS policies

**Commande** :
```bash
supabase db push
```

---

## 🔍 Vérification

### Vérifier que les migrations sont appliquées

```bash
supabase migration list
```

### Vérifier que l'extension pgcrypto est activée

Dans SQL Editor :
```sql
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';
```

### Vérifier que la fonction existe

```sql
SELECT public.generate_affiliate_link_code('TEST123', 'test-product');
-- Devrait retourner un code de 12 caractères
```

### Vérifier que la table existe

```sql
SELECT * FROM affiliate_short_links LIMIT 1;
```

---

## ⚠️ Dépannage

### Erreur "failed to parse environment file"

Le fichier `.env.local` contient des caractères invalides. Solution :

```powershell
# Créer une sauvegarde
Copy-Item .env.local .env.local.backup

# Nettoyer le fichier
$content = Get-Content .env.local -Raw
$content = $content -replace "`0", ""
$content | Out-File .env.local -Encoding UTF8 -NoNewline
```

### Erreur "not logged in"

```bash
supabase login
```

### Erreur "project not linked"

```bash
supabase link --project-ref hbdnzajbyjakdhuavrvb
```

### Erreur de permissions

Assurez-vous d'avoir les droits d'administration sur le projet Supabase.

---

## 📝 Workflow Recommandé

1. **Vérifier l'état actuel**
   ```bash
   supabase migration list
   ```

2. **Voir ce qui serait appliqué**
   ```bash
   supabase db push --dry-run
   ```

3. **Appliquer les migrations**
   ```bash
   supabase db push
   ```

4. **Vérifier que tout fonctionne**
   - Tester la création d'un lien d'affiliation
   - Tester la création d'un lien court
   - Vérifier les fonctions SQL

---

## 🔗 Ressources

- **Documentation Supabase CLI** : https://supabase.com/docs/guides/cli
- **Guide des migrations** : https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Dashboard Supabase** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb

