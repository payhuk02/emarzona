/**
 * <ImageEnhancerStudio />
 *
 * Studio premium pour améliorer une image avec l'IA :
 * 1. Sélection d'une image (drag & drop ou clic)
 * 2. Prévisualisation côte-à-côte avant / après
 * 3. Choix d'une instruction (preset ou custom)
 * 4. Enregistrement définitif dans le bucket Supabase
 *
 * Réutilisable dans n'importe quel formulaire / éditeur :
 *   <ImageEnhancerStudio onSaved={(url) => setValue('image', url)} />
 */

import React, { useCallback, useRef, useState } from 'react';
import { Sparkles, Loader2, Upload, RotateCcw, Check, ImagePlus, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useImageOptimizer } from '@/hooks/useImageOptimizer';
import { compressImage, blobToFile } from '@/lib/images/compress';
import { imageUrlToBlob } from '@/lib/images/imageUrlToBlob';
import { cn } from '@/lib/utils';

interface ImageEnhancerStudioProps {
  /** Sous-dossier dans le bucket (par défaut: "enhanced"). */
  folder?: string;
  /** Bucket Supabase Storage. */
  bucket?: string;
  /** Callback quand l'utilisateur enregistre l'image améliorée. */
  onSaved?: (publicUrl: string) => void;
  /** Image initiale à éditer (URL). */
  initialUrl?: string;
  /** Index du preset présélectionné (0-3). */
  initialPresetIndex?: number;
  className?: string;
}

export const STUDIO_PRESET_KEYS = ['premium', 'white-bg', 'studio-pro', 'vibrant'] as const;
export type StudioPresetKey = (typeof STUDIO_PRESET_KEYS)[number];

export const STUDIO_PRESETS: { label: string; instruction: string; emoji: string }[] = [
  {
    label: 'Optimisation premium',
    emoji: '✨',
    instruction:
      'Improve this image for a premium e-commerce listing: enhance lighting and contrast, sharpen details, balance colors, remove visual noise. Keep the subject 100% identical.',
  },
  {
    label: 'Fond blanc épuré',
    emoji: '⚪',
    instruction:
      'Replace the background with a pure clean white studio background. Keep the subject perfectly intact with realistic shadows.',
  },
  {
    label: 'Style studio pro',
    emoji: '📸',
    instruction:
      'Transform this into a professional studio photo with soft diffused lighting, high resolution, and a slight depth-of-field. Subject must remain identical.',
  },
  {
    label: 'Couleurs vibrantes',
    emoji: '🎨',
    instruction:
      'Boost colors slightly to make them vibrant and appealing while keeping skin tones and product colors realistic. Increase clarity.',
  },
];

type Phase = 'idle' | 'loaded' | 'enhancing' | 'preview' | 'saving';

export const ImageEnhancerStudio: React.FC<ImageEnhancerStudioProps> = ({
  folder = 'enhanced',
  bucket = 'service-images',
  onSaved,
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

  const safePreset = Math.min(Math.max(initialPresetIndex, 0), STUDIO_PRESETS.length - 1);
  const [originalUrl, setOriginalUrl] = useState<string | null>(initialUrl ?? null);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState(STUDIO_PRESETS[safePreset].instruction);
  const [activePreset, setActivePreset] = useState(safePreset);
  const [phase, setPhase] = useState<Phase>(initialUrl ? 'loaded' : 'idle');
  const [dragOver, setDragOver] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  /** Historique des presets appliqués pendant cette session du Studio. */
  const [history, setHistory] = useState<
    Array<{ label: string; emoji: string; instruction: string; at: number }>
  >([]);

  const reset = useCallback(() => {
    setOriginalUrl(null);
    setEnhancedUrl(null);
    setOriginalFile(null);
    setPhase('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
          description: 'Taille maximum: 10 MB.',
          variant: 'destructive',
        });
        return;
      }
      setOriginalFile(file);
      setOriginalUrl(URL.createObjectURL(file));
      setEnhancedUrl(null);
      setPhase('loaded');
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
    if (!originalUrl) return;
    setPhase('enhancing');
    setLastError(null);
    try {
      // Si c'est un blob: local, on lit en data URL pour que l'IA puisse y accéder
      let payloadUrl = originalUrl;
      if (originalUrl.startsWith('blob:') && originalFile) {
        payloadUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = reject;
          r.readAsDataURL(originalFile);
        });
      }

      const { data, error } = await supabase.functions.invoke('enhance-image', {
        body: { imageUrl: payloadUrl, instruction },
      });
      if (error) throw error;
      const newUrl = (data as { imageUrl?: string })?.imageUrl;
      if (!newUrl) throw new Error("Aucune image renvoyée par l'IA");

      setEnhancedUrl(newUrl);
      setPhase('preview');
      const currentPreset = STUDIO_PRESETS[activePreset];
      setHistory(h =>
        [
          {
            label: currentPreset?.label ?? 'Custom',
            emoji: currentPreset?.emoji ?? '🪄',
            instruction,
            at: Date.now(),
          },
          ...h,
        ].slice(0, 8)
      );
      toast({
        title: '✨ Aperçu prêt',
        description: 'Comparez avant / après puis enregistrez si vous êtes satisfait.',
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

  const save = async () => {
    if (!enhancedUrl) return;
    setPhase('saving');
    setLastError(null);
    try {
      const blob = await imageUrlToBlob(enhancedUrl);
      const tempFile = new File([blob], `enhanced-${Date.now()}.png`, {
        type: blob.type || 'image/png',
      });

      // Compression supplémentaire en WebP avant upload
      const { blob: compressed } = await compressImage(tempFile, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.88,
        mimeType: 'image/webp',
      });
      const finalFile = blobToFile(compressed, tempFile.name);

      const result = await uploadOptimized(finalFile);
      onSaved?.(result.publicUrl);

      toast({
        title: '✅ Image enregistrée',
        description: `Optimisée: ${(result.optimizedSize / 1024).toFixed(0)} Ko (${result.width}×${result.height}px).`,
      });
      reset();
    } catch (err) {
      setPhase('preview');
      const msg = err instanceof Error ? err.message : 'Erreur inconnue';
      setLastError(msg);
      toast({
        title: "Erreur d'enregistrement",
        description: msg,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6 space-y-6">
        {/* Header */}
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
                Améliorez vos images en un clic — comparez avant d'enregistrer.
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

        {/* Bannière Upload en cours */}
        {(phase === 'saving' || isUploading) && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Upload en cours…</p>
              <p className="text-xs text-muted-foreground truncate">
                Compression WebP + envoi sécurisé vers le stockage. Ne fermez pas cette fenêtre.
              </p>
              {progress > 0 && <Progress value={progress} className="h-1.5 mt-2" />}
            </div>
          </div>
        )}

        {/* Panneau d'erreur avec retry */}
        {lastError && phase !== 'enhancing' && phase !== 'saving' && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">
                  Le Studio IA a rencontré un problème
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-words">{lastError}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setLastError(null);
                  if (phase === 'preview' && enhancedUrl) {
                    void save();
                  } else {
                    void enhance();
                  }
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

        {/* 1. SÉLECTION */}
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
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — 10 MB max</p>
          </div>
        )}

        {/* 2. CHOIX INSTRUCTION (si image chargée, pas encore prévisualisée) */}
        {(phase === 'loaded' || phase === 'enhancing') && originalUrl && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden border bg-muted aspect-video flex items-center justify-center">
              <img
                src={originalUrl}
                alt="Image originale à améliorer"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Style d'amélioration</Label>
              <div className="grid grid-cols-2 gap-2">
                {STUDIO_PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setActivePreset(i);
                      setInstruction(p.instruction);
                    }}
                    className={cn(
                      'text-left text-sm rounded-lg border px-3 py-2 transition-colors',
                      activePreset === i
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <span className="mr-2">{p.emoji}</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Historique des presets appliqués */}
            {history.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Historique de cette session ({history.length})
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((h, i) => (
                    <button
                      key={`${h.at}-${i}`}
                      type="button"
                      disabled={phase === 'enhancing'}
                      onClick={() => {
                        setInstruction(h.instruction);
                        const idx = STUDIO_PRESETS.findIndex(p => p.label === h.label);
                        if (idx >= 0) setActivePreset(idx);
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 hover:bg-muted px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
                      title={h.instruction}
                    >
                      <span>{h.emoji}</span>
                      <span className="truncate max-w-[140px]">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="custom-instruction" className="text-sm font-medium">
                Personnaliser l'instruction (anglais recommandé)
              </Label>
              <Textarea
                id="custom-instruction"
                rows={3}
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="Ex: replace background with white, enhance lighting, sharpen…"
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
                  L'IA analyse votre image…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer l'aperçu IA
                </>
              )}
            </Button>
          </div>
        )}

        {/* 3. PRÉVISUALISATION AVANT/APRÈS */}
        {(phase === 'preview' || phase === 'saving') && originalUrl && enhancedUrl && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Avant
                  </Label>
                  <Badge variant="outline" className="text-[10px]">
                    Original
                  </Badge>
                </div>
                <div className="rounded-lg overflow-hidden border bg-muted aspect-square flex items-center justify-center">
                  <img
                    src={originalUrl}
                    alt="Image originale"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Après
                  </Label>
                  <Badge className="text-[10px] bg-gradient-to-r from-blue-600 to-emerald-600">
                    ✨ IA
                  </Badge>
                </div>
                <div className="rounded-lg overflow-hidden border-2 border-primary/50 bg-muted aspect-square flex items-center justify-center">
                  <img
                    src={enhancedUrl}
                    alt="Image améliorée par IA"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {(isUploading || phase === 'saving') && progress > 0 && (
              <Progress value={progress} className="h-2" />
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setPhase('loaded')}
                disabled={phase === 'saving'}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Réessayer avec une autre instruction
              </Button>
              <Button
                onClick={save}
                disabled={phase === 'saving'}
                className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white"
              >
                {phase === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Enregistrer définitivement
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ImageEnhancerStudio;
