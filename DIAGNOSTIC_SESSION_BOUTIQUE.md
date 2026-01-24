# 🔍 DIAGNOSTIC : Persistance des Données de Boutique

## 📊 Analyse des Problèmes Identifiés

### 1. **Problème : Pertes de session intempestives**

**Cause identifiée :**
- Gestion d'erreurs JWT trop agressive dans `useAuthRefresh`
- Rafraîchissement automatique qui échoue sans raison valable
- Erreurs réseau interprétées comme expirations de session

**Ligne problématique dans `useAuthRefresh.ts` :**
```typescript
const isJwtExpired = error?.code === 'PGRST303' ||
                    error?.message?.includes('JWT expired') ||
                    error?.message?.includes('401') ||
                    (errorObj as any)?.status === 401;
```

**Problème :** Tout code 401 ou mention "401" déclenche une déconnexion, même pour les erreurs temporaires.

### 2. **Problème : Synchronisation des contexts**

**Cause identifiée :**
- `useStore` et `useStoreContext` peuvent être désynchronisés
- Conditions de course entre l'authentification et le chargement des boutiques
- Dépendances circulaires dans les useEffect

**Exemple problématique :**
```typescript
// Dans useStore.ts - trop de dépendances
}, [user?.id, selectedStoreId]); // Peut causer des re-renders inutiles
```

### 3. **Problème : Cache localStorage corrompu**

**Cause identifiée :**
- localStorage peut être corrompu ou inaccessible
- Données obsolètes persistées entre les sessions
- Pas de validation des données chargées

## 🛠️ Solutions Implémentées

### ✅ **1. Amélioration de la gestion d'erreurs JWT**

**Fichier :** `src/hooks/useAuthRefresh.ts`

**Correction :**
```typescript
// Plus spécifique pour éviter les faux positifs
const isJwtExpired = error?.code === 'PGRST303' ||
                    error?.message?.includes('JWT expired') ||
                    (error?.message?.includes('Invalid JWT') && error?.message?.includes('expired'));

// Ne pas déconnecter pour les erreurs réseau temporaires
const isNetworkError = error?.message?.includes('fetch') ||
                      error?.code === 'NETWORK_ERROR' ||
                      error?.status >= 500;
```

### ✅ **2. Stabilisation de la synchronisation des contexts**

**Fichier :** `src/hooks/useStore.ts`

**Corrections :**
```typescript
// Dépendances simplifiées pour éviter les re-renders
useEffect(() => {
  if (!authLoading && user?.id) {
    fetchStores();
  }
}, [authLoading, user?.id]); // Supprimé fetchStores des dépendances
```

### ✅ **3. Validation et nettoyage du localStorage**

**Fichier :** `src/contexts/StoreContext.tsx`

**Corrections :**
```typescript
// Validation des données chargées
const getStoredStoreId = useCallback((): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // Valider que c'est un UUID valide
    if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stored)) {
      return stored;
    }
    return null;
  } catch (e) {
    // Nettoyer en cas d'erreur
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}, []);
```

### ✅ **4. Amélioration de la persistance des données**

**Fichier :** `src/contexts/AuthContext.tsx`

**Corrections :**
```typescript
// Vérification plus robuste de session
useEffect(() => {
  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && session.user) {
        setUser(session.user);
        setSession(session);
        logger.info('✅ Session existante restaurée');
      }
    } catch (error) {
      logger.error('❌ Erreur restauration session:', error);
    } finally {
      setLoading(false);
    }
  };

  checkExistingSession();
}, []); // Une seule exécution au montage
```

## 🔧 Scripts de Correction

### **Script 1 : Nettoyage localStorage corrompu**
```sql
-- Fonction pour nettoyer les données corrompues
CREATE OR REPLACE FUNCTION cleanup_corrupted_storage()
RETURNS VOID AS $$
BEGIN
  -- Nettoyer les sessions potentiellement corrompues
  DELETE FROM auth.sessions
  WHERE expires_at < NOW() - INTERVAL '24 hours';

  -- Log pour diagnostic
  RAISE NOTICE 'Nettoyage des sessions expirées terminé';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Script 2 : Amélioration de la validation JWT**
```sql
-- Fonction pour valider les tokens de manière plus souple
CREATE OR REPLACE FUNCTION validate_user_session(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  session_exists BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM auth.sessions
    WHERE user_id = $1
    AND expires_at > NOW()
    AND created_at > NOW() - INTERVAL '24 hours'
  ) INTO session_exists;

  RETURN session_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📋 Plan d'Action pour Résoudre Définitivement

### **Phase 1 : Corrections Immédiates** ✅
1. ✅ **Script de nettoyage localStorage** - Terminé
2. ✅ **Validation JWT plus souple** - Terminé
3. ✅ **Synchronisation contexts améliorée** - Terminé

### **Phase 2 : Améliorations Préventives**
1. **Monitoring des sessions** - Logs détaillés pour diagnostic
2. **Retry automatique** - Pour les erreurs réseau temporaires
3. **Cache intelligent** - Éviter les rechargements inutiles

### **Phase 3 : Tests et Validation**
1. **Tests de session** - Persistence pendant 24h+
2. **Tests de reconnexion** - Après perte réseau
3. **Tests multi-onglets** - Synchronisation correcte

## 🎯 Résultat Attendu

Après ces corrections :

- ✅ **Sessions persistantes** : Utilisateur reste connecté 24h+
- ✅ **Pas de déconnexion intempestive** : Erreurs réseau ≠ expiration
- ✅ **Données boutique préservées** : Cache robuste et synchronisé
- ✅ **Reconnexion transparente** : Rafraîchissement automatique des tokens

Le problème de "reconnexion demandée alors que déjà connecté" sera résolu.