# 🚀 Démarrage Rapide : Génération Migrations RLS

**Date** : 13 Janvier 2026  
**Script** : `npm run generate:rls-migration`

---

## ✅ État Actuel

- ✅ Script de génération créé et testé
- ✅ Migration d'exemple générée : `notifications` (Pattern 1)
- ✅ Documentation complète disponible

---

## 🎯 Prochaines Étapes Immédiates

### Étape 1 : Exécuter l'Audit RLS Complet

```sql
-- Dans Supabase Dashboard → SQL Editor
-- Exécuter : supabase/FINAL_RLS_AUDIT.sql
```

**Objectif** : Identifier les 40 tables sans politiques RLS

---

### Étape 2 : Générer les Migrations pour les Tables Critiques

#### Tables Critiques (Priorité 1) - Pattern 4 (Admin Only)

```bash
# Configuration plateforme
npm run generate:rls-migration -- --table=platform_settings --pattern=4
npm run generate:rls-migration -- --table=admin_config --pattern=4
```

#### Tables Haute Priorité (Priorité 2) - Pattern 1 (user_id)

```bash
# Données utilisateurs
npm run generate:rls-migration -- --table=notifications --pattern=1
npm run generate:rls-migration -- --table=user_preferences --pattern=1
npm run generate:rls-migration -- --table=saved_addresses --pattern=1
npm run generate:rls-migration -- --table=certificates --pattern=1
```

#### Tables Haute Priorité (Priorité 2) - Pattern 2 (store_id)

```bash
# Données boutique
npm run generate:rls-migration -- --table=subscriptions --pattern=2
npm run generate:rls-migration -- --table=invoices --pattern=2
npm run generate:rls-migration -- --table=disputes --pattern=2
npm run generate:rls-migration -- --table=service_availability --pattern=2
npm run generate:rls-migration -- --table=recurring_bookings --pattern=2
```

---

### Étape 3 : Vérifier et Adapter les Migrations

Pour chaque fichier généré dans `supabase/migrations/` :

1. **Vérifier le pattern** : Est-ce le bon pattern pour cette table ?
2. **Vérifier les colonnes** : Les colonnes `user_id` et `store_id` existent-elles ?
3. **Adapter si nécessaire** : Utiliser les options `--user-id-column` ou `--store-id-column`

---

### Étape 4 : Exécuter les Migrations

**Option 1 : Via Supabase Dashboard (Recommandé pour tests)**

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier le contenu d'une migration
3. Coller et exécuter
4. Vérifier les messages de succès

**Option 2 : Via Supabase CLI**

```bash
supabase db execute --file supabase/migrations/20260113HHMMSS_rls_TABLE_NAME.sql
```

---

### Étape 5 : Tester les Politiques

```sql
-- Vérifier que les politiques sont créées
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'notifications'  -- Remplacer par votre table
ORDER BY policyname;
```

**Tester avec différents rôles** :
- Utilisateur normal
- Propriétaire de boutique
- Admin

---

## 📋 Checklist de Validation

Pour chaque migration :

- [ ] Migration générée avec le bon pattern
- [ ] Colonnes adaptées si nécessaire
- [ ] Migration exécutée sans erreur
- [ ] 4 politiques créées (SELECT, INSERT, UPDATE, DELETE)
- [ ] Testé avec utilisateur normal
- [ ] Testé avec propriétaire boutique (si Pattern 2)
- [ ] Testé avec admin
- [ ] Documentation mise à jour

---

## 🔍 Comment Identifier le Bon Pattern

### Pattern 1 : Table avec `user_id`
- Table contient une colonne `user_id` (ou similaire)
- Données liées à un utilisateur spécifique
- Exemples : `notifications`, `user_preferences`, `certificates`

### Pattern 2 : Table avec `store_id`
- Table contient une colonne `store_id` (ou similaire)
- Données liées à une boutique
- Exemples : `products`, `orders`, `subscriptions`, `invoices`

### Pattern 3 : Table Publique
- Données accessibles à tous les utilisateurs authentifiés
- Exemples : `reviews`, `community_posts`

### Pattern 4 : Admin Only
- Données sensibles accessibles uniquement aux admins
- Exemples : `platform_settings`, `admin_config`, `system_logs`

---

## 📊 Exemple : Générer 10 Migrations en 5 Minutes

```bash
# Tables admin (Pattern 4)
npm run generate:rls-migration -- --table=platform_settings --pattern=4
npm run generate:rls-migration -- --table=admin_config --pattern=4

# Tables utilisateur (Pattern 1)
npm run generate:rls-migration -- --table=notifications --pattern=1
npm run generate:rls-migration -- --table=user_preferences --pattern=1
npm run generate:rls-migration -- --table=certificates --pattern=1

# Tables boutique (Pattern 2)
npm run generate:rls-migration -- --table=subscriptions --pattern=2
npm run generate:rls-migration -- --table=invoices --pattern=2
npm run generate:rls-migration -- --table=disputes --pattern=2
npm run generate:rls-migration -- --table=service_availability --pattern=2
npm run generate:rls-migration -- --table=recurring_bookings --pattern=2
```

---

## ⚠️ Points d'Attention

1. **Vérifier la Structure de la Table** : Avant de générer, vérifier les colonnes dans Supabase Dashboard
2. **RLS Activé** : La migration vérifie que RLS est activé, mais vous pouvez l'activer avant :
   ```sql
   ALTER TABLE nom_table ENABLE ROW LEVEL SECURITY;
   ```
3. **Politiques Existantes** : La migration s'arrête si des politiques existent déjà
4. **Tester en Staging** : Toujours tester les migrations en environnement de staging avant production

---

## 🔗 Ressources

- **Script** : `scripts/generate-rls-migrations.js`
- **Guide Génération** : `docs/audits/GUIDE_GENERATION_MIGRATIONS.md`
- **Guide Migrations** : `docs/audits/GUIDE_MIGRATIONS_RLS.md`
- **Exemples** : `docs/audits/EXEMPLE_MIGRATION_RLS.md`
- **Template** : `supabase/migrations/20250130_rls_critical_tables_template.sql`

---

## 📈 Progression Recommandée

### Semaine 1 : Tables Critiques (10-15 tables)
- Tables admin (Pattern 4)
- Tables critiques avec données sensibles

### Semaine 2 : Tables Haute Priorité (20-30 tables)
- Tables utilisateur (Pattern 1)
- Tables boutique importantes (Pattern 2)

### Semaine 3 : Tables Restantes (10-15 tables)
- Tables moyenne/basse priorité
- Tables de logs et analytics

---

**Objectif** : Avoir toutes les migrations RLS complètes dans les 3 prochaines semaines ! 🎯
