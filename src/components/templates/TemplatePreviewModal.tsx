/**
 * 🔍 TEMPLATE PREVIEW MODAL COMPONENT
 * Fullscreen template preview with responsive modes
 * 
 * Design Inspiration: Figma Preview, Webflow Preview, Framer Preview
 * 
 * Features:
 * - Fullscreen preview
 * - Responsive modes (desktop, tablet, mobile)
 * - Dark/Light mode preview
 * - Template details panel
 * - Direct use/export actions
 * - Zoom controls
 * - Navigation between templates
 */

import React, { useState } from 'react';
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Share2,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TemplateV2 } from '@/types/templates-v2';

// ============================================================================
// TYPES
// ============================================================================

interface TemplatePreviewModalProps {
  template: TemplateV2 | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate?: (template: TemplateV2) => void;
  onExport?: (template: TemplateV2) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile';
type ThemeMode = 'light' | 'dark';

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
  onExport,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false,
}: TemplatePreviewModalProps) {
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [zoom, setZoom] = useState(100);
  const [showDetails, setShowDetails] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!template) return null;

  const { metadata, data } = template;
  const isPremium = metadata.tier === 'premium';

  // Viewport dimensions
  const getViewportDimensions = () => {
    switch (viewportMode) {
      case 'desktop':
        return { width: '100%', maxWidth: '1920px' };
      case 'tablet':
        return { width: '768px', maxWidth: '768px' };
      case 'mobile':
        return { width: '375px', maxWidth: '375px' };
    }
  };

  const viewportDimensions = getViewportDimensions();

  // Handle copy template ID
  const handleCopyId = async () => {
    await navigator.clipboard.writeText(metadata.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: metadata.name,
          text: metadata.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h2 className="font-semibold">{metadata.name}</h2>
              <p className="text-xs text-muted-foreground">{metadata.category}</p>
            </div>
            {isPremium && (
              <Badge variant="default" className="ml-2">
                Premium • {metadata.price}€
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation */}
            {hasPrevious && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onPrevious}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Template précédent</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {hasNext && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onNext}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Template suivant</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isFavorite ? 'fill-red-500 text-red-500' : ''
                      }`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Partager</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDetails(!showDetails)}
                  >
                    <Info className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Détails du template</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Separator orientation="vertical" className="h-6" />

            {onExport && (
              <Button variant="outline" onClick={() => onExport(template)}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}

            {onUseTemplate && (
              <Button onClick={() => onUseTemplate(template)}>
                Utiliser ce template
              </Button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-center px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Viewport Modes */}
            <div className="flex items-center gap-1 bg-background rounded-lg p-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewportMode === 'desktop' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewportMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Desktop (1920px)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewportMode === 'tablet' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewportMode('tablet')}
                    >
                      <Tablet className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tablet (768px)</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={viewportMode === 'mobile' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setViewportMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mobile (375px)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Theme Toggle */}
            <div className="flex items-center gap-1 bg-background rounded-lg p-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={themeMode === 'light' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setThemeMode('light')}
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mode clair</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={themeMode === 'dark' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setThemeMode('dark')}
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mode sombre</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-background rounded-lg p-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      disabled={zoom <= 50}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Dézoomer</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-sm font-medium px-2 min-w-[3rem] text-center">
                {zoom}%
              </span>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      disabled={zoom >= 200}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoomer</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(100)}
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Réinitialiser (100%)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview Area */}
          <div className="flex-1 overflow-auto bg-muted/20 p-6">
            <div className="flex items-center justify-center min-h-full">
              <div
                style={{
                  width: viewportDimensions.width,
                  maxWidth: viewportDimensions.maxWidth,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
                className="transition-all duration-200"
              >
                <div
                  className={`bg-background rounded-lg shadow-2xl overflow-hidden ${
                    themeMode === 'dark' ? 'dark' : ''
                  }`}
                >
                  {/* Template Preview Content */}
                  <TemplatePreviewContent template={template} theme={themeMode} />
                </div>
              </div>
            </div>
          </div>

          {/* Details Sidebar */}
          {showDetails && (
            <>
              <Separator orientation="vertical" />
              <div className="w-96 overflow-auto bg-background">
                <TemplateDetailsPanel
                  template={template}
                  onCopyId={handleCopyId}
                  copied={copied}
                />
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TEMPLATE PREVIEW CONTENT
// ============================================================================

interface TemplatePreviewContentProps {
  template: TemplateV2;
  theme: ThemeMode;
}

function TemplatePreviewContent({ template, theme }: TemplatePreviewContentProps) {
  const { data } = template;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{data.basic.name}</h1>
        {data.basic.tagline && (
          <p className="text-xl text-muted-foreground">{data.basic.tagline}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge>{data.basic.category}</Badge>
          <span className="text-2xl font-bold text-primary">{data.pricing.basePrice}€</span>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Description</h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {data.basic.fullDescription}
        </p>
      </div>

      {/* Features */}
      {data.features && data.features.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Fonctionnalités</h2>
          <ul className="list-disc list-inside space-y-1">
            {data.features.map((feature, index) => (
              <li key={index} className="text-muted-foreground">
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Images */}
      {data.visual.images && data.visual.images.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Aperçus</h2>
          <div className="grid grid-cols-2 gap-4">
            {data.visual.images.slice(0, 4).map((image, index) => (
              <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {data.seo.keywords && data.seo.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.seo.keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary">
              {keyword}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// TEMPLATE DETAILS PANEL
// ============================================================================

interface TemplateDetailsPanelProps {
  template: TemplateV2;
  onCopyId: () => void;
  copied: boolean;
}

function TemplateDetailsPanel({ template, onCopyId, copied }: TemplateDetailsPanelProps) {
  const { metadata, data } = template;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Informations</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ID</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopyId}
                className="h-auto py-1 px-2 gap-1"
              >
                <span className="font-mono text-xs">{metadata.id.slice(0, 8)}...</span>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">{metadata.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Auteur</span>
              <span className="font-medium">{metadata.author.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Créé le</span>
              <span className="font-medium">
                {new Date(metadata.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Statistiques</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Note</span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{metadata.analytics.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Téléchargements</span>
              <span className="font-medium">{metadata.analytics.downloads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vues</span>
              <span className="font-medium">{metadata.analytics.views}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Favoris</span>
              <span className="font-medium">{metadata.analytics.favorites}</span>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold mb-2">Catégories & Tags</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Catégorie</span>
              <div className="mt-1">
                <Badge>{metadata.category}</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Style</span>
              <div className="mt-1">
                <Badge variant="outline">{metadata.designStyle}</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tags</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {data.requirements && data.requirements.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Prérequis</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {data.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {metadata.license && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-2">Licence</h3>
              <p className="text-sm text-muted-foreground">{metadata.license}</p>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

export default TemplatePreviewModal;

