/**
 * Création express de boutique — 3 champs, TTFV < 60s (Sprint 1).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Download,
  Calendar,
  GraduationCap,
  Palette,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useStores } from '@/hooks/useStores';
import { useStoreContext } from '@/contexts/StoreContext';
import { toUserErrorMessage } from '@/lib/user-error-message';
import {
  STORE_COMMERCE_TYPES,
  STORE_COMMERCE_TYPE_LABELS,
  type StoreCommerceType,
} from '@/constants/store-commerce-types';
import {
  getStoreOnboardingPath,
  getStoreVerticalProfile,
} from '@/lib/commerce/store-vertical-config';
import { getRecommendedThemeTemplates, type StoreThemeTemplate } from '@/lib/store-theme-templates';
import { isStoreSlugAvailable } from '@/lib/store/create-store-service';
import { normalizeExpressSlugPreview } from '@/lib/store/store-express-create-schema';
import { generateSlug } from '@/lib/store-utils';
import { isSubdomainReserved } from '@/lib/subdomain-detector';
import { cn } from '@/lib/utils';

const COMMERCE_TYPE_ICONS: Record<StoreCommerceType, typeof Package> = {
  physical: Package,
  digital: Download,
  service: Calendar,
  course: GraduationCap,
  artist: Palette,
};

interface StoreExpressCreateFormProps {
  onSuccess?: () => void;
  onAdvancedSetup?: () => void;
}

export function StoreExpressCreateForm({
  onSuccess,
  onAdvancedSetup,
}: StoreExpressCreateFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createStore } = useStores();
  const { refreshStores, canCreateStore, storeQuota } = useStoreContext();
  const { trackEvent } = useAnalytics();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [commerceType, setCommerceType] = useState<StoreCommerceType>('physical');
  const [themeTemplateId, setThemeTemplateId] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugReserved, setSlugReserved] = useState(false);

  const quotaBlocked = storeQuota != null && !storeQuota.can_create;
  const quotaHint = useMemo(() => {
    if (!storeQuota) return null;
    if (storeQuota.max_stores == null) {
      return t('store.quality.quotaUnlimited');
    }
    if (!storeQuota.can_create) {
      return t('store.quality.quotaReached', {
        used: storeQuota.used_stores,
        max: storeQuota.max_stores,
      });
    }
    return t('store.quality.quotaRemaining', {
      used: storeQuota.used_stores,
      max: storeQuota.max_stores,
      remaining: storeQuota.remaining_stores ?? 0,
    });
  }, [storeQuota, t]);

  const verticalProfile = useMemo(() => getStoreVerticalProfile(commerceType), [commerceType]);
  const recommendedTemplates = useMemo(
    () => getRecommendedThemeTemplates(commerceType).slice(0, 3),
    [commerceType]
  );

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    // Modifier le nom régénère toujours le lien boutique (modifiable ensuite).
    setSlug(normalizeExpressSlugPreview(value));
  }, []);

  const handleSlugChange = useCallback((value: string) => {
    setSlug(generateSlug(value));
  }, []);

  useEffect(() => {
    setThemeTemplateId(verticalProfile.defaultThemeTemplateId);
  }, [commerceType, verticalProfile.defaultThemeTemplateId]);

  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      setSlugReserved(false);
      return;
    }

    if (isSubdomainReserved(slug)) {
      setSlugAvailable(false);
      setSlugReserved(true);
      return;
    }

    setSlugReserved(false);

    const timer = window.setTimeout(async () => {
      setIsCheckingSlug(true);
      try {
        const available = await isStoreSlugAvailable(slug);
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(null);
      } finally {
        setIsCheckingSlug(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [slug]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!canCreateStore()) {
        toast({
          title: t('store.form.common.limitReachedTitle'),
          description:
            storeQuota && storeQuota.max_stores != null
              ? t('store.quality.quotaReached', {
                  used: storeQuota.used_stores,
                  max: storeQuota.max_stores,
                })
              : t('store.form.common.limitReachedDescription'),
          variant: 'destructive',
        });
        return;
      }

      const trimmedName = name.trim();
      if (!trimmedName) {
        toast({
          title: t('store.form.common.error'),
          description: t('store.express.nameRequired'),
          variant: 'destructive',
        });
        return;
      }

      if (slugAvailable === false) {
        toast({
          title: t('store.form.common.error'),
          description: slugReserved
            ? t('store.form.common.slugReserved', { slug })
            : t('store.form.common.slugTakenChooseOther'),
          variant: 'destructive',
        });
        return;
      }

      setIsSubmitting(true);
      const startedAt = Date.now();

      try {
        const createdStore = await createStore(
          {
            name: trimmedName,
            slug: slug.trim() || undefined,
            commerce_type: commerceType,
          },
          {
            mode: 'express',
            themeTemplateId: themeTemplateId ?? verticalProfile.defaultThemeTemplateId,
          }
        );

        await refreshStores();

        void trackEvent({
          storeId: createdStore.id,
          eventType: 'store_create_started',
          eventData: {
            mode: 'express',
            commerce_type: commerceType,
            template_id: themeTemplateId ?? verticalProfile.defaultThemeTemplateId,
            started_at: new Date(startedAt).toISOString(),
          },
        });
        void trackEvent({
          storeId: createdStore.id,
          eventType: 'store_create_completed',
          eventData: {
            mode: 'express',
            commerce_type: commerceType,
            template_id: themeTemplateId ?? verticalProfile.defaultThemeTemplateId,
            duration_ms: Date.now() - startedAt,
          },
        });

        const redirectTarget = getStoreOnboardingPath(createdStore.id, commerceType);
        navigate(redirectTarget, { replace: true });
        onSuccess?.();
      } catch (error: unknown) {
        const message = toUserErrorMessage(error) || t('store.form.common.unknownError');
        toast({
          title: t('store.form.common.error'),
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      canCreateStore,
      commerceType,
      createStore,
      name,
      navigate,
      onSuccess,
      refreshStores,
      slug,
      slugAvailable,
      slugReserved,
      storeQuota,
      t,
      themeTemplateId,
      toast,
      trackEvent,
      verticalProfile.defaultThemeTemplateId,
    ]
  );

  const canSubmit =
    name.trim().length > 0 &&
    slug.length >= 2 &&
    slugAvailable !== false &&
    !isSubmitting &&
    !isCheckingSlug &&
    !quotaBlocked;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="store-express-create-form">
      <Card>
        <CardHeader>
          <CardTitle>{t('store.express.title')}</CardTitle>
          <CardDescription>{t('store.express.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {quotaHint && (
            <Alert
              variant={quotaBlocked ? 'destructive' : 'default'}
              data-testid="store-quota-hint"
            >
              <AlertDescription>{quotaHint}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="express-store-name">{t('store.form.basicInfo.storeName')}</Label>
            <Input
              id="express-store-name"
              data-testid="store-express-name"
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder={t('store.form.basicInfo.namePlaceholder')}
              autoComplete="organization"
              maxLength={100}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="express-store-slug">
              {t('store.form.basicInfo.urlSlug')}
              {isCheckingSlug && (
                <Loader2 className="inline-block ml-2 h-3.5 w-3.5 animate-spin" aria-hidden />
              )}
              {!isCheckingSlug && slugAvailable === true && slug.length >= 2 && (
                <CheckCircle2
                  className="inline-block ml-2 h-3.5 w-3.5 text-green-600"
                  aria-hidden
                />
              )}
              {!isCheckingSlug && slugAvailable === false && (
                <XCircle className="inline-block ml-2 h-3.5 w-3.5 text-destructive" aria-hidden />
              )}
            </Label>
            <Input
              id="express-store-slug"
              data-testid="store-express-slug"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              placeholder={t('store.form.basicInfo.urlSlugPlaceholder')}
              autoComplete="off"
              maxLength={63}
              disabled={isSubmitting}
              aria-describedby="express-store-slug-hint"
            />
            {slug.length >= 2 && (
              <p id="express-store-slug-hint" className="text-sm text-muted-foreground">
                {t('store.express.urlPreview', { slug })}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{t('store.express.slugHint')}</p>
            {slugAvailable === false && (
              <p className="text-sm text-destructive">
                {slugReserved
                  ? t('store.form.common.slugReserved', { slug })
                  : t('store.form.common.slugTakenChooseOther')}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>{t('store.form.basicInfo.commerceType')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {STORE_COMMERCE_TYPES.map(type => {
                const Icon = COMMERCE_TYPE_ICONS[type];
                const profile = getStoreVerticalProfile(type);
                const selected = commerceType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    data-testid={`store-express-commerce-${type}`}
                    disabled={isSubmitting}
                    onClick={() => setCommerceType(type)}
                    className={cn(
                      'flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                      <span className="font-medium text-sm">
                        {STORE_COMMERCE_TYPE_LABELS[type]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {profile.tagline}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>{t('store.express.themeLabel')}</Label>
              <Badge variant="secondary" className="text-xs">
                {t('store.form.common.optional')}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedTemplates.map((template: StoreThemeTemplate) => {
                const isDefault = template.id === verticalProfile.defaultThemeTemplateId;
                const selected = themeTemplateId === template.id;

                return (
                  <button
                    key={template.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setThemeTemplateId(template.id)}
                    className={cn(
                      'rounded-lg border-2 p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    )}
                  >
                    <div className="flex gap-1 h-8 rounded overflow-hidden mb-2">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: template.preview.primaryColor }}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: template.preview.secondaryColor }}
                      />
                      <div
                        className="flex-1"
                        style={{ backgroundColor: template.preview.accentColor }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-sm font-medium">{template.name}</span>
                      {isDefault && (
                        <Sparkles
                          className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                          aria-hidden
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Alert>
            <AlertDescription>{t('store.express.deferHint')}</AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Button
              type="submit"
              data-testid="store-express-create-submit"
              disabled={!canSubmit}
              className="min-h-[44px] sm:min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('store.form.common.creating')}
                </>
              ) : (
                t('store.form.common.createStore')
              )}
            </Button>

            {onAdvancedSetup && (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 text-muted-foreground"
                onClick={onAdvancedSetup}
                disabled={isSubmitting}
              >
                <Settings2 className="h-4 w-4" aria-hidden />
                {t('store.express.advancedSetup')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default StoreExpressCreateForm;
