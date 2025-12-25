# 🚀 Configuration Supabase CLI

**Date** : 31/01/2025  
**Statut** : ✅ CLI installé (v2.51.0)

---

## ✅ Installation Actuelle

Supabase CLI est **déjà installé** sur votre système :
- **Version** : 2.51.0
- **Version disponible** : 2.58.5 (mise à jour recommandée)

---

## 🔄 Mise à jour (Windows)

### Option 1 : Via Scoop (Recommandé)

```powershell
# Installer Scoop si pas déjà installé
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Installer/Mettre à jour Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# ou pour mettre à jour
scoop update supabase
```

### Option 2 : Via Chocolatey

```powershell
# Installer Chocolatey si pas déjà installé
# Puis :
choco install supabase
# ou pour mettre à jour
choco upgrade supabase
```

### Option 3 : Téléchargement direct

1. Aller sur : https://github.com/supabase/cli/releases
2. Télécharger `supabase_windows_amd64.zip`
3. Extraire et ajouter au PATH

---

## 🔗 Lier le Projet

Votre projet est déjà configuré avec :
- **Project ID** : `hbdnzajbyjakdhuavrvb` (dans `supabase/config.toml`)

### Se connecter à Supabase

```bash
supabase login
```

Cela ouvrira votre navigateur pour vous authentifier.

### Lier le projet (si pas déjà fait)

```bash
supabase link --project-ref hbdnzajbyjakdhuavrvb
```

---

## 📦 Exécuter les Migrations

### Voir les migrations en attente

```bash
supabase db diff
```

### Pousser toutes les migrations

```bash
supabase db push
```

### Pousser une migration spécifique

```bash
# Depuis le dossier du projet
supabase db push --file supabase/migrations/20250131_affiliate_short_links.sql
```

### Vérifier l'état des migrations

```bash
supabase migration list
```

---

## 🎯 Migrations à Exécuter

### 1. Correction de la fonction generate_affiliate_link_code

```bash
supabase db push --file supabase/migrations/20250131_fix_affiliate_link_code_function.sql
```

**OU** via SQL Editor dans Supabase Dashboard :
- Copier le contenu de `supabase/migrations/20250131_fix_affiliate_link_code_function.sql`
- Exécuter dans SQL Editor

### 2. Système de liens courts d'affiliation

```bash
supabase db push --file supabase/migrations/20250131_affiliate_short_links.sql
```

**OU** via SQL Editor dans Supabase Dashboard :
- Copier le contenu de `supabase/migrations/20250131_affiliate_short_links.sql`
- Exécuter dans SQL Editor

---

## 🔍 Commandes Utiles

### Vérifier la connexion

```bash
supabase projects list
```

### Voir les migrations appliquées

```bash
supabase migration list
```

### Générer une nouvelle migration

```bash
supabase migration new nom_de_la_migration
```

### Réinitialiser la base de données locale (dev)

```bash
supabase db reset
```

### Voir les logs

```bash
supabase logs
```

---

## ⚠️ Dépannage

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

### Vérifier la configuration

```bash
cat supabase/config.toml
```

Devrait afficher :
```toml
project_id = "hbdnzajbyjakdhuavrvb"
```

---

## 📝 Workflow Recommandé

### 1. Créer une nouvelle migration

```bash
supabase migration new nom_de_la_migration
```

Cela crée un fichier dans `supabase/migrations/` avec un timestamp.

### 2. Éditer la migration

Éditer le fichier créé avec votre SQL.

### 3. Tester localement (optionnel)

```bash
supabase start  # Démarrer Supabase localement
supabase db reset  # Appliquer toutes les migrations
```

### 4. Pousser vers la production

```bash
supabase db push
```

---

## 🔗 Ressources

- **Documentation Supabase CLI** : https://supabase.com/docs/guides/cli
- **GitHub CLI** : https://github.com/supabase/cli
- **Guide de mise à jour** : https://supabase.com/docs/guides/cli/getting-started#updating-the-supabase-cli

---

## ✅ Checklist

- [x] Supabase CLI installé (v2.51.0)
- [ ] CLI mis à jour vers la dernière version (optionnel)
- [ ] Connecté à Supabase (`supabase login`)
- [ ] Projet lié (`supabase link`)
- [ ] Migrations exécutées (`supabase db push`)

