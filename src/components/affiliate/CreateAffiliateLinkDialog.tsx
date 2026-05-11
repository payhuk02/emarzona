/**
 * CreateAffiliateLinkDialog Component
 * Dialog pour créer un nouveau lien d'affiliation
 * Optimisé avec React.memo et validation Zod
 */

import { memo, useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Loader2, Search, AlertCircle } from '@/components/icons';
import { useAffiliateProducts } from '@/hooks/useAffiliateProducts';
import { useAffiliateLinks } from '@/hooks/useAffiliateLinks';
import { CreateAffiliateLinkForm, AffiliateLink } from '@/types/affiliate';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/lib/utils';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';

interface CreateAffiliateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affiliateId: string;
  onSuccess?: (link: AffiliateLink) => void;
}

// Schéma de validation
const createLinkSchema = z.object({
  product_id: z.string().min(1, 'Veuillez sélectionner un produit'),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
});

export const CreateAffiliateLinkDialog = memo(
  ({ open, onOpenChange, affiliateId, onSuccess }: CreateAffiliateLinkDialogProps) => {
    const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [utmSource, setUtmSource] = useState('');
    const [utmMedium, setUtmMedium] = useState('');
    const [utmCampaign, setUtmCampaign] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isCreating, setIsCreating] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);
    const { products, loading: productsLoading } = useAffiliateProducts(debouncedSearch);
    const { createLink, refetch } = useAffiliateLinks(affiliateId);

    // Produit sélectionné
    const selectedProduct = useMemo(
      () => products.find(p => p.id === selectedProductId),
      [products, selectedProductId]
    );

    // Réinitialiser le formulaire quand le dialog se ferme
    const handleClose = useCallback(() => {
      if (!isCreating) {
        setSearchQuery('');
        setSelectedProductId('');
        setUtmSource('');
        setUtmMedium('');
        setUtmCampaign('');
        setErrors({});
        onOpenChange(false);
      }
    }, [isCreating, onOpenChange]);

    // Validation
    const validate = useCallback((): boolean => {
      try {
        createLinkSchema.parse({
          product_id: selectedProductId,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
        });
        setErrors({});
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const newErrors: Record<string, string> = {};
          error.errors.forEach(err => {
            const path = err.path[0] as string;
            if (path) {
              newErrors[path] = err.message;
            }
          });
          setErrors(newErrors);
        }
        return false;
      }
    }, [selectedProductId, utmSource, utmMedium, utmCampaign]);

    // Créer le lien
    const handleCreate = useCallback(async () => {
      if (!validate()) {
        return;
      }

      setIsCreating(true);
      try {
        const formData: CreateAffiliateLinkForm = {
          product_id: selectedProductId,
          utm_source: utmSource || undefined,
          utm_medium: utmMedium || undefined,
          utm_campaign: utmCampaign || undefined,
        };

        const link = await createLink(affiliateId, formData);

        if (link) {
          // Rafraîchir la liste des liens
          await refetch();
          onSuccess?.(link);
          handleClose();
        }
      } catch (_error) {
        // L'erreur est déjà gérée dans createLink
      } finally {
        setIsCreating(false);
      }
    }, [
      validate,
      selectedProductId,
      utmSource,
      utmMedium,
      utmCampaign,
      affiliateId,
      createLink,
      refetch,
      onSuccess,
      handleClose,
    ]);

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl">
              Créer un nouveau lien d'affiliation
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Sélectionnez un produit et générez votre lien unique de promotion
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Recherche de produit */}
            <div className="space-y-2">
              <Label htmlFor="product-search" className="text-sm font-medium">
                Rechercher un produit <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="product-search"
                  placeholder="Rechercher par nom ou slug..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSpaceKeyDown}
                  className="pl-10"
                  disabled={isCreating}
                />
              </div>
            </div>

            {/* Liste des produits */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Sélectionner un produit <span className="text-destructive">*</span>
              </Label>
              {productsLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">
                    {searchQuery
                      ? 'Aucun produit trouvé'
                      : 'Aucun produit avec affiliation activée'}
                  </p>
                </Card>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {products.map(product => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedProductId === product.id
                          ? 'border-primary border-2 bg-primary/5'
                          : 'border-border/50'
                      }`}
                      onClick={() => !isCreating && setSelectedProductId(product.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded flex-shrink-0"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              {product.name}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">
                              {product.store.name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm font-medium">
                                {formatCurrency(product.price)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Commission:{' '}
                                {product.settings.commission_type === 'percentage'
                                  ? `${product.settings.commission_rate}%`
                                  : formatCurrency(product.settings.fixed_commission_amount || 0)}
                              </span>
                            </div>
                          </div>
                          {selectedProductId === product.id && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              {errors.product_id && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.product_id}
                </p>
              )}
            </div>

            {/* Informations du produit sélectionné */}
            {selectedProduct && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-2">Produit sélectionné</h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p>
                      <span className="font-medium">Produit:</span> {selectedProduct.name}
                    </p>
                    <p>
                      <span className="font-medium">Boutique:</span> {selectedProduct.store.name}
                    </p>
                    <p>
                      <span className="font-medium">Prix:</span>{' '}
                      {formatCurrency(selectedProduct.price)}
                    </p>
                    <p>
                      <span className="font-medium">Commission:</span>{' '}
                      {selectedProduct.settings.commission_type === 'percentage'
                        ? `${selectedProduct.settings.commission_rate}% (${formatCurrency((selectedProduct.price * selectedProduct.settings.commission_rate) / 100)} par vente)`
                        : formatCurrency(selectedProduct.settings.fixed_commission_amount || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Paramètres UTM (optionnels) */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-semibold text-sm">Paramètres UTM (optionnels)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="utm_source" className="text-xs">
                    UTM Source
                  </Label>
                  <Input
                    id="utm_source"
                    placeholder="ex: facebook"
                    value={utmSource}
                    onChange={e => setUtmSource(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    disabled={isCreating}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_medium" className="text-xs">
                    UTM Medium
                  </Label>
                  <Input
                    id="utm_medium"
                    placeholder="ex: social"
                    value={utmMedium}
                    onChange={e => setUtmMedium(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    disabled={isCreating}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="utm_campaign" className="text-xs">
                    UTM Campaign
                  </Label>
                  <Input
                    id="utm_campaign"
                    placeholder="ex: promo2025"
                    value={utmCampaign}
                    onChange={e => setUtmCampaign(e.target.value)}
                    onKeyDown={handleSpaceKeyDown}
                    disabled={isCreating}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isCreating}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !selectedProductId}
                className="flex-1 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Créer le lien
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.open === nextProps.open &&
      prevProps.affiliateId === nextProps.affiliateId &&
      prevProps.onOpenChange === nextProps.onOpenChange &&
      prevProps.onSuccess === nextProps.onSuccess
    );
  }
);

CreateAffiliateLinkDialog.displayName = 'CreateAffiliateLinkDialog';
