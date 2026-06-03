/**
 * Section Personnalisation Page d'Accueil (landing premium)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Home, Image as ImageIcon, Upload, Loader2, X } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { logger } from '@/lib/logger';
import {
  LANDING_PREMIUM_PAGE_ID,
  LANDING_PREMIUM_SECTIONS,
  type LandingPremiumElement,
} from '@/lib/admin/landingPremiumCustomization';

interface LandingPageCustomizationSectionProps {
  onChange?: () => void;
  /** Limite les sections affichées (ex. ['footer'] pour le pied de page uniquement) */
  sectionsFilter?: string[];
  /** Section active par défaut */
  defaultSection?: string;
  /** Identifiant page dans platform_settings.pages (défaut : landingPremium) */
  pageId?: string;
  /** Sections à éditer (défaut : LANDING_PREMIUM_SECTIONS) */
  sectionsConfig?: typeof LANDING_PREMIUM_SECTIONS;
  /** Masquer l'enveloppe Card (utile quand intégré dans une autre section) */
  hideCardWrapper?: boolean;
  title?: string;
  description?: string;
}

type PageElement = LandingPremiumElement & {
  type: LandingPremiumElement['type'] | 'font' | 'number' | 'url' | 'boolean';
};

export const LandingPageCustomizationSection = ({
  onChange,
  sectionsFilter,
  defaultSection,
  pageId = LANDING_PREMIUM_PAGE_ID,
  sectionsConfig = LANDING_PREMIUM_SECTIONS,
  hideCardWrapper = false,
  title = "Personnalisation de la Page d'Accueil",
  description = "Personnalisez la page d'accueil premium (hero, solutions, tarifs, footer, SEO). Les changements sont visibles en direct.",
}: LandingPageCustomizationSectionProps) => {
  const LANDING_SECTIONS = useMemo(
    () =>
      sectionsFilter?.length
        ? sectionsConfig.filter(s => sectionsFilter.includes(s.id))
        : sectionsConfig,
    [sectionsFilter, sectionsConfig]
  );

  const { customizationData, save } = usePlatformCustomization();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<string>(
    defaultSection ?? LANDING_SECTIONS[0]?.id ?? 'seo'
  );
  const [pageValues, setPageValues] = useState<Record<string, string | number | boolean | null>>(
    {}
  );
  const [uploadingImage, setUploadingImage] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    const pageData = customizationData?.pages?.[pageId];
    if (pageData && typeof pageData === 'object') {
      setPageValues(pageData as Record<string, string | number | boolean | null>);
    }
  }, [customizationData, pageId]);

  /**
   * Configuration de la section sélectionnée
   * Mémorisée pour éviter les recherches répétées dans le tableau
   */
  const selectedSectionConfig = useMemo(
    () => LANDING_SECTIONS.find(s => s.id === selectedSection),
    [selectedSection, LANDING_SECTIONS]
  );

  // Debounce pour éviter trop de sauvegardes
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleElementChange = useCallback(
    (elementKey: string, value: string | number | boolean | null) => {
      setPageValues(prev => {
        const updated = {
          ...prev,
          [elementKey]: value,
        };

        // Debounce la sauvegarde (500ms)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        const currentPages = customizationData?.pages || {};
        const pagesPayload = {
          ...currentPages,
          [pageId]: updated,
        };
        window.dispatchEvent(
          new CustomEvent('platform-customization-updated', {
            detail: { customizationData: { ...customizationData, pages: pagesPayload } },
          })
        );

        saveTimeoutRef.current = setTimeout(async () => {
          await save('pages', pagesPayload).catch(error => {
            logger.error('Error saving landing page customization', { error, elementKey, value });
          });
        }, 500);

        if (onChange) onChange();
        return updated;
      });
    },
    [save, onChange, customizationData, pageId]
  );

  const handleImageUpload = useCallback(
    async (elementKey: string, file: File) => {
      setUploadingImage(prev => ({ ...prev, [elementKey]: true }));
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `page-assets/${pageId}/${elementKey}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('platform-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('platform-assets').getPublicUrl(filePath);

        handleElementChange(elementKey, publicUrl);

        toast({
          title: 'Image uploadée',
          description: "L'image a été uploadée avec succès.",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Impossible d'uploader l'image.";
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setUploadingImage(prev => ({ ...prev, [elementKey]: false }));
      }
    },
    [handleElementChange, toast, pageId]
  );

  const handleRemoveImage = useCallback(
    async (elementKey: string, imageUrl: string) => {
      try {
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `page-assets/${pageId}/${fileName}`;

        const { error: deleteError } = await supabase.storage
          .from('platform-assets')
          .remove([filePath]);

        if (deleteError) throw deleteError;

        handleElementChange(elementKey, '');
        toast({
          title: 'Image supprimée',
          description: "L'image a été supprimée avec succès.",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Impossible de supprimer l'image.";
        toast({
          title: 'Erreur',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    },
    [handleElementChange, toast, pageId]
  );

  const renderElementEditor = useCallback(
    (element: PageElement) => {
      const value = (pageValues[element.id] ?? element.defaultValue ?? '') as string;
      const inputId = `landing-${element.id}`;

      switch (element.type) {
        case 'text':
          return (
            <Input
              id={inputId}
              value={value}
              onChange={e => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue}
            />
          );
        case 'textarea':
          return (
            <Textarea
              id={inputId}
              value={value}
              onChange={e => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue}
              rows={3}
            />
          );
        case 'image':
          return (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/50 relative">
                {value ? (
                  <>
                    <OptimizedImage
                      src={value}
                      alt={element.label}
                      className="max-w-full max-h-full object-contain"
                      width={128}
                      height={64}
                    />
                    <Button
                      onClick={() => handleRemoveImage(element.id, value)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      type="button"
                      size="icon"
                      aria-label={`Supprimer l'image ${element.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <input
                id={`file-${inputId}`}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                onChange={e => e.target.files && handleImageUpload(element.id, e.target.files[0])}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-${inputId}`)?.click()}
                disabled={uploadingImage[element.id]}
                className="w-full sm:w-auto"
              >
                {uploadingImage[element.id] ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Téléchargement...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Télécharger
                  </>
                )}
              </Button>
            </div>
          );
        case 'color':
          return (
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={value}
                onChange={e => handleElementChange(element.id, e.target.value)}
                className="w-16 h-10 p-1 border rounded-md cursor-pointer"
              />
              <Input
                value={value}
                onChange={e => handleElementChange(element.id, e.target.value)}
                placeholder={element.defaultValue}
                className="flex-1"
              />
            </div>
          );
        case 'font':
          return (
            <Input
              id={inputId}
              value={value}
              onChange={e => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue || 'Ex: "Inter", sans-serif'}
            />
          );
        case 'number':
          return (
            <Input
              id={inputId}
              type="number"
              value={value}
              onChange={e => handleElementChange(element.id, parseFloat(e.target.value))}
              placeholder={element.defaultValue}
            />
          );
        case 'url':
          return (
            <Input
              id={inputId}
              type="url"
              value={value}
              onChange={e => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue}
            />
          );
        case 'email':
          return (
            <Input
              id={inputId}
              type="email"
              value={value}
              onChange={e => handleElementChange(element.id, e.target.value)}
              placeholder={element.defaultValue}
            />
          );
        case 'boolean':
          return (
            <Switch
              checked={value === 'true' || value === (true as unknown)}
              onCheckedChange={checked => handleElementChange(element.id, checked)}
            />
          );
        default:
          return null;
      }
    },
    [pageValues, handleElementChange, handleImageUpload, handleRemoveImage, uploadingImage]
  );

  const editorContent = (
    <Tabs value={selectedSection} onValueChange={setSelectedSection}>
      {LANDING_SECTIONS.length > 1 ? (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border mb-4">
          <TabsList className="inline-flex w-full justify-start p-1">
            {LANDING_SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="text-xs sm:text-sm shrink-0"
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{section.name}</span>
                  <span className="sm:hidden">{section.name.split(' ')[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : null}

      {selectedSectionConfig && (
        <TabsContent value={selectedSection} className="space-y-4 mt-4">
          {LANDING_SECTIONS.length > 1 ? (
            <div className="flex items-center gap-2 mb-4">
              <selectedSectionConfig.icon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">{selectedSectionConfig.name}</h3>
              <Badge variant="secondary">{selectedSectionConfig.elements.length} éléments</Badge>
            </div>
          ) : null}
          {LANDING_SECTIONS.length > 1 ? <Separator /> : null}
          <div className="space-y-4">
            {selectedSectionConfig.elements.map(element => (
              <div key={element.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`landing-${element.id}`} className="text-sm font-medium">
                    {element.label}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {element.type}
                  </Badge>
                </div>
                {element.description && (
                  <p className="text-xs text-muted-foreground">{element.description}</p>
                )}
                {renderElementEditor(element)}
              </div>
            ))}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );

  if (hideCardWrapper) {
    return <div className="space-y-4 sm:space-y-6">{editorContent}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{editorContent}</CardContent>
      </Card>
    </div>
  );
};
