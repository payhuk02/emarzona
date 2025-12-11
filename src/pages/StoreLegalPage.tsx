/**
 * StoreLegalPage Component
 * Affiche une page légale spécifique (CGV, politique de confidentialité, etc.)
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StoreThemeProvider } from '@/components/storefront/StoreThemeProvider';
import StoreHeader from '@/components/storefront/StoreHeader';
import StoreFooter from '@/components/storefront/StoreFooter';
import { useStoreTheme } from '@/hooks/useStoreTheme';
import type { Store, StoreLegalPages } from '@/hooks/useStores';
import { logger } from '@/lib/logger';

const LEGAL_PAGE_TITLES: Record<string, string> = {
  terms: 'Conditions générales de vente',
  privacy: 'Politique de confidentialité',
  returns: 'Politique de retour',
  shipping: 'Politique de livraison',
  refund: 'Politique de remboursement',
  cookies: 'Politique des cookies',
  faq: 'FAQ',
};

const LEGAL_PAGE_KEYS: Record<string, keyof StoreLegalPages> = {
  terms: 'terms_of_service',
  privacy: 'privacy_policy',
  returns: 'return_policy',
  shipping: 'shipping_policy',
  refund: 'refund_policy',
  cookies: 'cookie_policy',
  faq: 'faq_content',
};

export const StoreLegalPage = () => {
  const { slug, page } = useParams<{ slug: string; page: string }>();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [legalContent, setLegalContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>('');

  const theme = useStoreTheme(store);

  useEffect(() => {
    if (!slug || !page) {
      setError('Paramètres manquants');
      setLoading(false);
      return;
    }

    const pageKey = LEGAL_PAGE_KEYS[page];
    if (!pageKey) {
      setError('Page légale introuvable');
      setLoading(false);
      return;
    }

    setPageTitle(LEGAL_PAGE_TITLES[page] || 'Page légale');

    const fetchStore = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('stores')
          .select('*')
          .eq('slug', slug)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          const storeData: Store = {
            ...data,
            domain_status: data.domain_status || undefined,
          } as Store;

          setStore(storeData);

          // Extraire le contenu de la page légale
          const legalPages = storeData.legal_pages as StoreLegalPages | null;
          if (legalPages && legalPages[pageKey]) {
            setLegalContent(legalPages[pageKey] || null);
          } else {
            setError('Cette page légale n\'est pas disponible');
          }
        } else {
          setError('Boutique introuvable');
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Impossible de charger la page légale. Veuillez réessayer plus tard.';
        logger.error('Erreur lors du chargement de la page légale:', {
          error: errorMessage,
          slug,
          page,
        });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [slug, page]);

  if (loading) {
    return (
      <StoreThemeProvider store={null}>
        <div className="min-h-screen">
          <Skeleton className="h-48 w-full" />
          <div className="max-w-4xl mx-auto px-4 py-8">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </StoreThemeProvider>
    );
  }

  if (error || !store || !legalContent) {
    return (
      <StoreThemeProvider store={store}>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md mx-auto px-4">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-2">Page introuvable</h1>
            <p className="text-muted-foreground mb-6">{error || 'Cette page légale n\'est pas disponible.'}</p>
            {store && (
              <Button onClick={() => navigate(`/stores/${store.slug}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à la boutique
              </Button>
            )}
          </div>
        </div>
      </StoreThemeProvider>
    );
  }

  return (
    <StoreThemeProvider store={store}>
      <div className="min-h-screen flex flex-col store-theme-active" style={{ backgroundColor: store.background_color || undefined }}>
        {store && (
          <StoreHeader
            store={
              {
                ...store,
                description: store.description ?? null,
              } as unknown as import('@/hooks/useStore').Store & {
                logo_url?: string;
                banner_url?: string;
                active_clients?: number;
                is_verified?: boolean;
                info_message?: string | null;
                info_message_color?: string | null;
                info_message_font?: string | null;
              }
            }
          />
        )}

        <main className="flex-1 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Button
              variant="ghost"
              onClick={() => navigate(`/stores/${store.slug}`)}
              className="mb-6"
              style={{ color: theme.linkColor }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la boutique
            </Button>

            <Card className="animate-fade-in">
              <CardContent className="pt-6">
                <h1
                  className="text-2xl sm:text-3xl font-bold mb-6"
                  style={{
                    color: theme.textColor,
                    fontFamily: theme.headingFont,
                  }}
                >
                  {pageTitle}
                </h1>
                <div
                  className="prose prose-sm sm:prose max-w-none"
                  style={{
                    color: theme.textColor,
                    fontFamily: theme.bodyFont,
                  }}
                >
                  <div
                    className="whitespace-pre-wrap"
                    style={{
                      color: theme.textColor,
                      fontFamily: theme.bodyFont,
                      lineHeight: theme.lineHeight,
                    }}
                  >
                    {legalContent}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {store && (
          <StoreFooter
            storeName={store.name}
            facebook_url={store.facebook_url || undefined}
            instagram_url={store.instagram_url || undefined}
            twitter_url={store.twitter_url || undefined}
            linkedin_url={store.linkedin_url || undefined}
            youtube_url={store.youtube_url || undefined}
            tiktok_url={store.tiktok_url || undefined}
            pinterest_url={store.pinterest_url || undefined}
            snapchat_url={store.snapchat_url || undefined}
            discord_url={store.discord_url || undefined}
            twitch_url={store.twitch_url || undefined}
            store={store}
            storeSlug={store.slug}
          />
        )}
      </div>
    </StoreThemeProvider>
  );
};

export default StoreLegalPage;

