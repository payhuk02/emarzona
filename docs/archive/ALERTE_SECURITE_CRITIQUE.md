# 🚨 ALERTE SÉCURITÉ CRITIQUE - CLÉS API EXPOSÉES

> **Date** : Janvier 2025  
> **Statut** : 🔴 URGENT  
> **Priorité** : CRITIQUE

---

## ⚠️ PROBLÈME IDENTIFIÉ

**Les clés API Supabase ont été exposées publiquement** dans le repository GitHub : https://github.com/payhuk02/payhula.git

### Clés Exposées

- `VITE_SUPABASE_PUBLISHABLE_KEY` : Clé publique Supabase (anon key)
- `VITE_SUPABASE_PROJECT_ID` : ID du projet Supabase
- `VITE_SUPABASE_URL` : URL du projet Supabase

### Impact

1. **Accès non autorisé possible** à votre base de données Supabase
2. **Risque de manipulation** des données via l'API publique
3. **Violation de sécurité** si les politiques RLS ne sont pas correctement configurées
4. **Coûts potentiels** si des requêtes malveillantes sont effectuées

---

## ✅ ACTIONS IMMÉDIATES REQUISES

### 1. Régénérer les Clés Supabase (URGENT)

1. **Aller sur Supabase Dashboard** : https://app.supabase.com/project/your-project-id
2. **Settings** → **API** → **Project API keys**
3. **Régénérer la clé "anon/public"**
4. **Copier la nouvelle clé**

### 2. Mettre à Jour Toutes les Instances

#### Vercel (Production)
1. Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionner le projet **payhula**
3. **Settings** → **Environment Variables**
4. Mettre à jour :
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (nouvelle clé)
   - Redéployer l'application

#### Développement Local
1. Mettre à jour le fichier `.env` avec la nouvelle clé
2. Redémarrer le serveur de développement

### 3. Nettoyer la Documentation

✅ **DÉJÀ FAIT** : Les fichiers suivants ont été nettoyés :
- `CONFIGURATION_VARIABLES_ENV.md`
- `GUIDE_CONFIGURATION_VERCEL.md`

⚠️ **À FAIRE** : Il reste **47 autres fichiers** contenant des références aux clés. Utiliser le script de nettoyage automatique.

### 4. Vérifier les Politiques RLS

1. Aller sur Supabase Dashboard
2. **Authentication** → **Policies**
3. Vérifier que toutes les tables ont des politiques RLS activées
4. Vérifier que les politiques limitent l'accès aux utilisateurs authentifiés uniquement

### 5. Surveiller l'Activité

1. **Supabase Dashboard** → **Logs** → **API Logs**
2. Surveiller les requêtes suspectes
3. Vérifier les coûts et l'utilisation

---

## 📋 CHECKLIST DE SÉCURITÉ

- [ ] Clés Supabase régénérées dans le Dashboard
- [ ] Variables d'environnement mises à jour sur Vercel
- [ ] Fichier `.env` local mis à jour
- [ ] Application redéployée sur Vercel
- [ ] Tous les fichiers de documentation nettoyés (47 fichiers restants)
- [ ] Politiques RLS vérifiées et activées
- [ ] Logs Supabase surveillés pour activité suspecte
- [ ] Commit et push des changements de documentation

---

## 🔧 SCRIPT DE NETTOYAGE AUTOMATIQUE

Un script PowerShell est disponible pour nettoyer automatiquement tous les fichiers :

```powershell
# Exécuter le script de nettoyage
.\scripts\clean-exposed-keys.ps1
```

**Note** : Le script remplace automatiquement toutes les clés exposées par des placeholders dans tous les fichiers `.md`.

---

## 📊 FICHIERS AFFECTÉS

**Total** : 49 fichiers contenant des références aux clés

**Nettoyés** : 2 fichiers
- ✅ `CONFIGURATION_VARIABLES_ENV.md`
- ✅ `GUIDE_CONFIGURATION_VERCEL.md`

**À nettoyer** : 47 fichiers restants

---

## 🔒 BONNES PRATIQUES POUR L'AVENIR

1. **Ne jamais commiter de clés API** dans le code ou la documentation
2. **Utiliser des placeholders** dans tous les exemples de documentation
3. **Vérifier `.gitignore`** avant chaque commit
4. **Utiliser des secrets managers** pour la production (Vercel, GitHub Secrets)
5. **Rotation régulière** des clés API
6. **Audit de sécurité** régulier du repository

---

## 📞 SUPPORT

Si vous avez des questions ou besoin d'aide :

1. Consulter la [documentation Supabase](https://supabase.com/docs/guides/platform/api-keys)
2. Contacter le support Supabase si nécessaire
3. Vérifier les logs Supabase pour détecter des accès non autorisés

---

**⚠️ IMPORTANT** : Cette alerte doit être traitée **IMMÉDIATEMENT**. Les clés exposées publiquement représentent un risque de sécurité majeur.

---

*Document créé le : Janvier 2025*  
*Statut : 🔴 URGENT - Action requise immédiatement*

