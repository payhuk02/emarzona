/**
 * StorePreview — iframe vers le storefront React réel (/dashboard/store/preview).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink, RefreshCw, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Store } from '@/hooks/useStores';
import {
  appearanceFormToPreviewDraft,
  writeStorePreviewDraft,
  type StoreAppearanceFormDraft,
} from '@/lib/storefront/store-preview-draft';

interface StorePreviewProps {
  store: Store | null;
  formDraft: StoreAppearanceFormDraft;
  onClose?: () => void;
}

export const StorePreview: React.FC<StorePreviewProps> = ({ store, formDraft, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const previewDraft = useMemo(() => appearanceFormToPreviewDraft(formDraft), [formDraft]);

  const publishDraft = useCallback(() => {
    if (!store?.id) return;
    writeStorePreviewDraft(store.id, previewDraft);
  }, [store?.id, previewDraft]);

  const previewUrl = store?.id
    ? `/dashboard/store/preview?storeId=${encodeURIComponent(store.id)}`
    : '';

  const handleOpenPreview = () => {
    publishDraft();
    setIframeKey(key => key + 1);
    setIsOpen(true);
  };

  const handleClosePreview = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleRefreshPreview = () => {
    publishDraft();
    setIframeKey(key => key + 1);
  };

  useEffect(() => {
    if (!isOpen || !store?.id) return;
    publishDraft();
    setIframeKey(key => key + 1);
  }, [isOpen, previewDraft, publishDraft, store?.id]);

  if (!store?.id) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenPreview}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Prévisualiser la boutique
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" onClick={publishDraft}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir dans un nouvel onglet
          </a>
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={open => (open ? setIsOpen(true) : handleClosePreview())}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 pb-2 shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Prévisualisation — storefront réel
                </DialogTitle>
                <DialogDescription>
                  Rendu identique à la boutique publique, avec vos modifications en cours.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshPreview}
                  aria-label="Actualiser la prévisualisation"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={handleClosePreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 border-t">
            <iframe
              key={iframeKey}
              src={previewUrl}
              className="h-full w-full border-0 bg-background"
              title={`Prévisualisation de ${store.name}`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
