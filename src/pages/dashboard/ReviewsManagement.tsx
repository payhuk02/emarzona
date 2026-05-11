/**
 * Page de Gestion Complète des Reviews & Ratings
 * Date: 31 Janvier 2025
 *
 * Interface complète pour gérer les reviews avec modération, analytics et réponses
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Star,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Flag,
  MessageSquare,
  TrendingUp,
  Users,
  MoreVertical,
  Eye,
  Reply,
  ThumbsUp,
  ThumbsDown,
  Clock,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/stable-dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewReplyForm } from '@/components/reviews/ReviewReplyForm';
import { ReviewStars } from '@/components/reviews/ReviewStars';
import type { Review as ReviewType } from '@/types/review';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  product_type: 'digital' | 'physical' | 'service' | 'course';
  rating: number;
  title?: string;
  content: string;
  verified_purchase: boolean;
  is_featured: boolean;
  is_approved: boolean;
  is_flagged: boolean;
  helpful_count: number;
  not_helpful_count: number;
  reply_count: number;
  reviewer_name?: string;
  reviewer_avatar?: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    image_url?: string;
  };
}

export default function ReviewsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const queryClient = useQueryClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'flagged'>(
    'all'
  );
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [productTypeFilter, setProductTypeFilter] = useState<
    'all' | 'digital' | 'physical' | 'service' | 'course'
  >('all');
  const [viewingReviewId, setViewingReviewId] = useState<string | null>(null);
  const [replyingToReviewId, setReplyingToReviewId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Récupérer les reviews du store
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['store-reviews', store?.id, statusFilter, ratingFilter, productTypeFilter],
    queryFn: async () => {
      if (!store?.id) return [];

      let query = supabase
        .from('reviews')
        .select(
          `
          *,
          product:products(id, name, image_url)
        `
        )
        .eq('product.store_id', store.id);

      // Filtre par statut
      if (statusFilter === 'approved') {
        query = query.eq('is_approved', true).eq('is_flagged', false);
      } else if (statusFilter === 'pending') {
        query = query.eq('is_approved', false);
      } else if (statusFilter === 'flagged') {
        query = query.eq('is_flagged', true);
      }

      // Filtre par note
      if (ratingFilter !== 'all') {
        query = query.eq('rating', parseInt(ratingFilter));
      }

      // Filtre par type de produit
      if (productTypeFilter !== 'all') {
        query = query.eq('product_type', productTypeFilter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching reviews', { error, storeId: store.id });
        throw error;
      }

      return (data || []) as Review[];
    },
    enabled: !!store?.id,
  });

  // Filtrer par recherche
  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews;

    const query = searchQuery.toLowerCase();
    return reviews.filter(
      r =>
        r.content.toLowerCase().includes(query) ||
        r.title?.toLowerCase().includes(query) ||
        r.product?.name.toLowerCase().includes(query) ||
        r.reviewer_name?.toLowerCase().includes(query)
    );
  }, [reviews, searchQuery]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: reviews.length,
      approved: reviews.filter(r => r.is_approved && !r.is_flagged).length,
      pending: reviews.filter(r => !r.is_approved).length,
      flagged: reviews.filter(r => r.is_flagged).length,
      averageRating:
        reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      fiveStar: reviews.filter(r => r.rating === 5).length,
      fourStar: reviews.filter(r => r.rating === 4).length,
      threeStar: reviews.filter(r => r.rating === 3).length,
      twoStar: reviews.filter(r => r.rating === 2).length,
      oneStar: reviews.filter(r => r.rating === 1).length,
    };
  }, [reviews]);

  // Mutations
  const approveReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: true, is_flagged: false })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
      toast({
        title: '✅ Review approuvée',
        description: 'La review a été approuvée avec succès',
      });
    },
  });

  const rejectReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_approved: false })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
      toast({
        title: '✅ Review rejetée',
        description: 'La review a été rejetée',
      });
    },
  });

  const flagReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_flagged: true })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
      toast({
        title: '✅ Review signalée',
        description: 'La review a été signalée',
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
      setDeletingReviewId(null);
      toast({
        title: '✅ Review supprimée',
        description: 'La review a été supprimée avec succès',
      });
    },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ reviewId, featured }: { reviewId: string; featured: boolean }) => {
      const { error } = await supabase
        .from('reviews')
        .update({ is_featured: featured })
        .eq('id', reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
      toast({
        title: '✅ Review mise à jour',
        description: 'Le statut "en vedette" a été mis à jour',
      });
    },
  });

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await deleteReview.mutateAsync(reviewId);
    } catch (_error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer la review',
        variant: 'destructive',
      });
    }
  };

  if (storeLoading || reviewsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6 space-y-6">
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
                    <Star className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Reviews & Ratings
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Gérez et modérez les avis clients de votre boutique
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div
              ref={statsRef}
              className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Note Moyenne</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold">
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '-'}
                  </div>
                  {stats.averageRating > 0 && (
                    <ReviewStars
                      rating={Math.round(stats.averageRating)}
                      size="sm"
                      className="mt-1"
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Approuvées</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {stats.approved}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">En Attente</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Signalées</CardTitle>
                  <Flag className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.flagged}</div>
                </CardContent>
              </Card>
            </div>

            {/* Répartition des notes */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition des Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = stats[`${rating}Star` as keyof typeof stats] as number;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <div className="flex items-center gap-1 w-20">
                          <span className="text-sm font-medium">{rating}</span>
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </div>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrer & Rechercher
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une review..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={v => setStatusFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="approved">Approuvées</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="flagged">Signalées</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ratingFilter} onValueChange={v => setRatingFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les notes</SelectItem>
                      <SelectItem value="5">5 étoiles</SelectItem>
                      <SelectItem value="4">4 étoiles</SelectItem>
                      <SelectItem value="3">3 étoiles</SelectItem>
                      <SelectItem value="2">2 étoiles</SelectItem>
                      <SelectItem value="1">1 étoile</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={productTypeFilter} onValueChange={v => setProductTypeFilter(v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les types</SelectItem>
                      <SelectItem value="digital">Digitaux</SelectItem>
                      <SelectItem value="physical">Physiques</SelectItem>
                      <SelectItem value="service">Services</SelectItem>
                      <SelectItem value="course">Cours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Liste des reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({filteredReviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {searchQuery ||
                      statusFilter !== 'all' ||
                      ratingFilter !== 'all' ||
                      productTypeFilter !== 'all'
                        ? 'Aucune review ne correspond à vos critères'
                        : 'Aucune review pour votre boutique'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map(review => (
                      <Card key={review.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Header */}
                              <div className="flex items-start gap-3">
                                {review.product?.image_url ? (
                                  <img
                                    src={review.product.image_url}
                                    alt={review.product.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                    <Star className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold">
                                      {review.product?.name || 'Produit'}
                                    </h4>
                                    <Badge variant="outline">{review.product_type}</Badge>
                                    {review.is_featured && (
                                      <Badge variant="default" className="bg-yellow-600">
                                        En vedette
                                      </Badge>
                                    )}
                                    {review.verified_purchase && (
                                      <Badge variant="secondary">Achat vérifié</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ReviewStars rating={review.rating} size="sm" />
                                    <span className="text-sm text-muted-foreground">
                                      {review.reviewer_name || 'Anonyme'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      •{' '}
                                      {format(new Date(review.created_at), 'dd MMM yyyy', {
                                        locale: fr,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Content */}
                              {review.title && <h5 className="font-medium">{review.title}</h5>}
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {review.content}
                              </p>

                              {/* Stats */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{review.helpful_count}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>
                                    {review.reply_count} réponse{review.reply_count > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewingReviewId(review.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setReplyingToReviewId(review.id)}>
                                  <Reply className="h-4 w-4 mr-2" />
                                  Répondre
                                </DropdownMenuItem>
                                {!review.is_approved && (
                                  <DropdownMenuItem onClick={() => approveReview.mutate(review.id)}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approuver
                                  </DropdownMenuItem>
                                )}
                                {review.is_approved && (
                                  <DropdownMenuItem onClick={() => rejectReview.mutate(review.id)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rejeter
                                  </DropdownMenuItem>
                                )}
                                {!review.is_flagged && (
                                  <DropdownMenuItem onClick={() => flagReview.mutate(review.id)}>
                                    <Flag className="h-4 w-4 mr-2" />
                                    Signaler
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() =>
                                    toggleFeatured.mutate({
                                      reviewId: review.id,
                                      featured: !review.is_featured,
                                    })
                                  }
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  {review.is_featured
                                    ? 'Retirer de la vedette'
                                    : 'Mettre en vedette'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingReviewId(review.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dialog Détails Review */}
            <Dialog
              open={!!viewingReviewId}
              onOpenChange={open => !open && setViewingReviewId(null)}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Détails de la Review</DialogTitle>
                </DialogHeader>
                {viewingReviewId &&
                  (() => {
                    const review = reviews.find(r => r.id === viewingReviewId);
                    if (!review) return null;
                    return <ReviewCard review={review as unknown as ReviewType} showReplies />;
                  })()}
              </DialogContent>
            </Dialog>

            {/* Dialog Réponse */}
            <Dialog
              open={!!replyingToReviewId}
              onOpenChange={open => !open && setReplyingToReviewId(null)}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Répondre à la Review</DialogTitle>
                </DialogHeader>
                {replyingToReviewId && (
                  <ReviewReplyForm
                    reviewId={replyingToReviewId}
                    onSuccess={() => {
                      setReplyingToReviewId(null);
                      queryClient.invalidateQueries({ queryKey: ['store-reviews'] });
                    }}
                    onCancel={() => setReplyingToReviewId(null)}
                  />
                )}
              </DialogContent>
            </Dialog>

            {/* Dialog Suppression */}
            <AlertDialog
              open={!!deletingReviewId}
              onOpenChange={open => !open && setDeletingReviewId(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette review ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. La review sera définitivement supprimée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deletingReviewId && handleDeleteReview(deletingReviewId)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
