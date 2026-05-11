import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, Globe } from 'lucide-react';
import { generateStoreUrl } from '@/lib/store-utils';
import { useNavigate } from 'react-router-dom';
import StoreSlugEditor from '../StoreSlugEditor';
import type { Store } from '@/hooks/useStores';
import type { ExtendedStore } from '../types/store-form';

interface StoreUrlTabProps {
  store: ExtendedStore;
  storeUrl: string;
  isSubmitting: boolean;
  handleSlugUpdate: (newSlug: string) => Promise<boolean>;
  checkSlugAvailability: (slug: string) => Promise<boolean>;
  handleCopyUrl: () => void;
  updateStore: (updates: Partial<Store>) => Promise<boolean>;
}

export const StoreUrlTab = ({ store, storeUrl, isSubmitting, handleSlugUpdate, checkSlugAvailability, handleCopyUrl, updateStore }: StoreUrlTabProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <StoreSlugEditor currentSlug={store.slug} onSlugChange={handleSlugUpdate} onCheckAvailability={checkSlugAvailability} storeId={store.id} />

      <Card className="shadow-medium border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Lien de votre boutique</CardTitle>
          <CardDescription className="text-sm">Partagez ce lien pour que vos clients accèdent à votre boutique</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input value={storeUrl} readOnly className="font-mono text-xs sm:text-sm flex-1 touch-manipulation" />
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleCopyUrl} title="Copier le lien" className="touch-manipulation flex-1 sm:flex-none" aria-label="Copier le lien de la boutique">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => window.open(storeUrl, '_blank')} title="Ouvrir dans un nouvel onglet" className="touch-manipulation flex-1 sm:flex-none" aria-label="Ouvrir la boutique dans un nouvel onglet">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-xs sm:text-sm"><strong>Format du lien :</strong></p>
            <p className="text-xs text-muted-foreground mt-1 break-all">
              {store.custom_domain ? `https://${store.custom_domain}` : generateStoreUrl(store.slug, store.subdomain)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-medium border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domaine personnalisé
          </CardTitle>
          <CardDescription className="text-sm">
            Connectez votre propre domaine à votre boutique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard/domain')} variant="outline" className="w-full">
            <Globe className="h-4 w-4 mr-2" />
            Gérer mes domaines personnalisés
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
