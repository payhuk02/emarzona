/**
 * StorePreview — iframe storefront réel + sync live + device frames (Sprint 4 WYSIWYG).
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Eye, ExternalLink, Monitor, RefreshCw, Smartphone, Tablet, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Store } from '@/hooks/useStores';
import {
  appearanceFormToPreviewDraft,
  writeStorePreviewDraft,
  type StoreAppearanceFormDraft,
} from '@/lib/storefront/store-preview-draft';

type DevicePreset = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTH: Record<DevicePreset, string> = {
  desktop: '100%',
  tablet: '820px',
  mobile: '390px',
};

const IFRAME_MIN_HEIGHT: Record<DevicePreset, string> = {
  desktop: 'min-h-[520px]',
  tablet: 'min-h-[560px]',
  mobile: 'min-h-[640px]',
};

function resolveDefaultDevice(): DevicePreset {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1280) return 'tablet';
  return 'desktop';
}

interface StorePreviewProps {
  store: Store | null;
  formDraft: StoreAppearanceFormDraft;
  onClose?: () => void;
  /** Affiche un panneau iframe inline (à côté du formulaire) */
  inline?: boolean;
}

export const StorePreview: React.FC<StorePreviewProps> = ({
  store,
  formDraft,
  onClose,
  inline = false,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [device, setDevice] = useState<DevicePreset>(() => resolveDefaultDevice());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDevice(resolveDefaultDevice());
  }, [inline]);

  const previewDraft = useMemo(() => appearanceFormToPreviewDraft(formDraft), [formDraft]);

  const syncPreviewDraft = useCallback(() => {
    if (!store?.id) return;
    writeStorePreviewDraft(store.id, previewDraft);
  }, [store?.id, previewDraft]);

  const previewUrl = store?.id
    ? `/dashboard/store/preview?storeId=${encodeURIComponent(store.id)}`
    : '';

  const handleOpenPreview = () => {
    syncPreviewDraft();
    setIframeKey(key => key + 1);
    setIsOpen(true);
  };

  const handleClosePreview = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleRefreshPreview = () => {
    syncPreviewDraft();
    setIframeKey(key => key + 1);
  };

  // Sync draft without remounting iframe (preview page listens to storage)
  useEffect(() => {
    if ((!isOpen && !inline) || !store?.id) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncPreviewDraft();
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen, inline, previewDraft, syncPreviewDraft, store?.id]);

  useEffect(() => {
    if (inline && store?.id) {
      syncPreviewDraft();
    }
  }, [inline, store?.id, syncPreviewDraft]);

  if (!store?.id) {
    return null;
  }

  const deviceToggle = (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      {(
        [
          ['desktop', Monitor],
          ['tablet', Tablet],
          ['mobile', Smartphone],
        ] as const
      ).map(([id, Icon]) => (
        <Button
          key={id}
          type="button"
          size="icon"
          variant={device === id ? 'secondary' : 'ghost'}
          className="h-8 w-8"
          onClick={() => setDevice(id)}
          aria-label={t(`store.preview.device.${id}`)}
        >
          <Icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );

  const iframeFrame = (
    <div className="flex-1 min-h-0 border-t bg-muted/40 flex justify-center overflow-auto p-2 sm:p-3">
      <div
        className={cn(
          'h-full bg-background shadow-sm transition-[width] duration-200',
          device === 'mobile' && 'rounded-[1.75rem] border shadow-md overflow-hidden',
          device === 'tablet' && 'rounded-xl border-x shadow-md overflow-hidden',
          device === 'desktop' && 'w-full'
        )}
        style={{ width: DEVICE_WIDTH[device], maxWidth: '100%' }}
      >
        <iframe
          key={iframeKey}
          src={previewUrl}
          className={cn('h-full w-full border-0 bg-background', IFRAME_MIN_HEIGHT[device])}
          title={t('store.preview.iframeTitle', { name: store.name })}
        />
      </div>
    </div>
  );

  if (inline) {
    return (
      <div
        className="flex flex-col rounded-lg border overflow-hidden min-h-[480px] sm:min-h-[560px] h-[min(75vh,780px)]"
        data-testid="store-preview-inline"
      >
        <div className="flex items-center justify-between gap-2 p-2 border-b bg-card flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2 text-sm font-medium min-w-0">
            <Eye className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('store.preview.liveTitle')}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {deviceToggle}
            <Button type="button" variant="ghost" size="icon" onClick={handleRefreshPreview}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" asChild>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={syncPreviewDraft}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        {iframeFrame}
      </div>
    );
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
          {t('store.preview.openPreview')}
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" onClick={syncPreviewDraft}>
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('store.preview.openNewTab')}
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
                  {t('store.preview.dialogTitle')}
                </DialogTitle>
                <DialogDescription>{t('store.preview.dialogDescription')}</DialogDescription>
              </div>
              <div className="flex items-center gap-1">
                {deviceToggle}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshPreview}
                  aria-label={t('store.preview.refreshAriaLabel')}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={handleClosePreview}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          {iframeFrame}
        </DialogContent>
      </Dialog>
    </>
  );
};
