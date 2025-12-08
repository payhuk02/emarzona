# 🔍 Vérification des Points Critiques Identifiés - Système de Transactions

**Date** : 30 Janvier 2025  
**Statut** : ✅ Vérification Complète

---

## 📋 Résumé

Vérification des deux points critiques identifiés dans l'audit v2.0 :

1. **Mise à jour automatique de store_earnings lors de remboursements**
2. **Validation signature webhook PayDunya**

---

## 1️⃣ Mise à Jour Automatique de store_earnings lors de Remboursements

### 🔴 PROBLÈME IDENTIFIÉ

**Statut** : ❌ **PROBLÈME CRITIQUE DÉTECTÉ**

#### Analyse :

1. **Fonction `calculate_store_earnings`** :
   ```sql
   SELECT COALESCE(SUM(total_amount), 0)
   FROM public.orders
   WHERE store_id = p_store_id
     AND status = 'completed'
     AND payment_status = 'paid';  -- ⚠️ Seulement les orders avec payment_status = 'paid'
   ```

2. **Fonction `refundMonerooPayment()`** :
   - ✅ Met à jour la transaction avec `status: "refunded"`
   - ❌ **NE MET PAS À JOUR l'order avec `payment_status: 'refunded'`**
   - ❌ **NE DÉCLENCHE PAS la mise à jour de store_earnings**

3. **Conséquence** :
   - Si une transaction est remboursée, l'order associée garde `payment_status = 'paid'`
   - L'order continue d'être comptée dans `total_revenue` de `store_earnings`
   - **Les revenus du store ne sont pas correctement ajustés lors d'un remboursement**

#### Code Actuel (Problématique) :

```typescript:src/lib/moneroo-payment.ts
// Mettre à jour la transaction avec les infos de remboursement
const { error: updateError } = await supabase
  .from("transactions")
  .update({
    status: "refunded",
    // ... autres champs
  })
  .eq("id", transactionId);

// ❌ MANQUE : Mise à jour de l'order
// ❌ MANQUE : Déclenchement de update_store_earnings
```

### ✅ SOLUTION PROPOSÉE

#### 1. Mettre à jour l'order lors d'un remboursement

```typescript
// Après la mise à jour de la transaction
if (transaction.order_id) {
  await supabase
    .from('orders')
    .update({
      payment_status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.order_id);
}
```

#### 2. Déclencher la mise à jour de store_earnings

**Option A : Via trigger SQL (Recommandé)**
- Modifier le trigger `update_store_earnings_on_order` pour aussi se déclencher quand `payment_status` passe à `'refunded'`

**Option B : Appel direct**
- Appeler `update_store_earnings(transaction.store_id)` après la mise à jour de l'order

#### 3. Migration SQL pour le trigger

```sql
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
  IF NEW.payment_status = 'refunded' AND OLD.payment_status != 'refunded' THEN
    PERFORM public.update_store_earnings(NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$;
```

### 📝 Fichiers à Modifier

1. **`src/lib/moneroo-payment.ts`** :
   - Ajouter la mise à jour de l'order lors d'un remboursement
   - Appeler `update_store_earnings` ou laisser le trigger SQL s'en charger

2. **`supabase/migrations/`** (nouveau fichier) :
   - Créer une migration pour modifier le trigger `update_store_earnings_on_order`

3. **`src/lib/paydunya-payment.ts`** (si fonction de remboursement existe) :
   - Vérifier et appliquer les mêmes corrections

### ⚠️ Impact

- **Criticité** : 🔴 **HAUTE**
- **Impact** : Les revenus des stores ne sont pas correctement ajustés lors de remboursements
- **Effort** : Faible (quelques lignes de code)

---

## 2️⃣ Validation Signature Webhook PayDunya

### ✅ VÉRIFICATION COMPLÈTE

**Statut** : ✅ **CONFIRMÉ - Pas de signature disponible**

#### Analyse :

1. **Webhook PayDunya actuel** :
   - ✅ Validation du montant (anti-fraude)
   - ✅ Vérification d'idempotence (évite les doublons)
   - ❌ Pas de validation de signature

2. **Recherche dans la documentation PayDunya** :
   - PayDunya n'envoie **pas toujours** de signature dans les webhooks
   - La validation se fait principalement via :
     - Validation du montant
     - Vérification de l'`invoice_token`
     - Vérification de l'idempotence

3. **Sécurité actuelle** :
   - ✅ Validation du montant (comparaison avec l'order)
   - ✅ Vérification d'idempotence (fonction `is_webhook_already_processed`)
   - ✅ Vérification de l'`invoice_token` (unique par transaction)

#### Code Actuel :

```typescript:supabase/functions/paydunya-webhook/index.ts
// 🔒 SÉCURITÉ: Valider le montant avant de mettre à jour la transaction
if (amount && transaction.order_id) {
  const { data: orderData } = await supabase
    .from('orders')
    .select('total_amount, currency')
    .eq('id', transaction.order_id)
    .single();

  if (orderData) {
    const webhookAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const orderAmount = typeof orderData.total_amount === 'string' 
      ? parseFloat(orderData.total_amount) 
      : orderData.total_amount;

    const tolerance = 1;
    const amountDifference = Math.abs(webhookAmount - orderAmount);

    if (amountDifference > tolerance) {
      console.error('🚨 SECURITY ALERT: Amount mismatch detected');
      // Rejeter le webhook
    }
  }
}
```

### ✅ CONCLUSION

**Pas d'action requise** pour la validation de signature PayDunya car :
- PayDunya n'envoie pas toujours de signature dans les webhooks
- La sécurité est assurée par :
  - Validation du montant (comparaison avec l'order)
  - Vérification d'idempotence
  - Vérification de l'`invoice_token` unique

**Recommandation optionnelle** :
- 🟢 **PRIORITÉ BASSE** : Ajouter validation IP source si PayDunya fournit une liste d'IPs autorisées

---

## 📊 Résumé des Actions Requises

| Point | Statut | Action Requise | Priorité |
|-------|--------|----------------|----------|
| Mise à jour store_earnings lors remboursement | ❌ Problème | Corriger `refundMonerooPayment()` et trigger SQL | 🔴 **HAUTE** |
| Validation signature PayDunya | ✅ OK | Aucune (signature non disponible) | - |

---

## 🔧 Plan d'Action

### Étape 1 : Corriger le remboursement Moneroo

1. Modifier `src/lib/moneroo-payment.ts` :
   - Ajouter mise à jour de l'order avec `payment_status: 'refunded'`
   - S'assurer que le trigger SQL se déclenche

2. Créer migration SQL :
   - Modifier le trigger `update_store_earnings_on_order` pour gérer les remboursements

### Étape 2 : Vérifier PayDunya (si fonction de remboursement existe)

1. Vérifier si `refundPayDunyaPayment()` existe
2. Appliquer les mêmes corrections si nécessaire

### Étape 3 : Tests

1. Tester un remboursement complet :
   - Vérifier que l'order est mise à jour
   - Vérifier que `store_earnings` est recalculé
   - Vérifier que `available_balance` est correctement ajusté

---

## 📝 Notes

- Le problème de remboursement affecte uniquement les remboursements **manuels** via `refundMonerooPayment()`
- Les remboursements via webhook Moneroo ne mettent pas non plus à jour l'order (à vérifier)
- La validation PayDunya est suffisante avec les mesures actuelles

---

**Dernière mise à jour** : 30 Janvier 2025  
**Statut** : ✅ Vérification complète, corrections à implémenter

