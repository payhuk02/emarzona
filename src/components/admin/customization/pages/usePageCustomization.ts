/**
 * Hook de gestion de la personnalisation des pages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const usePageCustomization = (onChange?: () => void) => {
  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [pageValues, setPageValues] = useState<Record<string, Record<string, unknown>>>({});
  const [uploadingImages, setUploadingImages] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Record<string, Record<string, unknown>>>({});

  useEffect(() => {
    if (customizationData?.pages) {
      setPageValues(customizationData.pages);
    }
  }, [customizationData]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleElementChange = useCallback(
    (pageId: string, elementKey: string, value: unknown) => {
      setPageValues(prev => {
        const updated = {
          ...prev,
          [pageId]: { ...prev[pageId], [elementKey]: value },
        };

        pendingChangesRef.current = {
          ...pendingChangesRef.current,
          [pageId]: { ...pendingChangesRef.current[pageId], [elementKey]: value },
        };

        const currentData = customizationData || {};
        const updatedData = {
          ...currentData,
          pages: { ...currentData.pages, ...updated },
        };

        window.dispatchEvent(
          new CustomEvent('platform-customization-updated', {
            detail: { customizationData: updatedData },
          })
        );

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
          const changesToSave = pendingChangesRef.current;
          if (Object.keys(changesToSave).length > 0) {
            setIsSyncing(true);
            try {
              const currentPages = customizationData?.pages || {};
              const mergedPages = { ...currentPages, ...changesToSave };
              await save('pages', mergedPages).catch(error => {
                logger.error('Error saving page customization', { error, pageId, elementKey });
              });
              pendingChangesRef.current = {};
            } finally {
              setIsSyncing(false);
            }
          }
        }, 500);

        return updated;
      });

      if (onChange) onChange();
    },
    [save, onChange, customizationData]
  );

  const handleImageUpload = useCallback(
    async (pageId: string, elementKey: string, file: File) => {
      try {
        setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: true }));

        const fileExt = file.name.split('.').pop();
        const fileName = `${pageId}/${elementKey}-${Date.now()}.${fileExt}`;
        const filePath = `page-assets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('platform-assets')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('platform-assets').getPublicUrl(filePath);

        handleElementChange(pageId, elementKey, publicUrl);

        toast({ title: 'Image uploadée', description: "L'image a été uploadée avec succès." });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast({
          title: 'Erreur',
          description: errorMessage || "Impossible d'uploader l'image.",
          variant: 'destructive',
        });
      } finally {
        setUploadingImages(prev => ({ ...prev, [`${pageId}.${elementKey}`]: false }));
      }
    },
    [handleElementChange, toast]
  );

  const getElementValue = useCallback(
    (pageId: string, elementKey: string, defaultValue?: string): string | number | boolean => {
      const rawValue = pageValues[pageId]?.[elementKey];
      if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
        return rawValue;
      }
      return defaultValue ?? '';
    },
    [pageValues]
  );

  return {
    pageValues,
    uploadingImages,
    isSyncing,
    handleElementChange,
    handleImageUpload,
    getElementValue,
  };
};
