# 🚀 DÉPLOIEMENT EDGE FUNCTION API PUBLIQUE

## 📋 Date : 28 Janvier 2025

### Prérequis
- ✅ Supabase CLI installé
- ✅ Projet Supabase initialisé
- ✅ Migration SQL `20250228_api_keys_table.sql` appliquée

---

## 📝 ÉTAPES DE DÉPLOIEMENT

### 1. Appliquer la Migration SQL

Exécuter la migration dans Supabase SQL Editor :

```sql
-- Fichier : supabase/migrations/20250228_api_keys_table.sql
```

Ou via CLI :
```bash
supabase db push
```

### 2. Déployer l'Edge Function

```bash
# Depuis la racine du projet
supabase functions deploy api/v1
```

### 3. Vérifier le Déploiement

L'Edge Function sera accessible à :
```
https://[PROJECT_REF].supabase.co/functions/v1/api/v1
```

### 4. Tester l'API

#### Créer une clé API (via SQL ou interface)

```sql
SELECT * FROM create_api_key(
  p_user_id := auth.uid(),
  p_store_id := 'VOTRE_STORE_ID',
  p_name := 'Ma clé API',
  p_description := 'Clé pour intégration externe'
);
```

⚠️ **Important** : La clé retournée ne sera affichée qu'une seule fois. Sauvegardez-la !

#### Tester avec curl

```bash
curl -X GET \
  'https://[PROJECT_REF].supabase.co/functions/v1/api/v1/products' \
  -H 'Authorization: Bearer pk_live_VOTRE_CLE_API'
```

---

## 🔐 SÉCURITÉ

- ✅ Clés API hashées (SHA-256)
- ✅ RLS activé sur la table `api_keys`
- ✅ Vérification via fonction SQL sécurisée
- ✅ Isolation par `store_id`
- ✅ Support des permissions (JSONB)

---

## 📊 ENDPOINTS DISPONIBLES

### Produits
- `GET /api/v1/products` - Liste des produits
- `GET /api/v1/products/:id` - Détails d'un produit
- `POST /api/v1/products` - Créer un produit
- `PUT /api/v1/products/:id` - Mettre à jour un produit
- `DELETE /api/v1/products/:id` - Supprimer un produit

### Commandes
- `GET /api/v1/orders` - Liste des commandes
- `GET /api/v1/orders/:id` - Détails d'une commande
- `POST /api/v1/orders` - Créer une commande

### Clients
- `GET /api/v1/customers` - Liste des clients
- `GET /api/v1/customers/:id` - Détails d'un client
- `POST /api/v1/customers` - Créer un client

### Analytics (À implémenter)
- `GET /api/v1/analytics` - Analytics de la boutique

### Export/Import (À implémenter)
- `GET /api/v1/export` - Exporter des données
- `POST /api/v1/import` - Importer des données

---

## 🛠️ MAINTENANCE

### Révoquer une clé API

```sql
UPDATE api_keys
SET is_active = false
WHERE id = 'KEY_ID';
```

### Voir les clés API actives

```sql
SELECT 
  id,
  name,
  key_prefix,
  store_id,
  last_used_at,
  created_at
FROM api_keys
WHERE user_id = auth.uid()
  AND is_active = true;
```

---

## ✅ VÉRIFICATION

Après déploiement, vérifier :
1. ✅ La fonction est accessible
2. ✅ L'authentification fonctionne
3. ✅ Les endpoints retournent des données
4. ✅ L'isolation par `store_id` fonctionne
5. ✅ Les erreurs sont gérées correctement

---

**Date** : 28 Janvier 2025  
**Version** : 1.0.0

