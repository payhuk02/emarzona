/**
 * 🎨 TEMPLATE CUSTOMIZER COMPONENT
 * Visual template customizer with real-time preview
 * 
 * Design Inspiration: Webflow Designer, Framer, Canva Editor
 * 
 * Features:
 * - Visual editing of template fields
 * - Real-time preview
 * - Color picker
 * - Image uploader
 * - Font selector
 * - Spacing controls
 * - Undo/Redo
 * - Save/Export
 */

import React, { useState, useCallback } from 'react';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Layout,
  Save,
  Undo,
  Redo,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Pipette,
  Upload,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { TemplateV2, TemplateData } from '@/types/templates-v2';
import { applyTemplate } from '@/lib/template-engine';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateCustomizerProps {
  template: TemplateV2;
  onChange?: (template: TemplateV2) => void;
  onSave?: (template: TemplateV2) => void;
}

interface HistoryState {
  past: TemplateData[];
  present: TemplateData;
  future: TemplateData[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateCustomizer({
  template: initialTemplate,
  onChange,
  onSave,
}: TemplateCustomizerProps) {
  const [template, setTemplate] = useState<TemplateV2>(initialTemplate);
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialTemplate.data,
    future: [],
  });
  const [showPreview, setShowPreview] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string>('basic');

  // Update template data with history
  const updateData = useCallback(
    (updater: (data: TemplateData) => TemplateData) => {
      setHistory((prev) => ({
        past: [...prev.past, prev.present],
        present: updater(prev.present),
        future: [],
      }));

      setTemplate((prev) => {
        const updated = {
          ...prev,
          data: updater(prev.data),
        };
        onChange?.(updated);
        return updated;
      });
    },
    [onChange]
  );

  // Undo
  const handleUndo = () => {
    if (history.past.length === 0) return;

    setHistory((prev) => ({
      past: prev.past.slice(0, -1),
      present: prev.past[prev.past.length - 1],
      future: [prev.present, ...prev.future],
    }));

    setTemplate((prev) => ({
      ...prev,
      data: history.past[history.past.length - 1],
    }));
  };

  // Redo
  const handleRedo = () => {
    if (history.future.length === 0) return;

    setHistory((prev) => ({
      past: [...prev.past, prev.present],
      present: prev.future[0],
      future: prev.future.slice(1),
    }));

    setTemplate((prev) => ({
      ...prev,
      data: history.future[0],
    }));
  };

  // Save
  const handleSave = () => {
    onSave?.(template);
  };

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Controls */}
      <div className="w-96 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2">Personnaliser le template</h2>
          <p className="text-sm text-muted-foreground">{template.metadata.name}</p>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button size="sm" onClick={handleSave} className="ml-auto">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>

        {/* Editor Sections */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Accordion type="single" collapsible defaultValue="basic">
              {/* Basic Info */}
              <AccordionItem value="basic">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Informations de base
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <BasicInfoEditor template={template} onUpdate={updateData} />
                </AccordionContent>
              </AccordionItem>

              {/* Visual */}
              <AccordionItem value="visual">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Visuels
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <VisualEditor template={template} onUpdate={updateData} />
                </AccordionContent>
              </AccordionItem>

              {/* Colors */}
              <AccordionItem value="colors">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Couleurs
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ColorEditor template={template} onUpdate={updateData} />
                </AccordionContent>
              </AccordionItem>

              {/* Typography */}
              <AccordionItem value="typography">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Typographie
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <TypographyEditor template={template} onUpdate={updateData} />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Preview */}
      {showPreview && (
        <div className="flex-1 overflow-auto bg-muted/20 p-6">
          <div className="max-w-4xl mx-auto">
            <TemplatePreview template={template} />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BASIC INFO EDITOR
// ============================================================================

interface EditorProps {
  template: TemplateV2;
  onUpdate: (updater: (data: TemplateData) => TemplateData) => void;
}

function BasicInfoEditor({ template, onUpdate }: EditorProps) {
  const { data } = template;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nom du produit</Label>
        <Input
          id="name"
          value={data.basic.name}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              basic: { ...d.basic, name: e.target.value },
            }))
          }
        />
      </div>

      <div>
        <Label htmlFor="tagline">Slogan</Label>
        <Input
          id="tagline"
          value={data.basic.tagline || ''}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              basic: { ...d.basic, tagline: e.target.value },
            }))
          }
          placeholder="Un slogan accrocheur..."
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.basic.fullDescription}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              basic: { ...d.basic, fullDescription: e.target.value },
            }))
          }
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Select
          value={data.basic.category}
          onValueChange={(value) =>
            onUpdate((d) => ({
              ...d,
              basic: { ...d.basic, category: value },
            }))
          }
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ebook">E-book</SelectItem>
            <SelectItem value="software">Logiciel</SelectItem>
            <SelectItem value="course">Cours</SelectItem>
            <SelectItem value="template">Template</SelectItem>
            <SelectItem value="music">Musique</SelectItem>
            <SelectItem value="video">Vidéo</SelectItem>
            <SelectItem value="graphics">Graphiques</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="price">Prix (€)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={data.pricing.basePrice}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              pricing: { ...d.pricing, basePrice: parseFloat(e.target.value) },
            }))
          }
        />
      </div>
    </div>
  );
}

// ============================================================================
// VISUAL EDITOR
// ============================================================================

function VisualEditor({ template, onUpdate }: EditorProps) {
  const { data } = template;

  const handleImageUpload = (index: number) => {
    // In a real app, this would open a file picker and upload to storage
    const imageUrl = prompt('URL de l\'image:');
    if (imageUrl) {
      onUpdate((d) => {
        const images = [...(d.visual.images || [])];
        if (index < images.length) {
          images[index] = imageUrl;
        } else {
          images.push(imageUrl);
        }
        return {
          ...d,
          visual: { ...d.visual, images },
        };
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Label>Images du produit</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label="Guidelines Médias" className="text-gray-500 hover:text-gray-700">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent align="start">
              <div className="max-w-[260px] text-xs">
                Recommandé: 1280×720 (16:9), WebP/JPEG. Optimise l’affichage des templates.
                <a
                  href="https://github.com/payhuk02/payhula/blob/main/docs/MEDIA_GUIDELINES.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline ml-1"
                >Voir Médias</a>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              onClick={() => handleImageUpload(index)}
              className="aspect-video bg-muted rounded-md border-2 border-dashed hover:bg-muted/50 flex items-center justify-center group"
            >
              {data.visual.images?.[index] ? (
                <img
                  src={data.visual.images[index]}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <div className="text-center">
                  <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground group-hover:text-foreground" />
                  <span className="text-xs text-muted-foreground">Ajouter</span>
                </div>
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Conseil: utilisez des images 16:9 (1280×720) pour une cohérence visuelle.</p>
      </div>

      <div>
        <Label htmlFor="thumbnail">URL de la vignette</Label>
        <Input
          id="thumbnail"
          value={data.visual.thumbnail || ''}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              visual: { ...d.visual, thumbnail: e.target.value },
            }))
          }
          placeholder="https://..."
        />
      </div>

      <div>
        <Label htmlFor="video">URL de la vidéo (optionnel)</Label>
        <Input
          id="video"
          value={data.visual.videoUrl || ''}
          onChange={(e) =>
            onUpdate((d) => ({
              ...d,
              visual: { ...d.visual, videoUrl: e.target.value },
            }))
          }
          placeholder="https://youtube.com/..."
        />
      </div>
    </div>
  );
}

// ============================================================================
// COLOR EDITOR
// ============================================================================

function ColorEditor({ template, onUpdate }: EditorProps) {
  const { data } = template;
  const colors = data.designTokens?.colors;

  if (!colors) return <p className="text-sm text-muted-foreground">Aucune couleur définie</p>;

  return (
    <div className="space-y-4">
      <div>
        <Label>Couleur principale</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="color"
            value={colors.primary}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, primary: e.target.value },
                },
              }))
            }
            className="w-16 h-10 p-1"
          />
          <Input
            value={colors.primary}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, primary: e.target.value },
                },
              }))
            }
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <Label>Couleur secondaire</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="color"
            value={colors.secondary}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, secondary: e.target.value },
                },
              }))
            }
            className="w-16 h-10 p-1"
          />
          <Input
            value={colors.secondary}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, secondary: e.target.value },
                },
              }))
            }
            className="font-mono"
          />
        </div>
      </div>

      <div>
        <Label>Couleur d'accent</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="color"
            value={colors.accent}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, accent: e.target.value },
                },
              }))
            }
            className="w-16 h-10 p-1"
          />
          <Input
            value={colors.accent}
            onChange={(e) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  colors: { ...colors, accent: e.target.value },
                },
              }))
            }
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TYPOGRAPHY EDITOR
// ============================================================================

function TypographyEditor({ template, onUpdate }: EditorProps) {
  const { data } = template;
  const typography = data.designTokens?.typography;

  if (!typography) return <p className="text-sm text-muted-foreground">Aucune typo définie</p>;

  const fontFamilies = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'PT Sans',
    'Merriweather',
    'Playfair Display',
  ];

  return (
    <div className="space-y-4">
      <div>
        <Label>Police principale</Label>
        <Select
          value={typography.fontFamily}
          onValueChange={(value) =>
            onUpdate((d) => ({
              ...d,
              designTokens: {
                ...d.designTokens!,
                typography: { ...typography, fontFamily: value },
              },
            }))
          }
        >
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font} value={font}>
                <span style={{ fontFamily: font }}>{font}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Taille du titre (px)</Label>
        <div className="flex items-center gap-3 mt-2">
          <Slider
            value={[parseInt(typography.headingSize || '32')]}
            onValueChange={([value]) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  typography: { ...typography, headingSize: `${value}px` },
                },
              }))
            }
            min={20}
            max={64}
            step={2}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12 text-right">
            {typography.headingSize}
          </span>
        </div>
      </div>

      <div>
        <Label>Taille du corps (px)</Label>
        <div className="flex items-center gap-3 mt-2">
          <Slider
            value={[parseInt(typography.bodySize || '16')]}
            onValueChange={([value]) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  typography: { ...typography, bodySize: `${value}px` },
                },
              }))
            }
            min={12}
            max={24}
            step={1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12 text-right">
            {typography.bodySize}
          </span>
        </div>
      </div>

      <div>
        <Label>Hauteur de ligne</Label>
        <div className="flex items-center gap-3 mt-2">
          <Slider
            value={[parseFloat(typography.lineHeight || '1.5')]}
            onValueChange={([value]) =>
              onUpdate((d) => ({
                ...d,
                designTokens: {
                  ...d.designTokens!,
                  typography: { ...typography, lineHeight: value.toFixed(1) },
                },
              }))
            }
            min={1}
            max={2.5}
            step={0.1}
            className="flex-1"
          />
          <span className="text-sm font-medium w-12 text-right">
            {typography.lineHeight}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE PREVIEW
// ============================================================================

interface TemplatePreviewProps {
  template: TemplateV2;
}

function TemplatePreview({ template }: TemplatePreviewProps) {
  const { data } = template;
  const colors = data.designTokens?.colors;
  const typography = data.designTokens?.typography;

  const style: React.CSSProperties = {
    fontFamily: typography?.fontFamily || 'Inter',
    color: colors?.text || '#000',
  };

  return (
    <div className="bg-background rounded-lg shadow-xl p-8 space-y-6" style={style}>
      {/* Header */}
      <div className="space-y-2">
        <h1
          className="font-bold"
          style={{
            fontSize: typography?.headingSize || '32px',
            color: colors?.primary || '#000',
          }}
        >
          {data.basic.name}
        </h1>
        {data.basic.tagline && (
          <p
            className="text-xl"
            style={{
              color: colors?.secondary || '#666',
            }}
          >
            {data.basic.tagline}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Badge
            style={{
              backgroundColor: colors?.accent || '#f0f0f0',
              color: colors?.background || '#fff',
            }}
          >
            {data.basic.category}
          </Badge>
          <span
            className="text-2xl font-bold"
            style={{
              color: colors?.primary || '#000',
            }}
          >
            {data.pricing.basePrice}€
          </span>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div className="space-y-2">
        <h2
          className="text-lg font-semibold"
          style={{
            color: colors?.primary || '#000',
          }}
        >
          Description
        </h2>
        <p
          style={{
            fontSize: typography?.bodySize || '16px',
            lineHeight: typography?.lineHeight || '1.5',
            color: colors?.text || '#000',
          }}
        >
          {data.basic.fullDescription}
        </p>
      </div>

      {/* Images */}
      {data.visual.images && data.visual.images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {data.visual.images.slice(0, 4).map((image, index) => (
            <div key={index} className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img src={image} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TemplateCustomizer;

