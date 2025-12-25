import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent, BottomSheetTrigger } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Plus, Info } from '@/components/icons';
import ProductSlugEditor from './ProductSlugEditor';
import ImageUpload from './ImageUpload';
import { useProductManagement } from '@/hooks/useProductManagement';
import { generateSlug } from '@/lib/store-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSpaceInputFix } from '@/hooks/useSpaceInputFix';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';

interface CreateProductDialogProps {
  storeId: string;
  storeSlug: string;
  onProductCreated: () => void;
}

const CreateProductDialogComponent = ({
  storeId,
  storeSlug,
  onProductCreated,
}: CreateProductDialogProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { createProduct, checkSlugAvailability, loading } = useProductManagement(storeId);
  const { handleKeyDown: handleSpaceKeyDown } = useSpaceInputFix();
  const {
    open: modalOpen,
    setOpen: setModalOpen,
    useBottomSheet,
  } = useResponsiveModal({ defaultOpen: false });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const success = await createProduct({
        name,
        slug: slug || generateSlug(name),
        description,
        price: parseFloat(price) || 0,
        category,
        product_type: productType,
        image_url: imageUrl,
      });

      if (success) {
        setModalOpen(false);
        setName('');
        setSlug('');
        setDescription('');
        setPrice('');
        setCategory('');
        setProductType('');
        setImageUrl('');
        onProductCreated();
      }
    },
    [
      name,
      slug,
      description,
      price,
      category,
      productType,
      imageUrl,
      createProduct,
      onProductCreated,
    ]
  );

  const triggerButton = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Nouveau produit
    </Button>
  );

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MobileFormField
        label="Nom du produit"
        name="name"
        type="text"
        value={name}
        onChange={setName}
        required
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: 'Formation Excel complète',
        }}
      />

      <ProductSlugEditor
        productName={name}
        currentSlug={slug}
        storeSlug={storeSlug}
        onSlugChange={setSlug}
        onCheckAvailability={checkSlugAvailability}
      />

      <MobileFormField
        label="Prix (XOF)"
        name="price"
        type="number"
        value={price}
        onChange={setPrice}
        required
        fieldProps={{
          placeholder: '5000',
          min: '0',
          step: '1',
        }}
      />

      <MobileFormField
        label="Catégorie"
        name="category"
        type="text"
        value={category}
        onChange={setCategory}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: 'Formation',
        }}
      />

      <MobileFormField
        label="Type de produit"
        name="productType"
        type="text"
        value={productType}
        onChange={setProductType}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: 'Produit numérique',
        }}
      />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Recommandé: 1536×1024 (3:2), WebP/JPEG</p>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Guidelines Médias"
                className="text-gray-500 hover:text-gray-700"
              >
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent align="end">
              <div className="max-w-[260px] text-xs">
                Utilisez 1536×1024 (ratio 3:2) pour un rendu optimal.
                <a
                  href="https://github.com/payhuk02/emarzona/blob/main/docs/MEDIA_GUIDELINES.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline ml-1"
                >
                  Voir Médias
                </a>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
        <p className="text-xs text-gray-500">
          Astuce: respectez 1536×1024 (3:2) pour les cartes Marketplace et la boutique.
        </p>
      </div>

      <MobileFormField
        label="Description"
        name="description"
        type="textarea"
        value={description}
        onChange={setDescription}
        fieldProps={{
          onKeyDown: handleSpaceKeyDown,
          placeholder: 'Décrivez votre produit...',
          rows: 4,
        }}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setModalOpen(false)}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? 'Création...' : 'Créer le produit'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={modalOpen} onOpenChange={setModalOpen}>
          <BottomSheetTrigger asChild>{triggerButton}</BottomSheetTrigger>
          <BottomSheetContent
            title="Créer un produit"
            description="Ajoutez un nouveau produit à votre boutique"
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>{triggerButton}</DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un produit</DialogTitle>
              <DialogDescription>Ajoutez un nouveau produit à votre boutique</DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

CreateProductDialogComponent.displayName = 'CreateProductDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
const CreateProductDialog = React.memo(CreateProductDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.storeId === nextProps.storeId &&
    prevProps.storeSlug === nextProps.storeSlug &&
    prevProps.onProductCreated === nextProps.onProductCreated
  );
});

CreateProductDialog.displayName = 'CreateProductDialog';

export default CreateProductDialog;
