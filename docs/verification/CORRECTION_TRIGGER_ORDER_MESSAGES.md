# 🔧 CORRECTION - Trigger Order Messages

**Date :** 2 Février 2025  
**Problème :** Table `public.messages` n'existe pas

---

## 🚨 PROBLÈME IDENTIFIÉ

Lors de l'exécution de la migration `20250202_notification_order_messages_trigger.sql`, une erreur s'est produite :

```
ERROR: 42P01: relation "public.messages" does not exist
```

**Cause :** La table `public.messages` n'existe pas dans la base de données.

---

## ✅ SOLUTION

### Option 1 : Vérifier si la migration de base a été appliquée

La table `messages` devrait être créée par la migration :

- `supabase/migrations/20250122_advanced_payment_and_messaging.sql`

**Vérification :**

```sql
-- Vérifier si la table existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'messages'
);
```

### Option 2 : Utiliser la migration corrigée

Une nouvelle migration a été créée avec vérification conditionnelle :

- `supabase/migrations/20250202_notification_order_messages_trigger_fixed.sql`

Cette migration :

- ✅ Vérifie l'existence de la table avant de créer le trigger
- ✅ Affiche un message d'avertissement si la table n'existe pas
- ✅ Ne génère pas d'erreur si la table est absente

---

## 📋 ACTIONS REQUISES

### 1. Vérifier l'existence de la table

Exécutez dans Supabase SQL Editor :

```sql
-- Vérifier si la table messages existe
SELECT
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'messages';
```

### 2. Si la table n'existe pas

Appliquez d'abord la migration de base :

```sql
-- Appliquer la migration qui crée la table messages
-- Fichier: 20250122_advanced_payment_and_messaging.sql
```

### 3. Si la table existe

Utilisez la migration corrigée :

```sql
-- Appliquer la migration corrigée
-- Fichier: 20250202_notification_order_messages_trigger_fixed.sql
```

---

## 🔍 VÉRIFICATION DES TABLES

### Tables requises pour le trigger

1. ✅ `public.conversations` - Doit exister
2. ❌ `public.messages` - **MANQUANTE** (c'est le problème)
3. ✅ `public.orders` - Doit exister
4. ✅ `public.stores` - Doit exister
5. ✅ `public.notifications` - Doit exister

### Vérification complète

```sql
-- Vérifier toutes les tables requises
SELECT
  table_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = t.table_name
    ) THEN '✅ Existe'
    ELSE '❌ Manquante'
  END as status
FROM (VALUES
  ('conversations'),
  ('messages'),
  ('orders'),
  ('stores'),
  ('notifications')
) AS t(table_name);
```

---

## 📝 NOTES

### Pourquoi la table n'existe pas ?

Plusieurs raisons possibles :

1. La migration `20250122_advanced_payment_and_messaging.sql` n'a pas été appliquée
2. La table a été supprimée manuellement
3. La migration a échoué silencieusement
4. La base de données est dans un état incohérent

### Alternative : Utiliser le service TypeScript

Si la table `messages` n'existe pas, les notifications peuvent toujours être envoyées via le service TypeScript :

- `src/lib/notifications/order-message-notifications.ts`
- Intégré dans `src/hooks/useMessaging.ts`

Le trigger SQL est une **optimisation** pour les notifications automatiques, mais le service TypeScript fonctionne indépendamment.

---

**Document généré le :** 2 Février 2025  
**Statut :** ⚠️ **CORRECTION REQUISE**
