# 📊 Système de tracking Analytics - Payhuk

## 🎯 Objectif

Remplacer les données simulées par un système réel de tracking des événements et statistiques des boutiques.

---

## 📋 ÉTAPE 1 : Créer les tables Supabase

### Table `store_analytics_events`

Cette table stockera tous les événements trackés (vues, clics, conversions, etc.)

```sql
-- Table des événements analytics
CREATE TABLE IF NOT EXISTS public.store_analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'page_view', 'product_view', 'add_to_cart', 'purchase', etc.
  event_data JSONB, -- Données supplémentaires de l'événement
  session_id TEXT, -- ID de session utilisateur
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index pour optimiser les requêtes
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'page_view',
    'store_view',
    'product_view',
    'product_click',
    'add_to_cart',
    'checkout_initiated',
    'purchase',
    'share',
    'search'
  ))
);

-- Index pour améliorer les performances
CREATE INDEX idx_store_analytics_events_store_id ON public.store_analytics_events(store_id);
CREATE INDEX idx_store_analytics_events_created_at ON public.store_analytics_events(created_at DESC);
CREATE INDEX idx_store_analytics_events_event_type ON public.store_analytics_events(event_type);
CREATE INDEX idx_store_analytics_events_session ON public.store_analytics_events(session_id);

-- Politique RLS
ALTER TABLE public.store_analytics_events ENABLE ROW LEVEL SECURITY;

-- Les propriétaires de boutique peuvent voir leurs analytics
CREATE POLICY "Propriétaires peuvent voir leurs analytics"
ON public.store_analytics_events
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);

-- Tout le monde peut créer des événements (tracking public)
CREATE POLICY "Tout le monde peut créer des événements"
ON public.store_analytics_events
FOR INSERT
TO public
WITH CHECK (true);
```

---

### Table `store_daily_stats`

Table agrégée pour stocker les statistiques quotidiennes (optimisation des requêtes)

```sql
-- Table des statistiques quotidiennes agrégées
CREATE TABLE IF NOT EXISTS public.store_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Métriques principales
  total_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  product_views INT DEFAULT 0,
  add_to_cart_count INT DEFAULT 0,
  checkout_initiated_count INT DEFAULT 0,
  purchases_count INT DEFAULT 0,
  revenue_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Métriques par device
  mobile_views INT DEFAULT 0,
  tablet_views INT DEFAULT 0,
  desktop_views INT DEFAULT 0,
  
  -- Métriques de sources
  direct_traffic INT DEFAULT 0,
  social_traffic INT DEFAULT 0,
  search_traffic INT DEFAULT 0,
  referral_traffic INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte d'unicité : une seule ligne par boutique par jour
  CONSTRAINT unique_store_date UNIQUE (store_id, date)
);

-- Index
CREATE INDEX idx_store_daily_stats_store_id ON public.store_daily_stats(store_id);
CREATE INDEX idx_store_daily_stats_date ON public.store_daily_stats(date DESC);

-- Politique RLS
ALTER TABLE public.store_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Propriétaires peuvent voir leurs stats quotidiennes"
ON public.store_daily_stats
FOR SELECT
TO authenticated
USING (
  store_id IN (
    SELECT id FROM public.stores WHERE user_id = auth.uid()
  )
);
```

---

### Fonction d'agrégation quotidienne

Cette fonction calcule les stats quotidiennes à partir des événements.

```sql
-- Fonction pour agréger les stats quotidiennes
CREATE OR REPLACE FUNCTION public.aggregate_daily_stats(
  target_store_id UUID,
  target_date DATE
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.store_daily_stats (
    store_id,
    date,
    total_views,
    unique_visitors,
    product_views,
    purchases_count,
    mobile_views,
    tablet_views,
    desktop_views
  )
  SELECT
    target_store_id,
    target_date,
    COUNT(*) FILTER (WHERE event_type IN ('page_view', 'store_view')),
    COUNT(DISTINCT session_id),
    COUNT(*) FILTER (WHERE event_type = 'product_view'),
    COUNT(*) FILTER (WHERE event_type = 'purchase'),
    COUNT(*) FILTER (WHERE device_type = 'mobile'),
    COUNT(*) FILTER (WHERE device_type = 'tablet'),
    COUNT(*) FILTER (WHERE device_type = 'desktop')
  FROM public.store_analytics_events
  WHERE store_id = target_store_id
    AND DATE(created_at) = target_date
  ON CONFLICT (store_id, date) DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_visitors = EXCLUDED.unique_visitors,
    product_views = EXCLUDED.product_views,
    purchases_count = EXCLUDED.purchases_count,
    mobile_views = EXCLUDED.mobile_views,
    tablet_views = EXCLUDED.tablet_views,
    desktop_views = EXCLUDED.desktop_views,
    updated_at = NOW();
END;
$$;
```

---

### Trigger automatique (optionnel)

Pour agréger automatiquement les stats toutes les nuits à minuit.

```sql
-- Fonction déclenchée par cron job (à configurer dans Supabase Dashboard > Database > Cron)
-- Extension pg_cron requise
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agrégation quotidienne à 1h du matin
SELECT cron.schedule(
  'aggregate-daily-stats',
  '0 1 * * *', -- Tous les jours à 1h du matin
  $$
  SELECT public.aggregate_daily_stats(
    s.id,
    CURRENT_DATE - INTERVAL '1 day'
  )
  FROM public.stores s;
  $$
);
```

---

## 📋 ÉTAPE 2 : Créer le hook de tracking

Fichier : `src/hooks/useAnalytics.ts`

```typescript
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export type AnalyticsEventType =
  | 'page_view'
  | 'store_view'
  | 'product_view'
  | 'product_click'
  | 'add_to_cart'
  | 'checkout_initiated'
  | 'purchase'
  | 'share'
  | 'search';

interface TrackEventParams {
  storeId: string;
  eventType: AnalyticsEventType;
  eventData?: Record<string, any>;
}

// Récupérer ou créer un session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Détecter le type d'appareil
const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const useAnalytics = (storeId?: string) => {
  /**
   * Tracker un événement
   */
  const trackEvent = useCallback(async ({
    storeId: eventStoreId,
    eventType,
    eventData = {}
  }: TrackEventParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('store_analytics_events').insert({
        store_id: eventStoreId,
        event_type: eventType,
        event_data: eventData,
        session_id: getSessionId(),
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        device_type: getDeviceType()
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }, []);

  /**
   * Tracker une vue de page
   */
  const trackPageView = useCallback((pageStoreId?: string) => {
    const targetStoreId = pageStoreId || storeId;
    if (!targetStoreId) return;

    trackEvent({
      storeId: targetStoreId,
      eventType: 'page_view',
      eventData: {
        path: window.location.pathname,
        title: document.title
      }
    });
  }, [storeId, trackEvent]);

  /**
   * Tracker automatiquement la vue de page au montage
   */
  useEffect(() => {
    if (storeId) {
      trackPageView();
    }
  }, [storeId, trackPageView]);

  return {
    trackEvent,
    trackPageView
  };
};
```

---

## 📋 ÉTAPE 3 : Utiliser le hook

### Dans la page publique de la boutique

```typescript
// src/pages/Storefront.tsx
import { useAnalytics } from '@/hooks/useAnalytics';

const Storefront = () => {
  const { slug } = useParams();
  const [store, setStore] = useState(null);
  
  // Initialiser analytics
  const { trackEvent } = useAnalytics(store?.id);
  
  // Tracker les vues de produits
  const handleProductClick = (productId: string) => {
    trackEvent({
      storeId: store.id,
      eventType: 'product_view',
      eventData: { product_id: productId }
    });
  };
  
  return (
    // ... JSX
  );
};
```

---

## 📋 ÉTAPE 4 : Modifier StoreAnalytics.tsx

Remplacer les données simulées par de vraies requêtes.

```typescript
// src/components/store/StoreAnalytics.tsx
const fetchRealAnalytics = async () => {
  // Récupérer les stats quotidiennes des 30 derniers jours
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data: dailyStats } = await supabase
    .from('store_daily_stats')
    .select('*')
    .eq('store_id', storeId)
    .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('date', { ascending: false });
  
  // Calculer les totaux
  const totalViews = dailyStats?.reduce((sum, day) => sum + day.total_views, 0) || 0;
  const uniqueVisitors = dailyStats?.reduce((sum, day) => sum + day.unique_visitors, 0) || 0;
  
  // ... etc
};
```

---

## ✅ Checklist d'implémentation

- [ ] Créer les tables dans Supabase
- [ ] Configurer les politiques RLS
- [ ] Créer la fonction d'agrégation
- [ ] (Optionnel) Configurer le cron job
- [ ] Créer le hook `useAnalytics`
- [ ] Intégrer dans la page Storefront
- [ ] Modifier StoreAnalytics pour utiliser les vraies données
- [ ] Tester le tracking en dev
- [ ] Vérifier les données dans Supabase

---

## 📊 Événements à tracker

| Événement | Où | Quand |
|-----------|-----|-------|
| `store_view` | Storefront | Au chargement de la boutique |
| `product_view` | ProductDetail | Ouverture d'un produit |
| `product_click` | Storefront | Clic sur un produit |
| `add_to_cart` | ProductDetail | Ajout au panier |
| `checkout_initiated` | Checkout | Démarrage du checkout |
| `purchase` | OrderConfirmation | Commande validée |
| `share` | Storefront | Partage sur réseaux sociaux |
| `search` | Storefront | Recherche de produit |

---

## 🔐 Sécurité et vie privée

- ✅ Pas de stockage de données personnelles sensibles
- ✅ IP hashées (optionnel) : `MD5(ip_address::text)`
- ✅ Conformité RGPD : ajouter un système de consentement
- ✅ Anonymisation après 90 jours (optionnel)

---

## 📈 Optimisations

1. **Agrégation quotidienne** : Réduit les requêtes lourdes
2. **Index sur les dates** : Requêtes rapides
3. **Partitionnement** : Pour de gros volumes (> 1M events)
4. **Caching Redis** : Pour les stats en temps réel

---

**Prêt à implémenter !** 🚀

