# 🔧 APPLICATION DE LA MIGRATION USER_STYLE_PREFERENCES

## 🚨 Problème Identifié

Les erreurs suivantes apparaissent dans la console :

```
logger.ts:80 [ERROR] Failed to save style preferences Object
logger.ts:80 [ERROR] Error completing style quiz Object
```

## 🔍 Cause Racine

La **table `user_style_preferences` n'existe pas** dans la base de données Supabase locale.

## ✅ Solution

### 1. Appliquer la Migration Manquante

```bash
# Option 1: Reset complet de la base de données (recommandé pour dev)
npx supabase db reset --local

# Option 2: Appliquer uniquement les migrations manquantes
npx supabase migration up
```

### 2. Vérifier que la Migration Est Appliquée

Après avoir appliqué la migration, vérifiez que la table existe :

```bash
# Dans l'interface Supabase Dashboard > Table Editor
# Vous devriez voir: user_style_preferences
```

### 3. Régénérer les Types TypeScript

```bash
npm run supabase:types
```

## 🧪 Test de Fonctionnement

Une fois la migration appliquée :

1. **Redémarrer l'application** :

   ```bash
   npm run dev
   ```

2. **Aller sur la page du quiz de style** :

   ```
   http://localhost:8080/personalization/quiz
   ```

3. **Compléter le quiz** - Les erreurs ne devraient plus apparaître

## 📋 Structure de la Table Créée

```sql
CREATE TABLE user_style_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL, -- StyleProfile as JSON
  quiz_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  recommendations_viewed INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## 🔒 Sécurité (RLS)

La table inclut des politiques Row Level Security :

- ✅ Users can view their own style preferences
- ✅ Users can insert their own style preferences
- ✅ Users can update their own style preferences
- ✅ Users can delete their own style preferences

## 🚨 Si les Erreurs Persistent

### Vérifications Supplémentaires

1. **Docker Desktop est démarré** :

   ```bash
   docker ps | grep supabase
   ```

2. **Base de données locale fonctionne** :

   ```bash
   npx supabase status
   ```

3. **Variables d'environnement** :

   ```bash
   # Vérifier .env.local et .env
   echo $VITE_SUPABASE_URL
   ```

4. **Logs détaillés** :
   - Ouvrir les DevTools du navigateur
   - Vérifier l'onglet Console pour les nouveaux messages d'erreur

### Solution Alternative

Si Supabase local ne fonctionne pas, utiliser Supabase Cloud :

1. Déployer les migrations sur Supabase Cloud
2. Changer les variables d'environnement pour pointer vers Cloud

## ✅ Validation Finale

Après correction, vous devriez voir dans les logs :

```
[INFO] Style quiz completed
[INFO] Style preferences saved successfully
```

Au lieu des erreurs précédentes.

---

**Date**: 2026-01-18
**Priorité**: CRITIQUE
**Impact**: Fonctionnalité de personnalisation bloquée
**Solution**: Appliquer la migration Supabase manquante
