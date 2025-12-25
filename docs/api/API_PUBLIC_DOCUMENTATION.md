# 📚 API Publique Payhuk - Documentation Complète

**Version** : 1.0.0  
**Date** : 28 Janvier 2025  
**Base URL** : `https://api.payhuk.com/v1`

---

## 🔐 Authentification

Toutes les requêtes à l'API nécessitent une clé API dans les en-têtes :

```http
Authorization: Bearer YOUR_API_KEY
```

### Obtenir une clé API

1. Connectez-vous à votre compte Payhuk
2. Allez dans **Paramètres** > **API**
3. Créez une nouvelle clé API
4. Copiez la clé (elle ne sera affichée qu'une seule fois)

---

## 📦 Produits

### Liste des produits

```http
GET /products
```

**Paramètres de requête** :
- `store_id` (string, requis) : ID de la boutique
- `type` (string, optionnel) : Type de produit (`digital`, `physical`, `service`, `course`, `artist`)
- `category` (string, optionnel) : Catégorie
- `page` (number, optionnel) : Numéro de page (défaut: 1)
- `limit` (number, optionnel) : Nombre d'éléments par page (défaut: 20)
- `search` (string, optionnel) : Recherche par nom/description

**Réponse** :
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Nom du produit",
      "description": "Description",
      "price": 10000,
      "currency": "XOF",
      "product_type": "digital",
      "is_active": true,
      "created_at": "2025-01-28T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

### Détails d'un produit

```http
GET /products/:id
```

**Réponse** :
```json
{
  "id": "uuid",
  "name": "Nom du produit",
  "description": "Description complète",
  "short_description": "Description courte",
  "price": 10000,
  "currency": "XOF",
  "product_type": "digital",
  "category": "ebook",
  "tags": ["tag1", "tag2"],
  "is_active": true,
  "images": ["url1", "url2"],
  "created_at": "2025-01-28T00:00:00Z",
  "updated_at": "2025-01-28T00:00:00Z"
}
```

### Créer un produit

```http
POST /products
```

**Body** :
```json
{
  "store_id": "uuid",
  "name": "Nom du produit",
  "description": "Description",
  "price": 10000,
  "currency": "XOF",
  "product_type": "digital",
  "category": "ebook",
  "tags": ["tag1", "tag2"]
}
```

**Réponse** :
```json
{
  "id": "uuid",
  "name": "Nom du produit",
  "created_at": "2025-01-28T00:00:00Z"
}
```

### Mettre à jour un produit

```http
PUT /products/:id
```

**Body** : Même format que la création

### Supprimer un produit

```http
DELETE /products/:id
```

---

## 🛒 Commandes

### Liste des commandes

```http
GET /orders
```

**Paramètres** :
- `store_id` (string, requis)
- `status` (string, optionnel) : `pending`, `completed`, `cancelled`
- `customer_id` (string, optionnel)
- `page` (number, optionnel)
- `limit` (number, optionnel)
- `start_date` (string, optionnel) : Format ISO
- `end_date` (string, optionnel) : Format ISO

**Réponse** :
```json
{
  "data": [
    {
      "id": "uuid",
      "order_number": "ORD-20250128-0001",
      "customer_id": "uuid",
      "total_amount": 10000,
      "currency": "XOF",
      "status": "completed",
      "created_at": "2025-01-28T00:00:00Z",
      "items": [
        {
          "product_id": "uuid",
          "product_name": "Nom du produit",
          "quantity": 1,
          "price": 10000
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

### Détails d'une commande

```http
GET /orders/:id
```

### Créer une commande

```http
POST /orders
```

**Body** :
```json
{
  "store_id": "uuid",
  "customer_id": "uuid",
  "items": [
    {
      "product_id": "uuid",
      "quantity": 1
    }
  ],
  "shipping_address": {
    "name": "Nom",
    "address": "Adresse",
    "city": "Ville",
    "country": "Pays"
  }
}
```

---

## 👥 Clients

### Liste des clients

```http
GET /customers
```

**Paramètres** :
- `store_id` (string, requis)
- `page` (number, optionnel)
- `limit` (number, optionnel)
- `search` (string, optionnel)

### Détails d'un client

```http
GET /customers/:id
```

### Créer un client

```http
POST /customers
```

**Body** :
```json
{
  "store_id": "uuid",
  "name": "Nom du client",
  "email": "email@example.com",
  "phone": "+221771234567"
}
```

---

## 📊 Analytics

### Analytics unifié

```http
GET /analytics
```

**Paramètres** :
- `store_id` (string, requis)
- `time_range` (string, optionnel) : `7d`, `30d`, `90d`, `1y`, `all` (défaut: `30d`)

**Réponse** :
```json
{
  "overview": {
    "total_revenue": 1000000,
    "total_orders": 50,
    "total_customers": 30,
    "average_order_value": 20000,
    "conversion_rate": 2.5,
    "growth_rate": 15.5
  },
  "by_product_type": {
    "digital": {
      "revenue": 500000,
      "orders": 25,
      "units": 25,
      "average_price": 20000,
      "growth": 10.5
    },
    "physical": {
      "revenue": 300000,
      "orders": 15,
      "units": 15,
      "average_price": 20000,
      "growth": 5.2
    }
  },
  "top_products": [...],
  "top_customers": [...],
  "revenue_over_time": [...],
  "trends": {
    "revenue_trend": "up",
    "order_trend": "up",
    "customer_trend": "stable",
    "revenue_growth": 15.5,
    "order_growth": 10.2,
    "customer_growth": 5.0
  }
}
```

### Analytics par produit

```http
GET /analytics/products/:id
```

---

## 🔔 Webhooks

### Liste des webhooks

```http
GET /webhooks
```

### Créer un webhook

```http
POST /webhooks
```

**Body** :
```json
{
  "store_id": "uuid",
  "url": "https://example.com/webhook",
  "events": ["order.created", "order.completed", "product.updated"],
  "secret": "your-secret-key"
}
```

### Mettre à jour un webhook

```http
PUT /webhooks/:id
```

### Supprimer un webhook

```http
DELETE /webhooks/:id
```

### Événements disponibles

- `order.created` : Nouvelle commande créée
- `order.completed` : Commande complétée
- `order.cancelled` : Commande annulée
- `order.payment_received` : Paiement reçu
- `product.created` : Produit créé
- `product.updated` : Produit mis à jour
- `product.deleted` : Produit supprimé
- `customer.created` : Client créé
- `customer.updated` : Client mis à jour

---

## 📥 Import/Export

### Exporter des données

```http
GET /export
```

**Paramètres** :
- `store_id` (string, requis)
- `type` (string, requis) : `products`, `orders`, `customers`
- `format` (string, optionnel) : `csv`, `json` (défaut: `csv`)
- `start_date` (string, optionnel)
- `end_date` (string, optionnel)

**Réponse** : Fichier CSV ou JSON

### Importer des données

```http
POST /import
```

**Body** (multipart/form-data) :
- `file` : Fichier CSV ou JSON
- `type` : `products`, `orders`, `customers`
- `store_id` : ID de la boutique

**Réponse** :
```json
{
  "success": true,
  "imported": 100,
  "failed": 5,
  "errors": [
    {
      "row": 10,
      "error": "Invalid price format"
    }
  ]
}
```

---

## ⚠️ Codes d'erreur

| Code | Description |
|------|-------------|
| 200 | Succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Ressource non trouvée |
| 429 | Trop de requêtes (rate limit) |
| 500 | Erreur serveur |

---

## 🔄 Rate Limiting

- **Limite** : 1000 requêtes par heure par clé API
- **Headers** :
  - `X-RateLimit-Limit` : Limite totale
  - `X-RateLimit-Remaining` : Requêtes restantes
  - `X-RateLimit-Reset` : Timestamp de réinitialisation

---

## 📝 Exemples

### JavaScript (Fetch)

```javascript
const API_KEY = 'your-api-key';
const BASE_URL = 'https://api.payhuk.com/v1';

async function getProducts(storeId) {
  const response = await fetch(`${BASE_URL}/products?store_id=${storeId}`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

### Python (Requests)

```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'https://api.payhuk.com/v1'

def get_products(store_id):
    response = requests.get(
        f'{BASE_URL}/products',
        params={'store_id': store_id},
        headers={'Authorization': f'Bearer {API_KEY}'}
    )
    return response.json()
```

---

## 🔗 Liens utiles

- **Documentation interactive** : https://docs.payhuk.com
- **SDK JavaScript** : https://github.com/payhuk/js-sdk
- **SDK Python** : https://github.com/payhuk/python-sdk
- **Support** : support@payhuk.com

---

**Dernière mise à jour** : 28 Janvier 2025

