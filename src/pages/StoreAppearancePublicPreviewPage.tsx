import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StoreSlugProvider } from '@/contexts/StoreSlugContext';
import Storefront from '@/pages/Storefront';
import {
  mergeStorePreviewDraft,
  readStorePreviewDraft,
  STORE_PREVIEW_CHANNEL,
} from '@/lib/storefront/store-preview-draft';
import { STOREFRONT_STORE_PUBLIC_SELECT } from '@/lib/storefront/store-public-fields';
import type { Store } from '@/hooks/useStores';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Aperçu WYSIWYG boutique sans authentification.
 * Le brouillon d'apparence est lu depuis localStorage (partagé entre onglets).
 */
export default function StoreAppearancePublicPreviewPage() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const slugParam = searchParams.get('slug');
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId?.trim()) {
      setError('Paramètre storeId manquant.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const applyDraftOnly = () => {
      if (cancelled) return;
      setStore(prev => {
        if (!prev) return prev;
        return mergeStorePreviewDraft(prev, readStorePreviewDraft(storeId));
      });
    };

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('stores_public').select(STOREFRONT_STORE_PUBLIC_SELECT);

        if (slugParam?.trim()) {
          query = query.eq('slug', slugParam.trim());
        } else {
          query = query.eq('id', storeId);
        }

        const { data, error: fetchError } = await query.limit(1).maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data || data.id !== storeId) {
          throw new Error('Boutique introuvable ou identifiants invalides.');
        }

        const draft = readStorePreviewDraft(storeId);
        const merged = mergeStorePreviewDraft(data as Store, draft);

        if (!cancelled) {
          setStore(merged);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Impossible de charger la prévisualisation.'
          );
          setStore(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith('emarzona:store-preview:')) {
        applyDraftOnly();
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(STORE_PREVIEW_CHANNEL);
      channel.onmessage = event => {
        if (event.data?.type === 'draft-updated' && event.data?.storeId === storeId) {
          applyDraftOnly();
        }
      };
    } catch {
      channel = null;
    }

    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, [storeId, slugParam]);

  const previewStore = useMemo(() => store, [store]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !previewStore?.slug) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Boutique introuvable.'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <StoreSlugProvider slug={previewStore.slug}>
      <Storefront previewMode storeOverride={previewStore} />
    </StoreSlugProvider>
  );
}
