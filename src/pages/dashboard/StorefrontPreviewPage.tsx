import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { StoreSlugProvider } from '@/contexts/StoreSlugContext';
import Storefront from '@/pages/Storefront';
import {
  mergeStorePreviewDraft,
  readStorePreviewDraft,
  STORE_PREVIEW_CHANNEL,
} from '@/lib/storefront/store-preview-draft';
import {
  flattenStoreWithAppearance,
  STORE_APPEARANCE_EMBED_SELECT,
} from '@/lib/storefront/flatten-store-appearance';
import type { Store } from '@/hooks/useStores';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StorefrontPreviewPage() {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const { user, loading: authLoading } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId || authLoading) {
      return;
    }

    if (!user?.id) {
      setError('Connexion requise pour prévisualiser votre boutique.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('stores')
          .select(
            `id, user_id, name, slug, subdomain, description, is_active, ${STORE_APPEARANCE_EMBED_SELECT}`
          )
          .eq('id', storeId)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error('Boutique introuvable ou accès refusé.');
        }

        const row = flattenStoreWithAppearance(data as Record<string, unknown>) as Store & {
          user_id?: string;
        };
        if (row.user_id !== user.id) {
          const { data: canView } = await supabase.rpc('has_store_permission', {
            _store_id: storeId,
            _user_id: user.id,
            _permission: 'products.view',
          });
          if (!canView) {
            throw new Error('Vous n’avez pas accès à la prévisualisation de cette boutique.');
          }
        }

        const draft = readStorePreviewDraft(storeId);
        const merged = mergeStorePreviewDraft(row, draft);

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

    const applyDraftOnly = () => {
      if (!storeId || cancelled) return;
      setStore(prev => {
        if (!prev) return prev;
        return mergeStorePreviewDraft(prev, readStorePreviewDraft(storeId));
      });
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
  }, [storeId, user?.id, authLoading]);

  const previewStore = useMemo(() => store, [store]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeId || error || !previewStore?.slug) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Paramètre storeId manquant.'}</AlertDescription>
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
