# 🔐 Configuration des Secrets GitHub pour CI/CD

**Date** : Janvier 2025  
**Statut** : ✅ **Documentation complète**

---

## 📋 Vue d'ensemble

Ce guide explique comment configurer les secrets GitHub nécessaires pour les tests CI/CD avec Supabase et Playwright.

---

## 🔑 Secrets Requis

### 1. **Secrets Supabase (Test Environment)**

Ces secrets sont utilisés pour les tests E2E avec un environnement Supabase de test.

| Secret                        | Description                                | Exemple                                   |
| ----------------------------- | ------------------------------------------ | ----------------------------------------- |
| `VITE_SUPABASE_TEST_URL`      | URL de l'instance Supabase de test         | `https://xxxxx.supabase.co`               |
| `VITE_SUPABASE_TEST_ANON_KEY` | Clé anonyme de l'instance Supabase de test | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### 2. **Secrets Playwright (Optionnel)**

Pour les tests avec authentification GitHub Actions.

| Secret                    | Description                                      | Exemple                  |
| ------------------------- | ------------------------------------------------ | ------------------------ |
| `PLAYWRIGHT_BROWSER_PATH` | Chemin vers le navigateur Playwright (optionnel) | `/usr/bin/google-chrome` |

---

## 📝 Instructions de Configuration

### Étape 1 : Accéder aux Secrets GitHub

1. Allez sur votre dépôt GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Secrets and variables** → **Actions**
4. Cliquez sur **New repository secret**

### Étape 2 : Créer un Environnement Supabase de Test

#### Option A : Créer un Nouveau Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet (ex: `emarzona-test`)
3. Notez l'URL et la clé anonyme depuis **Settings** → **API**

#### Option B : Utiliser un Projet Existant avec RLS Désactivé

⚠️ **Attention** : Utilisez uniquement un projet dédié aux tests pour éviter les problèmes de sécurité.

### Étape 3 : Ajouter les Secrets

Pour chaque secret, suivez ces étapes :

1. **Nom du secret** : Entrez le nom exact (ex: `VITE_SUPABASE_TEST_URL`)
2. **Valeur** : Collez la valeur correspondante
3. Cliquez sur **Add secret**

#### Exemple : Ajouter `VITE_SUPABASE_TEST_URL`

```
Nom: VITE_SUPABASE_TEST_URL
Valeur: https://hbdnzajbyjakdhuavrvb.supabase.co
```

#### Exemple : Ajouter `VITE_SUPABASE_TEST_ANON_KEY`

```
Nom: VITE_SUPABASE_TEST_ANON_KEY
Valeur: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiZG56YWpieWpha2RodWF2cnZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE5MjE2MDAsImV4cCI6MjAxNzQ5NzYwMH0.xxxxx
```

---

## ✅ Vérification

### Vérifier que les Secrets sont Configurés

1. Retournez sur **Settings** → **Secrets and variables** → **Actions**
2. Vous devriez voir vos secrets listés (les valeurs sont masquées)

### Tester les Secrets dans CI/CD

1. Créez une Pull Request ou poussez sur `main`
2. Les tests CI/CD devraient utiliser automatiquement les secrets
3. Vérifiez les logs GitHub Actions pour confirmer que les variables d'environnement sont chargées

---

## 🔒 Bonnes Pratiques de Sécurité

### ✅ À Faire

- ✅ Utiliser un projet Supabase dédié aux tests
- ✅ Régénérer les clés régulièrement
- ✅ Limiter l'accès aux secrets (seulement les workflows nécessaires)
- ✅ Utiliser des environnements GitHub pour isoler les secrets par environnement

### ❌ À Éviter

- ❌ Ne jamais commiter les secrets dans le code
- ❌ Ne pas utiliser le projet de production pour les tests
- ❌ Ne pas partager les secrets publiquement
- ❌ Ne pas utiliser les mêmes secrets pour dev/staging/prod

---

## 🚀 Utilisation dans les Workflows

Les secrets sont automatiquement disponibles dans les workflows GitHub Actions via `${{ secrets.SECRET_NAME }}`.

### Exemple : `.github/workflows/playwright.yml`

```yaml
env:
  VITE_SUPABASE_TEST_URL: ${{ secrets.VITE_SUPABASE_TEST_URL }}
  VITE_SUPABASE_TEST_ANON_KEY: ${{ secrets.VITE_SUPABASE_TEST_ANON_KEY }}
```

---

## 📚 Ressources

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Playwright CI/CD Guide](https://playwright.dev/docs/ci)

---

## 🆘 Dépannage

### Les secrets ne sont pas disponibles dans les workflows

- Vérifiez que les secrets sont bien configurés dans **Settings** → **Secrets and variables** → **Actions**
- Vérifiez que le workflow utilise la syntaxe correcte : `${{ secrets.SECRET_NAME }}`
- Vérifiez que le workflow a les permissions nécessaires

### Les tests échouent avec "Invalid API key"

- Vérifiez que la clé anonyme est correcte
- Vérifiez que l'URL Supabase est correcte
- Vérifiez que le projet Supabase de test est actif

### Les tests ne peuvent pas se connecter à Supabase

- Vérifiez que le projet Supabase de test est accessible
- Vérifiez que les RLS policies permettent les opérations de test
- Vérifiez les logs Supabase pour les erreurs de connexion

---

**Note** : Cette documentation est mise à jour régulièrement. Si vous rencontrez des problèmes, consultez la dernière version.
