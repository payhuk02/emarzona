import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, RefreshCw, RotateCcw, UploadCloud } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { usePlatformHeroImageMap } from '@/hooks/usePlatformHeroImage';
import { useAdminPageHeroImages } from '@/hooks/admin/useAdminPageHeroImages';
import { MARKETING_HERO_PAGES, type MarketingHeroGroup } from '@/config/marketing-hero-images';
import { logger } from '@/lib/logger';

type Props = {
  onChange?: () => void;
};

function HeroCard({
  slug,
  label,
  route,
  defaultUrl,
  currentUrl,
  busy,
  onUpload,
  onReset,
}: {
  slug: string;
  label: string;
  route: string;
  defaultUrl: string;
  currentUrl?: string;
  busy: boolean;
  onUpload: (file: File) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isCustom = !!currentUrl;
  const displayUrl = currentUrl || defaultUrl;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Label className="text-base font-semibold">{label}</Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{route}</p>
        </div>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {isCustom ? 'Personnalisée' : 'Par défaut'}
        </span>
      </div>

      <div className="relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/10">
        <img
          src={displayUrl}
          alt={label}
          className={`max-h-[180px] w-full object-cover ${!isCustom ? 'opacity-80' : ''}`}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/55 opacity-0 backdrop-blur-[2px] transition-opacity hover:opacity-100">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-4 w-4" />
            )}
            {isCustom ? 'Remplacer' : 'Uploader'}
          </Button>
          {isCustom && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={onReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Image par défaut
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onUpload(file);
          }}
        />
      </div>

      <Link
        to={route}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Voir la page
        <ExternalLink className="h-3 w-3" />
      </Link>
      <span className="sr-only">{slug}</span>
    </div>
  );
}

function HeroGroup({
  title,
  description,
  group,
  onChange,
}: {
  title: string;
  description: string;
  group: MarketingHeroGroup;
  onChange?: () => void;
}) {
  const { toast } = useToast();
  const { data: overrides } = usePlatformHeroImageMap();
  const { upload, reset } = useAdminPageHeroImages();
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const pages = MARKETING_HERO_PAGES.filter(p => p.group === group);

  const handleUpload = async (slug: string, file: File) => {
    try {
      setBusySlug(slug);
      await upload.mutateAsync({ slug, file });
      onChange?.();
      toast({
        title: 'Image enregistrée',
        description: 'Le visuel hero est synchronisé sur la page publique.',
      });
    } catch (error) {
      logger.error('Hero image upload failed', { error, slug });
      toast({
        title: "Échec de l'upload",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder l'image.",
        variant: 'destructive',
      });
    } finally {
      setBusySlug(null);
    }
  };

  const handleReset = async (slug: string, currentUrl?: string) => {
    try {
      setBusySlug(slug);
      await reset.mutateAsync({ slug, currentUrl });
      onChange?.();
      toast({
        title: 'Image réinitialisée',
        description: 'La page utilise à nouveau le visuel par défaut.',
      });
    } catch (error) {
      logger.error('Hero image reset failed', { error, slug });
      toast({
        title: 'Échec de la réinitialisation',
        description: error instanceof Error ? error.message : 'Impossible de rétablir le défaut.',
        variant: 'destructive',
      });
    } finally {
      setBusySlug(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {pages.map(page => (
          <HeroCard
            key={page.slug}
            slug={page.slug}
            label={page.label}
            route={page.route}
            defaultUrl={page.defaultUrl}
            currentUrl={overrides?.[page.slug]}
            busy={busySlug === page.slug}
            onUpload={file => void handleUpload(page.slug, file)}
            onReset={() => void handleReset(page.slug, overrides?.[page.slug])}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export function PageHeroImagesMediaSection({ onChange }: Props) {
  return (
    <div className="space-y-6">
      <HeroGroup
        title="Pages Solutions — Hero droite"
        description="Visuels 4:3 affiches a droite du hero. PNG / WebP / JPG, 4 Mo max. Sans override, l'image par defaut est utilisee."
        group="solutions"
        onChange={onChange}
      />
      <HeroGroup
        title="Pages Fonctionnalités — Hero droite"
        description="Même principe pour chaque page Fonctionnalités. Les changements sont visibles immédiatement sur le site public."
        group="features"
        onChange={onChange}
      />
    </div>
  );
}
