# 🚀 Exécuter les Migrations avec Supabase CLI

**Date** : 31/01/2025  
**Statut** : ✅ CLI installé et configuré

---

## ✅ État Actuel

- **Supabase CLI** : v2.51.0 (installé)
- **Projet lié** : `hbdnzajbyjakdhuavrvb` (Payhuk)
- **Statut** : ✅ Connecté et configuré

---

## 🎯 Migrations à Exécuter

### 1. Correction de la fonction generate_affiliate_link_code

**Fichier** : `supabase/migrations/20250131_fix_affiliate_link_code_function.sql`

**Objectif** :
- Activer l'extension `pgcrypto`
- Corriger la fonction `generate_affiliate_link_code` pour utiliser `digest()`

### 2. Système de liens courts d'affiliation

**Fichier** : `supabase/migrations/20250131_affiliate_short_links.sql`

**Objectif** :
- Créer la table `affiliate_short_links`
- Créer les fonctions `generate_short_link_code` et `track_short_link_click`
- Configurer les RLS policies

---

## 📦 Méthodes d'Exécution

### Méthode 1 : Script PowerShell (Recommandé)

```powershell
# Exécuter le script
.\scripts\execute-migrations.ps1
```

Le script :
- Vérifie que Supabase CLI est installé
- Vérifie la connexion
- Affiche les migrations en attente
- Demande confirmation
- Exécute les migrations
- Affiche l'état final

### Méthode 2 : Commande Directe

```powershell
# Exécuter toutes les migrations en attente
supabase db push
```

### Méthode 3 : Migration Spécifique

Si vous voulez exécuter une migration spécifique :

```powershell
# Via SQL Editor dans Supabase Dashboard
# 1. Aller sur https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb
# 2. Ouvrir SQL Editor
# 3. Copier le contenu du fichier de migration
# 4. Exécuter (Ctrl+Enter)
```

---

## 🔍 Vérification

### Vérifier que les migrations sont appliquées

```powershell
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

### Erreur "connection pool timeout"

**Cause** : Le pool de connexions Supabase est saturé (souvent pendant la maintenance)

**Solutions** :
1. **Attendre la fin de la maintenance** Supabase
2. **Réessayer plus tard** : `supabase db push`
3. **Utiliser SQL Editor** : Exécuter les migrations manuellement dans le dashboard

### Erreur "not logged in"

```powershell
supabase login
```

### Erreur "project not linked"

```powershell
supabase link --project-ref hbdnzajbyjakdhuavrvb
```

### Erreur de permissions

Assurez-vous d'avoir les droits d'administration sur le projet Supabase.

---

## 📝 Workflow Recommandé

1. **Vérifier l'état** :
   ```powershell
   supabase migration list
   ```

2. **Exécuter les migrations** :
   ```powershell
   supabase db push
   ```

3. **Vérifier le résultat** :
   ```powershell
   supabase migration list
   ```

4. **Tester les fonctionnalités** :
   - Créer un lien d'affiliation
   - Créer un lien court
   - Tester la redirection

---

## 🔗 Ressources

- **Documentation Supabase CLI** : https://supabase.com/docs/guides/cli
- **Dashboard Supabase** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb
- **SQL Editor** : https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql

---

## ✅ Checklist

- [x] Supabase CLI installé (v2.51.0)
- [x] Projet lié (`hbdnzajbyjakdhuavrvb`)
- [ ] Migrations exécutées (`supabase db push`)
- [ ] Extension `pgcrypto` activée
- [ ] Fonction `generate_affiliate_link_code` corrigée
- [ ] Table `affiliate_short_links` créée
- [ ] Fonctions SQL créées
- [ ] Tests fonctionnels réussis

