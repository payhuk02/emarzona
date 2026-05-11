/**
 * <ImageStudioField />
 *
 * Champ image plug-and-play : ouvre le Studio IA dans une Dialog et
 * injecte automatiquement l'URL publique dans le formulaire (`onChange`).
 *
 * Modes contextuels : passez `context="services" | "shop" | "profile" | "product" | "cover"`
 * pour pré-configurer automatiquement folder, bucket et preset IA.
 *
 * Usage minimal :
 *   <ImageStudioField context="services" value={url} onChange={setUrl} />
 *
 * Avec react-hook-form :
 *   <Controller name="image_url" control={control} render={({ field }) => (
 *     <ImageStudioField context="shop" value={field.value} onChange={field.onChange} />
 *   )} />
 */

import React, { useMemo, useState } from 'react';
import { Sparkles, ImageIcon, X, ExternalLink, Loader2, Lock, LockOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ImageEnhancerStudio, STUDIO_PRESETS } from './ImageEnhancerStudio';
import { SmartImage } from './SmartImage';
import { detectImageContext, detectImageContextDetailed } from '@/lib/images/detectContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/** Contextes pré-configurés (folder + bucket + preset IA recommandé). */
export type ImageStudioContext =
  | 'services'
  | 'shop'
  | 'profile'
  | 'product'
  | 'cover'
  | 'generic';

interface ContextConfig {
  folder: string;
  bucket: string;
  /** Index du preset par défaut (0=premium, 1=fond blanc, 2=studio pro, 3=vibrant). */
  presetIndex: number;
  defaultLabel: string;
  hint: string;
}

const CONTEXT_MAP: Record<ImageStudioContext, ContextConfig> = {
  services: {
    folder: 'services',
    bucket: 'service-images',
    presetIndex: 2, // Style studio pro
    defaultLabel: 'Image du service',
    hint: 'Format paysage recommandé — sera affichée sur la fiche service.',
  },
  shop: {
    folder: 'shop',
    bucket: 'service-images',
    presetIndex: 0, // Optimisation premium
    defaultLabel: 'Visuel de la boutique',
    hint: 'Apparaît en couverture de votre boutique.',
  },
  profile: {
    folder: 'profile',
    bucket: 'service-images',
    presetIndex: 0, // Optimisation premium
    defaultLabel: 'Photo de profil',
    hint: 'Visible sur votre profil public et vos messages.',
  },
  product: {
    folder: 'products',
    bucket: 'service-images',
    presetIndex: 1, // Fond blanc épuré
    defaultLabel: 'Image produit',
    hint: 'Fond blanc recommandé pour un rendu e-commerce premium.',
  },
  cover: {
    folder: 'covers',
    bucket: 'service-images',
    presetIndex: 3, // Couleurs vibrantes
    defaultLabel: 'Image de couverture',
    hint: 'Bannière haute qualité — couleurs riches.',
  },
  generic: {
    folder: 'enhanced',
    bucket: 'service-images',
    presetIndex: 0,
    defaultLabel: 'Image',
    hint: 'Image optimisée par IA.',
  },
};

export interface ImageStudioFieldProps {
  /** URL courante (valeur du champ). */
  value?: string | null;
  /** Callback déclenché à l'enregistrement d'une nouvelle image. */
  onChange: (url: string) => void;
  /** Contexte explicite — sinon détecté depuis `fieldName`. */
  context?: ImageStudioContext;
  /** Nom du champ du formulaire (ex: 'image_produit', 'fond_studio'). Utilisé pour auto-détecter le contexte. */
  fieldName?: string;
  /** Image d'exemple à pré-remplir dans le Studio. */
  exampleUrl?: string;

  // Surcharges optionnelles (rare)
  label?: string;
  description?: string;
  folder?: string;
  bucket?: string;
  presetIndex?: number;

  buttonLabel?: string;
  allowClear?: boolean;
  previewClassName?: string;
  className?: string;
}

export const ImageStudioField: React.FC<ImageStudioFieldProps> = ({
  value,
  onChange,
  context,
  fieldName,
  exampleUrl,
  label,
  description,
  folder,
  bucket,
  presetIndex,
  buttonLabel,
  allowClear = true,
  previewClassName,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Clé de persistance du verrou par champ
  const lockKey = fieldName ? `imgstudio:lock:${fieldName}` : null;

  // Verrou chargé depuis localStorage (contexte + preset figés pour ce fieldName)
  const [lock, setLock] = useState<{
    context: ImageStudioContext;
    presetIndex?: number;
  } | null>(() => {
    if (typeof window === 'undefined' || !lockKey) return null;
    try {
      const raw = window.localStorage.getItem(lockKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Détection détaillée (pour contexte + suggestions ambiguës)
  const detection = useMemo(
    () => (fieldName ? detectImageContextDetailed(fieldName) : null),
    [fieldName],
  );

  // Contexte effectif : explicite > verrou > détecté depuis fieldName > 'generic'
  const effectiveContext: ImageStudioContext = useMemo(() => {
    if (context) return context;
    if (lock) return lock.context;
    if (detection) return detection.context;
    return 'generic';
  }, [context, lock, detection]);

  // Suggestions alternatives uniquement si ambigu ET pas de contexte explicite / verrouillé
  const suggestions: ImageStudioContext[] =
    !context && !lock && detection?.confidence === 'low' ? detection.suggestions : [];

  const [overrideContext, setOverrideContext] = useState<ImageStudioContext | null>(null);
  const resolvedContext: ImageStudioContext = overrideContext ?? effectiveContext;

  const cfg = useMemo(() => {
    const base = CONTEXT_MAP[resolvedContext] ?? CONTEXT_MAP.generic;
    const effectivePresetIndex =
      presetIndex ?? (lock && !overrideContext ? lock.presetIndex : undefined) ?? base.presetIndex;
    return {
      folder: folder ?? base.folder,
      bucket: bucket ?? base.bucket,
      presetIndex: effectivePresetIndex,
      label: label ?? base.defaultLabel,
      hint: description ?? base.hint,
    };
  }, [resolvedContext, folder, bucket, presetIndex, label, description, lock, overrideContext]);

  const currentPreset = STUDIO_PRESETS[cfg.presetIndex] ?? STUDIO_PRESETS[0];

  const lockCurrent = () => {
    if (!lockKey) return;
    try {
      const payload = { context: resolvedContext, presetIndex: cfg.presetIndex };
      window.localStorage.setItem(lockKey, JSON.stringify(payload));
      setLock(payload);
      toast({
        title: '🔒 Verrou activé',
        description: `Contexte « ${resolvedContext} » + preset « ${currentPreset.label} » restaurés à chaque ouverture de « ${fieldName} ».`,
      });
    } catch {
      toast({
        title: 'Impossible de verrouiller',
        description: 'Le stockage local est indisponible.',
        variant: 'destructive',
      });
    }
  };

  const unlock = () => {
    if (!lockKey) return;
    try {
      window.localStorage.removeItem(lockKey);
    } catch {
      /* ignore */
    }
    setLock(null);
    setOverrideContext(null);
    toast({
      title: '🔓 Verrou retiré',
      description: `La détection automatique reprend pour « ${fieldName} ».`,
    });
  };

  const toggleLock = () => (lock ? unlock() : lockCurrent());


  // L'image initiale du studio = image courante OU exemple fourni
  const initialUrl = value || exampleUrl || undefined;

  const handleSaved = (url: string) => {
    setIsSaving(false);
    onChange(url);
    setOpen(false);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          {cfg.label}
          <Badge
            variant={lock ? 'default' : 'outline'}
            className={cn(
              'text-[10px] uppercase tracking-wide',
              lock && 'bg-primary/15 text-primary border-primary/30 hover:bg-primary/20',
            )}
          >
            {lock && <Lock className="h-2.5 w-2.5 mr-1 inline" />}
            {resolvedContext}
          </Badge>
          {overrideContext && (
            <button
              type="button"
              onClick={() => setOverrideContext(null)}
              className="text-[10px] text-muted-foreground hover:text-foreground underline"
              title="Revenir au contexte auto-détecté"
            >
              auto
            </button>
          )}
          {lockKey && !context && (
            <button
              type="button"
              onClick={toggleLock}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition-colors',
                lock
                  ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
              title={
                lock
                  ? 'Déverrouiller — la détection automatique reprendra'
                  : 'Verrouiller ce contexte et ce preset pour ce champ'
              }
            >
              {lock ? (
                <>
                  <Lock className="h-2.5 w-2.5" /> verrouillé
                </>
              ) : (
                <>
                  <LockOpen className="h-2.5 w-2.5" /> verrouiller
                </>
              )}
            </button>
          )}
        </Label>
        {value && allowClear && !isSaving && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={() => onChange('')}
          >
            <X className="h-3 w-3 mr-1" />
            Retirer
          </Button>
        )}
      </div>
      {cfg.hint && <p className="text-xs text-muted-foreground">{cfg.hint}</p>}

      {/* Suggestion quand le nom de champ est ambigu */}
      {suggestions.length > 0 && !overrideContext && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground">
            Le champ « {fieldName} » est ambigu. Autre contexte possible :
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOverrideContext(s)}
              className="rounded-full border border-border bg-background hover:bg-muted px-2 py-0.5 font-medium transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Aperçu */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center',
          previewClassName ?? 'aspect-video',
        )}
      >
        {value ? (
          <SmartImage
            src={value}
            alt={cfg.label}
            className="w-full h-full object-cover"
          />
        ) : exampleUrl ? (
          <div className="relative w-full h-full">
            <SmartImage
              src={exampleUrl}
              alt="Exemple"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
              <Badge variant="secondary" className="text-xs">
                Exemple — cliquez pour personnaliser
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
            <ImageIcon className="h-10 w-10 mb-2 opacity-40" />
            <p className="text-sm">Aucune image sélectionnée</p>
            <p className="text-xs opacity-70">
              Utilisez le Studio IA pour en créer une optimisée
            </p>
          </div>
        )}

        {isSaving && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Upload en cours…
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Dialog open={open} onOpenChange={(o) => !isSaving && setOpen(o)}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant={value ? 'outline' : 'default'}
              size="sm"
              disabled={isSaving}
              className={cn(
                !value &&
                  'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90',
              )}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {buttonLabel ??
                (value ? 'Modifier avec le Studio IA' : 'Ouvrir le Studio IA')}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Studio IA — {cfg.label}
              </DialogTitle>
              <DialogDescription className="space-y-1">
                <span className="block">
                  Contexte actif : <strong>{resolvedContext}</strong> · Preset :{' '}
                  <strong>
                    {currentPreset.emoji} {currentPreset.label}
                  </strong>
                  .
                </span>
                {lock ? (
                  <span className="block text-primary">
                    🔒 Verrouillé — à la prochaine ouverture de « {fieldName} », le Studio restaurera{' '}
                    <strong>{lock.context}</strong>
                    {typeof lock.presetIndex === 'number' && STUDIO_PRESETS[lock.presetIndex] && (
                      <>
                        {' '}
                        avec le preset{' '}
                        <strong>
                          {STUDIO_PRESETS[lock.presetIndex].emoji}{' '}
                          {STUDIO_PRESETS[lock.presetIndex].label}
                        </strong>
                      </>
                    )}
                    .
                  </span>
                ) : (
                  <span className="block">Vous pouvez tout ajuster ou verrouiller ce choix.</span>
                )}
              </DialogDescription>
            </DialogHeader>

            {/* Barre de gestion du verrou */}
            {lockKey && !context && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs">
                <span className="text-muted-foreground flex-1 min-w-[180px]">
                  {lock
                    ? 'Ce champ a un contexte verrouillé.'
                    : 'Fixez ce choix pour ne plus voir la détection changer.'}
                </span>
                {!lock && (
                  <Button type="button" size="sm" variant="outline" onClick={lockCurrent}>
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Verrouiller ce choix
                  </Button>
                )}
                {lock && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={unlock}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LockOpen className="h-3.5 w-3.5 mr-1.5" />
                    Réinitialiser le verrou
                  </Button>
                )}
              </div>
            )}

            <ImageEnhancerStudio
              folder={cfg.folder}
              bucket={cfg.bucket}
              initialUrl={initialUrl}
              initialPresetIndex={cfg.presetIndex}
              onSaved={handleSaved}
            />
          </DialogContent>
        </Dialog>

        {value && (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Voir l'image
          </a>
        )}
      </div>
    </div>
  );
};

export default ImageStudioField;
