# 🚀 Déploiement des Corrections - Remboursements

**Date** : 30 Janvier 2025  
**Statut** : ✅ Edge Function déployée, Migration SQL à appliquer

---

## ✅ Déploiements Effectués

### 1. Edge Function `moneroo-webhook` ✅

**Statut** : ✅ **DÉPLOYÉE**

La fonction a été déployée avec succès :

```
Deployed Functions on project hbdnzajbyjakdhuavrvb: moneroo-webhook
```

**Modifications** :

- ✅ Ajout de la mise à jour de l'order lors d'un remboursement via webhook
- ✅ Déclenchement automatique de la mise à jour de `store_earnings`

### 2. Code Frontend ✅

**Fichier** : `src/lib/moneroo-payment.ts`

**Statut** : ✅ **MODIFIÉ** (sera déployé avec le prochain build)

**Modifications** :

- ✅ Ajout de la mise à jour de l'order lors d'un remboursement manuel

---

## ⚠️ Migration SQL à Appliquer

### Problème

La commande `supabase db push` a détecté de nombreuses migrations locales non appliquées sur la base distante. Pour éviter d'appliquer toutes ces migrations en une fois, il est recommandé d'appliquer uniquement la nouvelle migration via le **Supabase SQL Editor**.

### Solution : Application Manuelle via SQL Editor

#### Étape 1 : Ouvrir le SQL Editor

1. Aller sur https://supabase.com/dashboard/project/hbdnzajbyjakdhuavrvb/sql
2. Cliquer sur "New Query"

#### Étape 2 : Exécuter le SQL suivant

Copier et coller le SQL suivant dans l'éditeur :

```sql
-- =========================================================
-- Migration : Correction mise à jour store_earnings lors de remboursements
-- Date : 30 Janvier 2025
-- Description : Modifie le trigger pour mettre à jour store_earnings quand une order est remboursée
-- =========================================================

-- Modifier le trigger pour aussi gérer les remboursements
CREATE OR REPLACE FUNCTION public.trigger_update_store_earnings_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour les revenus si la commande est complétée et payée
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;

  -- 🆕 Mettre à jour les revenus si la commande est remboursée
  -- Cela permet de recalculer store_earnings et d'exclure les orders remboursées du total_revenue
  IF NEW.payment_status = 'refunded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'refunded') THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;

  RETURN NEW;
END;
$$;

-- Commentaires
COMMENT ON FUNCTION public.trigger_update_store_earnings_on_order() IS 'Met à jour automatiquement store_earnings quand une commande est complétée et payée, ou quand elle est remboursée.';
```

#### Étape 3 : Vérifier l'Application

Après l'exécution, vérifier que la fonction a été mise à jour :

```sql
-- Vérifier la définition de la fonction
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'trigger_update_store_earnings_on_order';
```

Vous devriez voir la nouvelle condition pour `payment_status = 'refunded'`.

---

## ✅ Vérification du Déploiement

### Checklist

- [x] Edge Function `moneroo-webhook` déployée
- [x] Code frontend modifié (`src/lib/moneroo-payment.ts`)
- [ ] Migration SQL appliquée (à faire via SQL Editor)
- [ ] Tests effectués (après application de la migration)

### Tests Recommandés

Après avoir appliqué la migration SQL :

1. **Test Remboursement Manuel** :
   - Créer une transaction complétée avec order
   - Vérifier `store_earnings.total_revenue` avant
   - Appeler `refundMonerooPayment()`
   - Vérifier que :
     - ✅ Order a `payment_status: "refunded"`
     - ✅ `store_earnings.total_revenue` est diminué
     - ✅ `store_earnings.available_balance` est ajusté

2. **Test Remboursement Webhook** :
   - Simuler un webhook Moneroo avec `status: "refunded"`
   - Vérifier que l'order est mise à jour
   - Vérifier que `store_earnings` est recalculé

---

## 📝 Notes

- La migration SQL modifie uniquement la fonction `trigger_update_store_earnings_on_order`
- Le trigger existant utilisera automatiquement la nouvelle version de la fonction
- Aucune donnée n'est modifiée, seulement la logique de calcul

---

## 🚨 Alternative : Application via CLI

Si vous préférez appliquer toutes les migrations locales (attention : cela peut prendre du temps) :

```bash
supabase db push --include-all
```

**⚠️ Attention** : Cette commande appliquera toutes les migrations locales non appliquées, ce qui peut prendre plusieurs minutes.

---

**Dernière mise à jour** : 30 Janvier 2025  
**Statut** : ✅ Edge Function déployée, Migration SQL à appliquer manuellement
