# ⚡ Guide Rapide - Correction de l'Erreur 400

## 🔴 Problème

L'erreur `400 Bad Request` sur `get_user_product_recommendations` apparaît car la fonction n'existe pas dans la base de données.

## ✅ Solution Rapide

### Option 1 : Via Supabase Dashboard (Le Plus Rapide) ⚡

1. **Ouvrir Supabase Dashboard :**
   - Aller sur : https://supabase.com/dashboard/project/your-project-id/sql/new

2. **Copier le script SQL :**
   - Ouvrir le fichier : `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`
   - Copier tout le contenu (Ctrl+A, Ctrl+C)

3. **Coller et exécuter :**
   - Coller dans l'éditeur SQL
   - Cliquer sur **Run** (ou Ctrl+Enter)
   - Attendre le message de succès ✅

4. **Vérifier :**
   - Recharger la page marketplace (Ctrl+Shift+R)
   - Vérifier la console : plus d'erreur 400 ✅

### Option 2 : Via Supabase CLI

```bash
# Pousser la migration
supabase db push

# Ou exécuter directement le script
supabase db execute --file FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql
```

## 📋 Fichiers Disponibles

- **Script SQL direct :** `FIX_GET_USER_PRODUCT_RECOMMENDATIONS.sql`
- **Migration Supabase :** `supabase/migrations/20250202_fix_get_user_product_recommendations.sql`
- **Instructions détaillées :** `INSTRUCTIONS_EXECUTER_MIGRATION.md`

## ✅ Après Exécution

1. ✅ L'erreur 400 disparaît
2. ✅ Le warning "function does not exist" disparaît
3. ✅ Les recommandations peuvent s'afficher (si utilisateur connecté)
4. ✅ La marketplace fonctionne normalement

## 🆘 Si Problème

Vérifier que les tables suivantes existent :
- `orders`
- `order_items`
- `products`
- `stores`

Si elles n'existent pas, exécuter les migrations manquantes d'abord.





