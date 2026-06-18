/**
 * Liste vendeur — cours en ligne de la boutique (gestion catalogue).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useStore } from '@/hooks/useStore';
import { useSellerCourseProducts } from '@/hooks/courses/useSellerCourseProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import { GraduationCap, Plus, Search, Edit, BookOpen, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { formatFcfa } from '@/lib/format/fcfa';

export default function SellerCoursesList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { store } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: courses = [], isLoading } = useSellerCourseProducts(store?.id);

  const filtered = courses.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', deleteId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['seller-course-products', store?.id] });
      toast({ title: t('courses.seller.deleted', 'Cours supprimé') });
      setDeleteId(null);
    } catch {
      toast({
        title: t('common.error', 'Erreur'),
        description: t('courses.seller.deleteError', 'Impossible de supprimer ce cours'),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="container mx-auto space-y-4 p-3 sm:space-y-6 sm:p-4 md:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-base font-bold sm:text-xl md:text-2xl lg:text-3xl">
              <GraduationCap className="h-6 w-6 text-purple-500" aria-hidden />
              {t('courses.seller.title', 'Mes cours en ligne')}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {t('courses.seller.subtitle', 'Gérez vos formations, modules et publications')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/courses/new')}
            size="sm"
            className="text-xs sm:text-sm"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
            {t('courses.seller.create', 'Nouveau cours')}
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('courses.seller.search', 'Rechercher un cours...')}
            className="min-h-[44px] pl-9 text-xs sm:text-sm"
          />
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('courses.seller.empty', 'Aucun cours pour le moment')}
              </p>
              <Button className="mt-4" onClick={() => navigate('/dashboard/courses/new')}>
                {t('courses.seller.createFirst', 'Créer votre premier cours')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(course => {
              const meta = course.courses?.[0];
              return (
                <Card key={course.id} className="overflow-hidden">
                  {course.image_url ? (
                    <img
                      src={course.image_url}
                      alt=""
                      className="h-36 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center bg-muted">
                      <GraduationCap className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="line-clamp-2 font-semibold leading-snug">{course.name}</h2>
                      <Badge variant={course.is_draft ? 'secondary' : 'default'}>
                        {course.is_draft
                          ? t('courses.seller.draft', 'Brouillon')
                          : course.is_active
                            ? t('courses.seller.published', 'Publié')
                            : t('courses.seller.inactive', 'Inactif')}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">{formatFcfa(course.price)}</p>
                    {meta && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {meta.total_lessons ?? 0} {t('courses.seller.lessons', 'leçons')}
                      </p>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => navigate(`/dashboard/products/${course.id}/edit`)}
                      >
                        <Edit className="mr-1 h-3.5 w-3.5" />
                        {t('common.edit', 'Modifier')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(course.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        {t('common.delete', 'Supprimer')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('courses.seller.deleteTitle', 'Supprimer ce cours ?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'courses.seller.deleteDesc',
                'Cette action est irréversible. Les inscriptions existantes peuvent être affectées.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t('common.cancel', 'Annuler')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Supprimer')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppPageShell>
  );
}
