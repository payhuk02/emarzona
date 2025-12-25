# 🔧 Guide de Migration - Système Reviews & Ratings

**Date :** 27 octobre 2025  
**Problème :** Erreur `column "product_type" does not exist`  
**Solution :** Migration de correction créée

---

## 🎯 SOLUTION IMMÉDIATE

### Option 1 : Via Supabase Dashboard (RECOMMANDÉ)

1. **Aller sur Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql
   ```

2. **Exécuter cette requête SQL :**

```sql
-- Étape 1 : Ajouter la colonne product_type si manquante
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'digital' 
CHECK (product_type IN ('digital', 'physical', 'service', 'course'));

-- Étape 2 : Mettre à jour depuis la table products
UPDATE public.reviews r
SET product_type = p.product_type
FROM public.products p
WHERE r.product_id = p.id;

-- Étape 3 : Créer l'index
CREATE INDEX IF NOT EXISTS idx_reviews_product_type ON public.reviews(product_type);
```

3. **Cliquer sur "RUN"**

✅ **C'est corrigé !**

---

### Option 2 : Via CLI Supabase

```bash
# Se connecter à Supabase
npx supabase login

# Lier le projet
npx supabase link --project-ref YOUR_PROJECT_ID

# Appliquer la migration de correction
npx supabase db push
```

---

## 🔍 VÉRIFICATION

Après avoir appliqué la migration, vérifiez avec cette requête :

```sql
-- Vérifier que product_type existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name = 'product_type';
```

**Résultat attendu :**
```
column_name  | data_type
-------------+-----------
product_type | text
```

---

## 📊 EXPLICATION DE L'ERREUR

### Cause
La table `reviews` existait déjà dans votre base de données **sans** la colonne `product_type`. Notre nouvelle migration essayait d'utiliser cette colonne qui n'existait pas.

### Solution
La migration de correction :
1. ✅ Ajoute la colonne manquante
2. ✅ Remplit automatiquement les valeurs depuis `products.product_type`
3. ✅ Crée les index nécessaires
4. ✅ Ajoute les autres colonnes de ratings détaillés

---

## 🗄️ COLONNES AJOUTÉES

Après correction, votre table `reviews` aura :

```sql
reviews
├── id (UUID)
├── product_id (UUID)
├── user_id (UUID)
├── rating (INTEGER)
├── content (TEXT)
├── product_type (TEXT) ⭐ NOUVEAU
├── quality_rating (INTEGER) ⭐ NOUVEAU
├── value_rating (INTEGER) ⭐ NOUVEAU
├── service_rating (INTEGER) ⭐ NOUVEAU
├── delivery_rating (INTEGER) ⭐ NOUVEAU
├── course_content_rating (INTEGER) ⭐ NOUVEAU
├── instructor_rating (INTEGER) ⭐ NOUVEAU
├── reviewer_name (TEXT) ⭐ NOUVEAU
├── reviewer_avatar (TEXT) ⭐ NOUVEAU
└── ... (autres colonnes)
```

---

## 🚀 APRÈS LA CORRECTION

Une fois la migration appliquée :

### 1. Redémarrer le serveur de dev
```bash
# Arrêter avec Ctrl+C
# Relancer
npm run dev
```

### 2. Tester les reviews
```typescript
import { useProductReviews } from '@/hooks/useReviews';

const { data: reviews } = useProductReviews(productId);
console.log(reviews); // Doit fonctionner !
```

---

## ⚠️ SI L'ERREUR PERSISTE

### Vérification complète

```sql
-- 1. Vérifier la structure de la table
\d public.reviews

-- 2. Compter les reviews
SELECT COUNT(*) FROM public.reviews;

-- 3. Vérifier les product_type
SELECT DISTINCT product_type FROM public.reviews;
```

### Réinitialisation complète (dernier recours)

⚠️ **ATTENTION : Cela supprime toutes les reviews !**

```sql
-- Supprimer toutes les tables reviews
DROP TABLE IF EXISTS public.review_media CASCADE;
DROP TABLE IF EXISTS public.review_votes CASCADE;
DROP TABLE IF EXISTS public.review_replies CASCADE;
DROP TABLE IF EXISTS public.product_review_stats CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Puis réexécuter la migration principale
-- supabase/migrations/20251027_reviews_system_complete.sql
```

---

## 📞 SUPPORT

Si l'erreur persiste après ces étapes :

1. **Vérifiez les logs Supabase**
   ```
   Dashboard → Logs → Database
   ```

2. **Exportez la structure actuelle**
   ```sql
   pg_dump --schema-only public.reviews
   ```

3. **Contactez le support avec :**
   - Message d'erreur complet
   - Structure de la table actuelle
   - Logs Supabase

---

## ✅ CHECKLIST FINALE

- [ ] Migration de correction exécutée
- [ ] Colonne `product_type` présente
- [ ] Index créé
- [ ] Serveur dev redémarré
- [ ] Aucune erreur dans les logs
- [ ] Hooks `useReviews` fonctionnels

---

**🎉 Après correction, votre système de Reviews sera 100% opérationnel !**

