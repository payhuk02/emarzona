import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, Loader2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  listStoreAppearanceRevisions,
  restoreStoreAppearanceRevision,
  type StoreAppearanceRevisionSummary,
} from '@/lib/storefront/store-appearance-revisions';

interface StoreAppearanceRevisionsPanelProps {
  storeId: string;
  /** Bumps after each publish so the panel reloads (mount alone sees 0 revisions). */
  reloadToken?: string | null;
  isSubmitting?: boolean;
  onRestored?: () => void | Promise<void>;
}

export function StoreAppearanceRevisionsPanel({
  storeId,
  reloadToken = null,
  isSubmitting = false,
  onRestored,
}: StoreAppearanceRevisionsPanelProps) {
  const { t } = useTranslation();
  const [revisions, setRevisions] = useState<StoreAppearanceRevisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringRevision, setRestoringRevision] = useState<number | null>(null);
  const [confirmRevision, setConfirmRevision] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRevisions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listStoreAppearanceRevisions(storeId, 8);
      setRevisions(rows);
    } catch {
      setError(t('store.appearance.revisionsLoadError'));
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, t]);

  useEffect(() => {
    void loadRevisions();
  }, [loadRevisions, reloadToken]);

  const handleRestore = useCallback(async () => {
    if (confirmRevision == null) return;
    setRestoringRevision(confirmRevision);
    setError(null);
    try {
      await restoreStoreAppearanceRevision(storeId, confirmRevision);
      setConfirmRevision(null);
      await loadRevisions();
      await onRestored?.();
    } catch {
      setError(t('store.appearance.revisionsRestoreError'));
    } finally {
      setRestoringRevision(null);
    }
  }, [confirmRevision, storeId, loadRevisions, onRestored, t]);

  if (loading && revisions.length === 0) {
    return (
      <Card data-testid="store-appearance-revisions-panel">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('store.appearance.revisionsLoading')}
        </CardContent>
      </Card>
    );
  }

  if (revisions.length === 0) {
    return null;
  }

  return (
    <>
      <Card data-testid="store-appearance-revisions-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            {t('store.appearance.revisionsTitle')}
          </CardTitle>
          <CardDescription>{t('store.appearance.revisionsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <ul className="space-y-2">
            {revisions.map(revision => (
              <li
                key={revision.revision_number}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {t('store.appearance.revisionLabel', { number: revision.revision_number })}
                  </span>
                  <span className="text-muted-foreground">
                    {' '}
                    — {new Date(revision.published_at).toLocaleString()}
                  </span>
                  {revision.primary_color && (
                    <span
                      className="ml-2 inline-block h-3 w-3 rounded-full border align-middle"
                      style={{ backgroundColor: revision.primary_color }}
                      title={revision.primary_color}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting || restoringRevision != null}
                  onClick={() => setConfirmRevision(revision.revision_number)}
                  className="gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  {t('store.appearance.restoreRevision')}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog open={confirmRevision != null} onOpenChange={() => setConfirmRevision(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('store.appearance.restoreConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('store.appearance.restoreConfirmDescription', { number: confirmRevision ?? 0 })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoringRevision != null}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={restoringRevision != null}
              onClick={event => {
                event.preventDefault();
                void handleRestore();
              }}
            >
              {restoringRevision != null
                ? t('store.appearance.restoring')
                : t('store.appearance.restoreRevision')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
