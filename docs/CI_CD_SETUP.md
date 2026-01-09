# 🚀 Configuration CI/CD - Tests E2E

**Date** : 8 Janvier 2025  
**Statut** : ✅ Activé sur PR

---

## 📋 Vue d'ensemble

Les tests E2E sont maintenant **activés en CI/CD** et bloquent les PR si ils échouent.

### Workflows GitHub Actions

1. **`.github/workflows/playwright.yml`** - Tests E2E principaux
   - ✅ Activé sur `push` vers `main` et `develop`
   - ✅ Activé sur `pull_request` vers `main` et `develop`
   - ✅ Bloque les PR si les tests échouent

2. **`.github/workflows/tests.yml`** - Tests unitaires et lint
   - ✅ Tests unitaires avec coverage
   - ✅ Lint avec ESLint
   - ✅ Build verification

3. **`.github/workflows/playwright-auth.yml`** - Tests d'authentification
   - ✅ Exécution quotidienne (cron)
   - ✅ Peut être déclenché manuellement

---

## 🔧 Configuration Requise

### Secrets GitHub Actions

Pour activer les tests avec un vrai environnement Supabase, configurez ces secrets dans GitHub :

#### Secrets Recommandés (Environnement de Test)

```
VITE_SUPABASE_TEST_URL          # URL du projet Supabase de test
VITE_SUPABASE_TEST_ANON_KEY     # Clé anonyme du projet Supabase de test
```

#### Secrets de Fallback (Production)

```
VITE_SUPABASE_URL               # URL du projet Supabase de production (fallback)
VITE_SUPABASE_PUBLISHABLE_KEY   # Clé anonyme de production (fallback)
```

**Note** : Si les secrets de test ne sont pas configurés, les tests utilisent des valeurs mock et peuvent échouer.

---

## 🗄️ Configuration Environnement de Test Supabase

### Option 1 : Projet Supabase Dédié (Recommandé)

1. **Créer un nouveau projet Supabase** pour les tests
   - Aller sur [supabase.com](https://supabase.com)
   - Créer un nouveau projet (ex: `emarzona-test`)
   - Noter l'URL et la clé anonyme

2. **Configurer les secrets GitHub**
   - Aller dans `Settings` > `Secrets and variables` > `Actions`
   - Ajouter `VITE_SUPABASE_TEST_URL`
   - Ajouter `VITE_SUPABASE_TEST_ANON_KEY`

3. **Initialiser le schéma de test**
   ```bash
   # Utiliser les migrations existantes
   supabase db push --project-ref <test-project-ref>
   ```

### Option 2 : Utiliser le Projet de Production (Non recommandé)

⚠️ **Attention** : Utiliser le projet de production pour les tests peut polluer les données.

Si vous choisissez cette option :

- Utiliser les secrets `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`
- Les tests utiliseront ces valeurs en fallback

---

## 🧪 Exécution des Tests

### Localement

```bash
# Tous les tests E2E
npm run test:e2e

# Tests spécifiques
npm run test:e2e:auth
npm run test:e2e:products
npm run test:e2e:marketplace
npm run test:e2e:cart

# Mode UI interactif
npx playwright test --ui

# Mode debug
npx playwright test --debug
```

### En CI/CD

Les tests s'exécutent automatiquement sur :

- ✅ Push vers `main` ou `develop`
- ✅ Pull Request vers `main` ou `develop`
- ✅ Workflow dispatch (manuel)

---

## 📊 Rapports de Tests

### GitHub Actions

Les rapports Playwright sont automatiquement uploadés comme artifacts :

- **playwright-report** : Rapport HTML complet (30 jours de rétention)
- **test-videos** : Vidéos des tests qui échouent (7 jours de rétention)

### Accès aux Rapports

1. Aller dans l'onglet `Actions` de GitHub
2. Sélectionner le workflow qui a échoué
3. Télécharger l'artifact `playwright-report`
4. Ouvrir `index.html` dans un navigateur

---

## 🔍 Dépannage

### Les tests échouent en CI mais passent localement

1. **Vérifier les variables d'environnement**
   - Les secrets sont-ils configurés ?
   - Les valeurs sont-elles correctes ?

2. **Vérifier les timeouts**
   - Les tests peuvent être plus lents en CI
   - Augmenter les timeouts si nécessaire

3. **Vérifier les dépendances**
   - `npm ci` est utilisé en CI (lock file strict)
   - Vérifier que `package-lock.json` est à jour

### Les tests ne s'exécutent pas

1. **Vérifier les triggers**
   - Le workflow est-il activé sur la branche ?
   - Le fichier `.github/workflows/playwright.yml` existe-t-il ?

2. **Vérifier les permissions**
   - Les workflows ont-ils les permissions nécessaires ?

---

## ✅ Checklist Activation CI/CD

- [x] Workflows GitHub Actions configurés
- [x] Tests activés sur PR
- [x] Tests bloquent les PR si ils échouent
- [x] Rapports uploadés automatiquement
- [ ] Secrets GitHub configurés (à faire manuellement)
- [ ] Environnement Supabase de test créé (à faire manuellement)
- [ ] Tests passent en CI (à vérifier après configuration)

---

## 📝 Notes

- Les tests utilisent des valeurs mock si les secrets ne sont pas configurés
- Les tests peuvent échouer avec des valeurs mock (comportement attendu)
- Configurer un environnement Supabase de test est recommandé pour des tests fiables
- Les tests sont exécutés en parallèle sur plusieurs navigateurs (Chromium, Firefox, WebKit)

---

**Prochaine étape** : Configurer les secrets GitHub et créer l'environnement Supabase de test
