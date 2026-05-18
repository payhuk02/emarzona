/**
 * Studio premium pour améliorer une image avec l'IA.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Sparkles,
  Loader2,
  RotateCcw,
  Check,
  ImagePlus,
  Wand2,
  Layers,
  Columns2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useImageOptimizer } from '@/hooks/useImageOptimizer';
import { useImageEnhancerSettings } from '@/hooks/useImageEnhancerSettings';
import { compressImage, blobToFile } from '@/lib/images/compress';
import { imageUrlToBlob } from '@/lib/images/imageUrlToBlob';
import { invokeEnhanceImage, prepareImageForAI } from '@/lib/images/enhance-image-client';
import { DEFAULT_STUDIO_PRESETS, type StudioPreset } from '@/lib/images/studio-presets';
import { ImageCompareSlider } from '@/components/images/ImageCompareSlider';
import { cn } from '@/lib/utils';

export {
  STUDIO_PRESETS,
  STUDIO_PRESET_KEYS,
  type StudioPresetKey,
} from '@/lib/images/studio-presets';
export { DEFAULT_STUDIO_PRESETS };

interface ImageEnhancerStudioProps {
  folder?: string;
  bucket?: string;
  onSaved?: (publicUrl: string) => void;
  /** Signale le début/fin de l'enregistrement (ex. overlay dans ImageStudioField). */
  onSaving?: (saving: boolean) => void;
  initialUrl?: string;
  initialPresetIndex?: number;
  className?: string;
}

type Phase = 'idle' | 'loaded' | 'enhancing' | 'preview' | 'saving' | 'saved';
type CompareMode = 'slider' | 'side-by-side';

export const ImageEnhancerStudio: React.FC<ImageEnhancerStudioProps> = ({
  folder = 'enhanced',
  bucket = 'service-images',
  onSaved,
  onSaving,
  initialUrl,
  initialPresetIndex = 0,
  className,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadOptimized, isUploading, progress } = useImageOptimizer({
    bucket,
    folder,
  });
  const { presets, isEnabled, isLoading: settingsLoading, settings } = useImageEnhancerSettings();

  const safePreset = Math.min(Math.max(initialPresetIndex, 0), presets.length - 1);
  const [originalUrl, setOriginalUrl] = useState<string | null>(initialUrl ?? null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [savedPublicUrl, setSavedPublicUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState(presets[safePreset]?.instruction ?? '');
  const [activePresetId, setActivePresetId] = useState<string | null>(
    presets[safePreset]?.id ?? null
  );
  const [phase, setPhase] = useState<Phase>(initialUrl ? 'loaded' : 'idle');
  const [dragOver, setDragOver] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastModel, setLastModel] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<CompareMode>('slider');
  const [history, setHistory] = useState<
    Array<{ label: string; emoji: string; instruction: string; at: number }>
  >([]);

  const reset = useCallback(() => {
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setSavedPublicUrl(null);
    setOriginalFile(null);
    setPhase('idle');
    setLastModel(null);
    setActivePresetId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const applyPreset = useCallback((preset: StudioPreset) => {
    setActivePresetId(preset.id);
    setInstruction(preset.instruction);
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Format invalide',
          description: 'Veuillez sélectionner une image (JPG, PNG, WebP).',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Image trop lourde',
          description: 'Taille maximum : 10 Mo.',
          variant: 'destructive',
        });
        return;
      }
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setEnhancedUrl(null);
      setSavedPublicUrl(null);
      setPhase('loaded');
      setLastError(null);
    },
    [toast]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const enhance = async () => {
    if (!originalUrl || !isEnabled) return;
    setPhase('enhancing');
    setLastError(null);
    try {
      const payloadUrl = await prepareImageForAI(
        originalUrl,
        originalFile,
        settings.inferenceMaxPx ?? 2048
      );

      const result = await invokeEnhanceImage(payloadUrl, instruction);
      setEnhancedUrl(result.imageUrl);
      setLastModel(result.model ?? settings.model);
      setPhase('preview');

      const preset = presets.find(p => p.id === activePresetId);
      setHistory(h =>
        [
          {
            label: preset?.label ?? 'Personnalisé',
            emoji: preset?.emoji ?? '🪄',
            instruction,
            at: Date.now(),
          },
          ...h,
        ].slice(0, 8)
      );
      toast({
        title: 'Aperçu prêt',
        description: 'Comparez avant / après puis enregistrez si le résultat vous convient.',
      });
    } catch (err) {
      setPhase('loaded');
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setLastError(msg);
      toast({
        title: "Échec de l'amélioration IA",
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const useEnhancedAsSource = async () => {
    if (!enhancedUrl) return;
    try {
      const blob = await imageUrlToBlob(enhancedUrl);
      const file = new File([blob], `chain-${Date.now()}.webp`, {
        type: blob.type || 'image/webp',
      });
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setEnhancedUrl(null);
      setPhase('loaded');
      toast({
        title: 'Nouvelle base',
        description: "Vous pouvez affiner à nouveau l'image améliorée.",
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : "Impossible de réutiliser l'image",
        variant: 'destructive',
      });
    }
  };

  const save = async () => {
    if (!enhancedUrl) return;
    setPhase('saving');
    onSaving?.(true);
    setLastError(null);
    try {
      const blob = await imageUrlToBlob(enhancedUrl);
      const tempFile = new File([blob], `enhanced-${Date.now()}.png`, {
        type: blob.type || 'image/png',
      });

      const { blob: compressed } = await compressImage(tempFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.88,
        mimeType: 'image/webp',
      });
      const finalFile = blobToFile(compressed, tempFile.name);
      const result = await uploadOptimized(finalFile);

      setSavedPublicUrl(result.publicUrl);
      onSaved?.(result.publicUrl);
      setPhase('saved');

      toast({
        title: 'Image enregistrée',
        description: `${(result.optimizedSize / 1024).toFixed(0)} Ko — ${result.width}×${result.height}px`,
      });
    } catch (err) {
      setPhase('preview');
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setLastError(msg);
      toast({
        title: "Erreur d'enregistrement",
        description: msg,
        variant: 'destructive',
      });
    } finally {
      onSaving?.(false);
    }
  };

  if (settingsLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement du Studio IA…
        </CardContent>
      </Card>
    );
  }

  if (!isEnabled) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Le Studio IA est temporairement désactivé par l&apos;administrateur. Réessayez plus
              tard ou contactez le support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-md">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                Studio IA
                <Badge variant="secondary" className="text-[10px]">
                  PREMIUM
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Améliorez vos visuels e-commerce — comparez avant d&apos;enregistrer.
              </p>
            </div>
          </div>
          {phase !== 'idle' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={phase === 'enhancing' || phase === 'saving'}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        {(phase === 'saving' || isUploading) && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Enregistrement en cours…</p>
              <p className="text-xs text-muted-foreground">
                Compression WebP et envoi sécurisé vers le stockage.
              </p>
              {progress > 0 && <Progress value={progress} className="h-1.5 mt-2" />}
            </div>
          </div>
        )}

        {lastError && phase !== 'enhancing' && phase !== 'saving' && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <p className="text-sm font-medium text-destructive">
              Le Studio IA a rencontré un problème
            </p>
            <p className="text-xs text-muted-foreground break-words">{lastError}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLastError(null);
                  if (phase === 'preview' && enhancedUrl) void save();
                  else if (phase === 'saved') void enhance();
                  else void enhance();
                }}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Réessayer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setLastError(null)}>
                Ignorer
              </Button>
            </div>
          </div>
        )}

        {phase === 'idle' && (
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <ImagePlus className="h-12 w-12 mx-auto text-muted-foreground/60 mb-3" />
            <p className="font-medium">Glissez une image ou cliquez pour parcourir</p>
            <p className="text-xs text-muted-foreground mt-1">
              JPG, PNG, WebP — 10 Mo max — optimisée automatiquement avant l&apos;IA
            </p>
          </div>
        )}

        {(phase === 'loaded' || phase === 'enhancing') && originalUrl && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center">
              <img
                src={originalUrl}
                alt="Image originale"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Style d&apos;amélioration</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'text-left text-sm rounded-lg border px-3 py-2.5 transition-colors',
                      activePresetId === preset.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <span className="mr-2">{preset.emoji}</span>
                    <span className="font-medium">{preset.label}</span>
                    {preset.description && (
                      <p className="text-[11px] text-muted-foreground mt-1 pl-6">
                        {preset.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {history.map((h, i) => (
                  <button
                    key={`${h.at}-${i}`}
                    type="button"
                    disabled={phase === 'enhancing'}
                    onClick={() => {
                      setInstruction(h.instruction);
                      const match = presets.find(p => p.label === h.label);
                      setActivePresetId(match?.id ?? null);
                    }}
                    className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-muted disabled:opacity-50"
                    title={h.instruction}
                  >
                    <span>{h.emoji}</span>
                    <span className="truncate max-w-[120px]">{h.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom-instruction" className="text-sm font-medium">
                Instruction personnalisée
              </Label>
              <Textarea
                id="custom-instruction"
                rows={3}
                value={instruction}
                onChange={e => {
                  setInstruction(e.target.value);
                  const match = presets.find(p => p.instruction === e.target.value);
                  setActivePresetId(match?.id ?? null);
                }}
                placeholder="Décrivez l'amélioration souhaitée (anglais recommandé pour l'IA)…"
                className="resize-none text-sm"
              />
            </div>

            <Button
              onClick={enhance}
              disabled={phase === 'enhancing' || !instruction.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
              size="lg"
            >
              {phase === 'enhancing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  L&apos;IA analyse votre image…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer l&apos;aperçu IA
                </>
              )}
            </Button>
          </div>
        )}

        {(phase === 'preview' || phase === 'saving') && originalUrl && enhancedUrl && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  Original
                </Badge>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <Badge className="text-[10px] bg-gradient-to-r from-blue-600 to-emerald-600">
                  IA
                </Badge>
                {lastModel && (
                  <span className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                    {lastModel.split('/').pop()}
                  </span>
                )}
              </div>
              <div className="flex rounded-lg border p-0.5">
                <Button
                  type="button"
                  size="sm"
                  variant={compareMode === 'slider' ? 'secondary' : 'ghost'}
                  className="h-7 px-2"
                  onClick={() => setCompareMode('slider')}
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  Curseur
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={compareMode === 'side-by-side' ? 'secondary' : 'ghost'}
                  className="h-7 px-2"
                  onClick={() => setCompareMode('side-by-side')}
                >
                  <Columns2 className="h-3.5 w-3.5 mr-1" />
                  Côte à côte
                </Button>
              </div>
            </div>

            {compareMode === 'slider' ? (
              <ImageCompareSlider beforeSrc={originalUrl} afterSrc={enhancedUrl} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border bg-muted aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={originalUrl}
                    alt="Avant"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="rounded-lg border-2 border-primary/40 bg-muted aspect-square flex items-center justify-center overflow-hidden">
                  <img
                    src={enhancedUrl}
                    alt="Après"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setPhase('loaded')}
                disabled={phase === 'saving'}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Autre instruction
              </Button>
              <Button
                variant="outline"
                onClick={useEnhancedAsSource}
                disabled={phase === 'saving'}
                className="flex-1"
              >
                <Layers className="h-4 w-4 mr-2" />
                Affiner à nouveau
              </Button>
              <Button
                onClick={save}
                disabled={phase === 'saving'}
                className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 text-white"
              >
                {phase === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {phase === 'saved' && savedPublicUrl && (
          <div className="space-y-4">
            <Alert className="border-emerald-500/30 bg-emerald-500/5">
              <Check className="h-4 w-4 text-emerald-600" />
              <AlertDescription>
                Image enregistrée avec succès. Vous pouvez copier l&apos;URL ou continuer à
                travailler.
              </AlertDescription>
            </Alert>
            <div className="rounded-lg border overflow-hidden aspect-video bg-muted flex items-center justify-center">
              <img
                src={savedPublicUrl}
                alt="Image enregistrée"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Nouvelle image
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setEnhancedUrl(null);
                  setPhase('loaded');
                }}
              >
                Améliorer une autre version
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageEnhancerStudio;
