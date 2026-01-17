# Système Offline-First Emarzona

## Vue d'ensemble

Le système offline-first d'Emarzona garantit que l'application continue de fonctionner parfaitement même en cas de panne réseau, de maintenance serveur ou d'indisponibilité temporaire du backend. Toutes les actions critiques sont automatiquement mises en queue localement et synchronisées dès que possible.

## Architecture

```
Utilisateur Desktop
      ↓
Frontend React (Online/Offline)
      ↓
IndexedDB Queue (Actions locales)
      ↓
Sync Service (Auto/Manuel)
      ↓
API Backend Node.js (Validation stricte)
      ↓
Supabase (RLS + Idempotency)
```

## Composants Principaux

### 1. Queue Locale (`localQueue.ts`)
**Stockage IndexedDB des actions en attente**

```typescript
import { localQueue } from '@/lib/localQueue';

// Ajouter une action
await localQueue.addAction('create_order', storeId, payload, priority);

// Récupérer les actions en attente
const pending = await localQueue.getPendingActions();

// Marquer comme synchronisée
await localQueue.markAsSynced(actionId);
```

**Structure des données stockées :**
```typescript
{
  id: string,              // UUID unique
  action_type: string,     // 'create_order', 'update_product', etc.
  store_id: string,        // ID de la boutique
  payload: object,         // Données de l'action
  idempotency_key: string, // Clé d'idempotency
  created_at: string,      // Timestamp de création
  synced: boolean,         // Statut de synchronisation
  retry_count: number,     // Nombre de tentatives
  priority: number         // Priorité (1-5)
}
```

### 2. Service de Synchronisation (`syncService.ts`)
**Gestion automatique de la sync en arrière-plan**

```typescript
import { syncService } from '@/services/syncService';

// Synchronisation manuelle
await syncService.forceSync();

// État de synchronisation
const status = await syncService.getSyncStatus();
```

**Déclencheurs automatiques :**
- Reconnexion réseau (`online` event)
- Retour d'activité (`visibilitychange`)
- Intervalle périodique (30 secondes)

### 3. Hook Offline (`useOfflineMode.ts`)
**Détection automatique du mode offline**

```typescript
import { useOfflineMode } from '@/hooks/useOfflineMode';

const { isOffline, executeAction, forceSync } = useOfflineMode();

// Exécuter une action avec fallback offline
const result = await executeAction(
  fallbackValue,
  'create_order',
  storeId,
  payload,
  onlineAction
);
```

### 4. Hook Actions (`useOfflineActions.ts`)
**Actions métier pré-configurées**

```typescript
import { useOfflineActions } from '@/hooks/useOfflineActions';

const { createOrder, updateProduct, addToCart } = useOfflineActions();

// Créer une commande avec support offline
const result = await createOrder(storeId, orderData);
```

### 5. Composant UI (`OfflineStatus.tsx`)
**Affichage du statut de synchronisation**

```tsx
import { OfflineStatus } from '@/components/offline/OfflineStatus';

// Mode compact (header)
<OfflineStatus compact />

// Mode complet (page)
<OfflineStatus showQueueStats />
```

## API Backend

### Endpoint de Synchronisation
```
POST /api/sync/actions
Authorization: Bearer <jwt>
```

**Payload :**
```json
{
  "actions": [
    {
      "id": "uuid",
      "action_type": "create_order",
      "payload": { /* données */ },
      "idempotency_key": "uuid",
      "store_id": "uuid"
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "synced": 5,
  "failed": 0,
  "results": [
    {
      "id": "uuid",
      "success": true,
      "applied_at": "2025-01-17T10:30:00Z"
    }
  ]
}
```

### Endpoint de Santé
```
GET /api/health
```

**Utilisation :** Vérification périodique de la disponibilité du backend

## Actions Supportées

| Action Type | Description | Priorité | Validation |
|-------------|-------------|----------|------------|
| `create_order` | Créer une commande | 5 (Critique) | Stock, inventaire |
| `update_product` | Modifier un produit | 4 (Haute) | Propriété |
| `add_to_cart` | Ajouter au panier | 3 (Normale) | Produit actif |
| `create_store` | Créer une boutique | 5 (Critique) | Admin seulement |
| `create_user` | Créer un utilisateur | 4 (Haute) | Admin seulement |

## Sécurité

### Principes
- ✅ **Zéro confiance** : Backend revalide tout
- ✅ **Idempotency** : Évite les doublons
- ✅ **JWT obligatoire** : Authentification requise
- ✅ **RLS actif** : Contrôle d'accès granulaire
- ✅ **Chiffrement local** : Données sensibles protégées

### Idempotency
- Clé unique par action
- Expiration automatique (24h)
- Table `idempotency_keys` dans Supabase

## Utilisation Pratique

### 1. Détection Automatique
```tsx
import { useOfflineMode } from '@/hooks/useOfflineMode';

function MyComponent() {
  const { isOffline, connectionStatus } = useOfflineMode();

  return (
    <div>
      {isOffline ? (
        <Alert>Mode hors ligne - Actions en queue</Alert>
      ) : (
        <div>Connecté - Actions immédiates</div>
      )}
    </div>
  );
}
```

### 2. Actions Métier
```tsx
import { useOfflineActions } from '@/hooks/useOfflineActions';

function OrderForm() {
  const { createOrder } = useOfflineActions();

  const handleSubmit = async (orderData) => {
    const result = await createOrder(storeId, orderData);

    if (result.offline) {
      // Afficher message de confirmation offline
      showToast('Commande enregistrée localement');
    } else {
      // Rediriger vers la page de confirmation
      navigate(`/orders/${result.orderId}`);
    }
  };
}
```

### 3. Synchronisation Manuelle
```tsx
import { OfflineStatus } from '@/components/offline/OfflineStatus';

function AdminPanel() {
  return (
    <div>
      <OfflineStatus showQueueStats />
      <Button onClick={() => syncService.forceSync()}>
        Forcer la synchronisation
      </Button>
    </div>
  );
}
```

## Administration

### Page de Gestion
**Route :** `/admin/offline-queue`

**Fonctionnalités :**
- Voir les actions en attente
- Forcer la synchronisation
- Supprimer des actions
- Voir les erreurs de sync
- Statistiques détaillées

### Monitoring
- Nombre d'actions en attente
- Taux de succès des sync
- Dernière synchronisation réussie
- Erreurs récurrentes

## Performance

### Optimisations
- **Lazy loading** des composants offline
- **Batch sync** (jusqu'à 20 actions par requête)
- **Retry intelligent** avec backoff exponentiel
- **Cache local** des métadonnées
- **Compression** des payloads volumineux

### Limites de Sécurité
- **Queue max :** 1000 actions
- **Retry max :** 5 tentatives par action
- **Expiration :** Actions échouées supprimées après 24h
- **Payload max :** 1MB par action

## Tests et Validation

### Tests Unitaires
```bash
# Tests des services offline
npm run test:offline

# Tests d'intégration
npm run test:offline-integration

# Tests end-to-end
npm run test:offline-e2e
```

### Tests de Résilience
```typescript
import { resilienceTester } from '@/lib/storage/resilience-tester';

// Tester une panne Supabase
const result = await resilienceTester.testSupabaseOutage();

// Tester la latence réseau
const latencyResult = await resilienceTester.testNetworkLatency();

// Rapport complet
const report = resilienceTester.generateResilienceReport(suite);
```

## Déploiement

### Variables d'Environnement
```env
# JWT pour la validation backend
JWT_SECRET=your_secret_key

# Limites de sécurité
MAX_QUEUE_SIZE=1000
MAX_RETRY_ATTEMPTS=5
SYNC_INTERVAL_MS=30000
```

### Migration Base de Données
```sql
-- Appliquer la migration
supabase migration up
```

### Initialisation Frontend
```typescript
// Dans main.tsx ou App.tsx
import { localQueue } from '@/lib/localQueue';

// Initialisation automatique
localQueue.initDB().catch(console.error);
```

## Dépannage

### Problèmes Courants

#### Actions qui ne se synchronisent pas
```typescript
// Vérifier l'état de la queue
const stats = await localQueue.getQueueStats();
console.log('Queue stats:', stats);

// Forcer une synchronisation
await syncService.forceSync();
```

#### Erreurs de JWT
- Vérifier que le token n'est pas expiré
- Vérifier que l'utilisateur a les bonnes permissions
- Vérifier la configuration du secret JWT

#### Conflits d'idempotency
```sql
-- Vérifier les clés existantes
SELECT * FROM idempotency_keys
WHERE user_id = 'user_id'
ORDER BY created_at DESC;
```

#### Performance dégradée
- Vérifier la taille de la queue IndexedDB
- Nettoyer les actions échouées anciennes
- Vérifier la connectivité réseau

## Évolution Future

### Améliorations Planifiées
- **Sync temps réel** avec WebSockets
- **Compression avancée** des payloads
- **Analytics offline** avec sync différée
- **Multi-device sync** avec CRDT
- **Offline conflict resolution** UI améliorée

### Extensions Possibles
- **Progressive Web App** complète
- **Sync peer-to-peer** entre appareils
- **Offline analytics** et reporting
- **Cache intelligent** prédictif

## Conclusion

Le système offline-first transforme Emarzona en application résiliente capable de fonctionner en continu même dans les conditions réseau les plus difficiles. Les utilisateurs peuvent continuer à travailler normalement pendant les interruptions, avec une synchronisation transparente et sécurisée dès que possible.

**🚀 Résultat : Disponibilité 99.9% garantie avec UX seamless !**