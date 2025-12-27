/**
 * Composant pour générer et télécharger le sitemap XML d'une boutique
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Loader2 } from 'lucide-react';
import { generateStoreSitemap, downloadSitemap } from '@/lib/sitemap-generator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { Store } from '@/hooks/useStores';

interface StoreSitemapGeneratorProps {
  store: Store;
}

export const StoreSitemapGenerator = ({ store }: StoreSitemapGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    try {
      // Récupérer les produits actifs de la boutique
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('store_id', store.id)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (productsError) {
        throw productsError;
      }

      // Déterminer l'URL de base
      const baseUrl = window.location.origin;
      const storeUrl = store.custom_domain 
        ? (store.ssl_enabled ? `https://${store.custom_domain}` : `http://${store.custom_domain}`)
        : undefined;

      // Pages additionnelles à inclure
      const  includePages: string[] = [];
      
      // Ajouter les pages légales si disponibles
      if (store.legal_pages) {
        const legalPages = Object.keys(store.legal_pages).filter(key => 
          store.legal_pages?.[key as keyof typeof store.legal_pages]
        );
        legalPages.forEach(page => {
          includePages.push(`/legal/${page}`);
        });
      }

      // Générer le sitemap
      const sitemapXml = generateStoreSitemap({
        baseUrl,
        storeSlug: store.slug,
        storeUrl,
        products: products || [],
        includePages
      });

      // Télécharger le sitemap
      const filename = `sitemap-${store.slug}.xml`;
      downloadSitemap(sitemapXml, filename);

      toast({
        title: 'Sitemap généré',
        description: `Le sitemap a été téléchargé avec ${(products?.length || 0) + 1 + includePages.length} URLs.`,
      });
    } catch ( _error: unknown) {
      logger.error('Error generating sitemap', { error, storeId: store.id });
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le sitemap. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Sitemap XML
        </CardTitle>
        <CardDescription>
          Générez et téléchargez le sitemap XML de votre boutique pour améliorer le référencement
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Un sitemap XML aide les moteurs de recherche à découvrir et indexer toutes les pages de votre boutique.
            Il inclut automatiquement votre page d'accueil, tous vos produits actifs et vos pages légales.
          </p>

          <Button
            onClick={handleGenerateSitemap}
            disabled={generating}
            className="w-full sm:w-auto"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Générer et télécharger le sitemap
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Astuce :</strong> Après téléchargement, soumettez votre sitemap à Google Search Console.</p>
            <p>📝 Le fichier sitemap.xml doit être placé à la racine de votre domaine ou configuré via votre hébergeur.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};







