/**
 * Dashboard Étudiant - Mes Cours (Version Optimisée)
 * Affiche tous les cours auxquels l'utilisateur est inscrit avec progression
 * Version optimisée avec fonctionnalités avancées et design professionnel
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  Trophy,
  GraduationCap,
  Search,
  Filter,
  Grid3X3,
  List,
  X,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Calendar,
  Award,
  Users,
  Star,
  BarChart3
} from 'lucide-react';
import { useMyEnrollments } from '@/hooks/courses/useCourseEnrollment';
import { useCourseProgressPercentage } from '@/hooks/courses/useCourseProgress';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const ITEMS_PER_PAGE = 9;
const PAGINATION_OPTIONS = [9, 18, 27, 36];

interface CourseCardProps {
  enrollment: any;
  viewMode?: 'grid' | 'list';
}

const CourseCard = ({ enrollment, viewMode = 'grid' }: CourseCardProps) => {
  const navigate = useNavigate();
  const { percentage, completedLessons, totalLessons } = useCourseProgressPercentage(enrollment.id);
  const product = enrollment.course?.product;
  const course = enrollment.course;
  const [imageError, setImageError] = useState(false);

  if (!product || !course) return null;

  const handleContinue = useCallback(() => {
    logger.info(`Navigation vers le cours: ${product.slug}`);
    navigate(`/courses/${product.slug}`);
  }, [navigate, product.slug]);

  const getProgressColor = () => {
    if (percentage === 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage > 0) return 'bg-orange-500';
    return 'bg-gray-400';
  };

  if (viewMode === 'list') {
    return (
      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-left-2">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Image */}
          <div className="relative w-full sm:w-48 lg:w-56 h-40 sm:h-full min-h-[160px] overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
            {product.primary_image_url && !imageError ? (
              <img
                src={product.primary_image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 text-white/60" />
              </div>
            )}
            {percentage === 100 && (
              <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-lg animate-in zoom-in-95 duration-200">
                <Trophy className="w-3 h-3 mr-1" />
                Terminé
              </Badge>
            )}
            {percentage > 0 && percentage < 100 && (
              <Badge className="absolute top-2 right-2 bg-blue-600 text-white shadow-lg animate-in zoom-in-95 duration-200">
                En cours
              </Badge>
            )}
          </div>

          {/* Contenu */}
          <CardContent className="flex-1 p-3 sm:p-4 lg:p-6 flex flex-col justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-1.5 sm:mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3">
                  {product.short_description || product.description?.replace(/<[^>]*>/g, '') || 'Aucune description disponible'}
                </p>
              </div>

              {/* Barre de progression */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium">{percentage}% complété</span>
                  <span className="text-muted-foreground">
                    {completedLessons}/{totalLessons} leçons
                  </span>
                </div>
                <Progress value={percentage} className={`h-1.5 sm:h-2 ${getProgressColor()}`} />
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{course.total_lessons || 0} leçons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>
                    {Math.floor((course.total_duration_minutes || 0) / 60)}h {(course.total_duration_minutes || 0) % 60}m
                  </span>
                </div>
                {course.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton continuer */}
            <Button
              className="w-full sm:w-auto sm:ml-auto mt-3 sm:mt-0 text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[40px]"
              onClick={handleContinue}
            >
              <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {percentage === 0 ? 'Commencer' : percentage === 100 ? 'Revoir le cours' : 'Continuer'}
            </Button>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group shadow-sm hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/30 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="relative overflow-hidden rounded-t-lg">
        {/* Image du cours */}
        <div className="h-40 sm:h-48 lg:h-52 overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700">
          {product.primary_image_url && !imageError ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-white/60 group-hover:scale-110 transition-transform duration-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Badge de progression */}
        {percentage === 100 && (
          <Badge className="absolute top-2 right-2 bg-green-600 text-white shadow-lg animate-in zoom-in-95 duration-200 z-10">
            <Trophy className="w-3 h-3 mr-1" />
            Terminé
          </Badge>
        )}
        {percentage > 0 && percentage < 100 && (
          <Badge className="absolute top-2 right-2 bg-blue-600 text-white shadow-lg animate-in zoom-in-95 duration-200 z-10">
            En cours
          </Badge>
        )}
        {percentage === 0 && (
          <Badge className="absolute top-2 right-2 bg-gray-600 text-white shadow-lg animate-in zoom-in-95 duration-200 z-10">
            Nouveau
          </Badge>
        )}
      </div>

      <CardContent className="p-3 sm:p-4 lg:p-6 space-y-2.5 sm:space-y-3">
        {/* Titre et description */}
        <div className="space-y-1.5 sm:space-y-2">
          <h3 className="text-sm sm:text-base lg:text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {product.short_description || product.description?.replace(/<[^>]*>/g, '') || 'Aucune description disponible'}
          </p>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium">{percentage}% complété</span>
            <span className="text-muted-foreground">
              {completedLessons}/{totalLessons} leçons
            </span>
          </div>
          <Progress value={percentage} className={`h-1.5 sm:h-2 ${getProgressColor()}`} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-[10px] sm:text-xs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{course.total_lessons || 0} leçons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>
              {Math.floor((course.total_duration_minutes || 0) / 60)}h {(course.total_duration_minutes || 0) % 60}m
            </span>
          </div>
          {course.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{course.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Bouton continuer */}
        <Button
          className="w-full text-xs sm:text-sm touch-manipulation min-h-[36px] sm:min-h-[40px] hover:scale-105 active:scale-95 transition-transform duration-200"
          onClick={handleContinue}
        >
          <PlayCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
          {percentage === 0 ? 'Commencer' : percentage === 100 ? 'Revoir le cours' : 'Continuer'}
        </Button>
      </CardContent>
    </Card>
  );
};

const MyCourses = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: enrollments, isLoading, error, refetch } = useMyEnrollments();

  // États
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'progress' | 'name' | 'duration'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const coursesRef = useScrollAnimation<HTMLDivElement>();

  // Calculer les statistiques globales
  const stats = useMemo(() => {
    if (!enrollments) return { total: 0, completed: 0, inProgress: 0, notStarted: 0 };

    const total = enrollments.length;
    const completed = enrollments.filter((e: any) => {
      return e.completed_lessons === e.total_lessons && e.total_lessons > 0;
    }).length;
    const inProgress = enrollments.filter((e: any) => {
      return e.completed_lessons > 0 && e.completed_lessons < e.total_lessons;
    }).length;
    const notStarted = total - completed - inProgress;

    return { total, completed, inProgress, notStarted };
  }, [enrollments]);

  // Filtrer et trier les cours
  const filteredAndSortedCourses = useMemo(() => {
    if (!enrollments) return [];

    let filtered = [...enrollments];

    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((enrollment: any) => {
        const product = enrollment.course?.product;
        return (
          product?.name?.toLowerCase().includes(query) ||
          product?.description?.toLowerCase().includes(query) ||
          product?.short_description?.toLowerCase().includes(query)
        );
      });
    }

    // Filtre de statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter((enrollment: any) => {
        if (statusFilter === 'completed') {
          return enrollment.completed_lessons === enrollment.total_lessons && enrollment.total_lessons > 0;
        }
        if (statusFilter === 'in_progress') {
          return enrollment.completed_lessons > 0 && enrollment.completed_lessons < enrollment.total_lessons;
        }
        if (statusFilter === 'not_started') {
          return enrollment.completed_lessons === 0;
        }
        return true;
      });
    }

    // Tri
    filtered.sort((a: any, b: any) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at || b.enrolled_at || 0).getTime() - new Date(a.created_at || a.enrolled_at || 0).getTime();
      }
      if (sortBy === 'progress') {
        const progressA = a.total_lessons > 0 ? (a.completed_lessons / a.total_lessons) * 100 : 0;
        const progressB = b.total_lessons > 0 ? (b.completed_lessons / b.total_lessons) * 100 : 0;
        return progressB - progressA;
      }
      if (sortBy === 'name') {
        const nameA = a.course?.product?.name || '';
        const nameB = b.course?.product?.name || '';
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'duration') {
        const durationA = a.course?.total_duration_minutes || 0;
        const durationB = b.course?.total_duration_minutes || 0;
        return durationB - durationA;
      }
      return 0;
    });

    return filtered;
  }, [enrollments, searchQuery, statusFilter, sortBy]);

  // Pagination
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCourses.slice(startIndex, endIndex);
  }, [filteredAndSortedCourses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedCourses.length / itemsPerPage);

  // Handlers
  const handleRefresh = useCallback(() => {
    logger.info('Actualisation de la liste des cours');
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des cours mise à jour",
    });
  }, [refetch, toast]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setSortBy('recent');
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).tagName === 'INPUT' ||
        (e.target as HTMLElement).tagName === 'TEXTAREA' ||
        (e.target as HTMLElement).tagName === 'SELECT'
      ) {
        return;
      }

      // Cmd/Ctrl + K : Focus sur la recherche
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }

      // G : Basculer vue grille/liste
      if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Logging
  useEffect(() => {
    if (enrollments) {
      logger.info(`${enrollments.length} cours chargés`);
    }
  }, [enrollments]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur-md shadow-sm transition-all duration-300" role="banner">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-6 overflow-hidden">
              <SidebarTrigger 
                aria-label={t('dashboard.sidebarToggle', 'Toggle sidebar')}
                className="hover:bg-accent/50 transition-colors duration-200 flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px]"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <h1 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate px-1" id="courses-title">
                  {t('courses.myCourses', 'Mes Cours')}
                </h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 flex-shrink-0">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  aria-label={t('common.refresh', 'Actualiser')}
                  className="sm:hidden hover:scale-110 active:scale-95 transition-transform duration-200 touch-manipulation min-h-[44px] min-w-[44px]"
                  title="Actualiser"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRefresh} 
                  disabled={isLoading}
                  aria-label={t('common.refresh', 'Actualiser')}
                  className="hidden sm:flex hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation min-h-[36px]"
                  title="Actualiser (F5)"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                  <span className="hidden lg:inline ml-2">{t('common.refresh', 'Actualiser')}</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden" role="main" aria-labelledby="courses-title">
            {isLoading ? (
              <div className="p-4 sm:p-6 lg:p-8">
                <Skeleton className="h-10 w-64 mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-96" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="p-4 sm:p-6 lg:p-8">
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('courses.error.loading', 'Erreur lors du chargement de vos cours.')}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <>
                {/* Hero Section - Bannière Bleue Professionnelle */}
                <div 
                  ref={headerRef}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700"
                >
                  <div 
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundRepeat: 'repeat',
                    }}
                  ></div>
                  <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex items-center gap-3 mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 rounded-lg bg-white/10 backdrop-blur-sm">
                        <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
                      </div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
                        {t('courses.myCourses', 'Mes Cours')}
                      </h1>
                    </div>
                    <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-blue-100 max-w-2xl">
                      {t('courses.subtitle', 'Suivez votre progression et continuez votre apprentissage')}
                    </p>
                    <div className="mt-4 sm:mt-6 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300 animate-pulse" />
                      <span className="text-xs sm:text-sm text-blue-100">
                        {stats.total} {stats.total > 1 ? t('courses.courses', 'cours') : t('courses.course', 'cours')} {stats.total > 0 ? t('courses.enrolled', 'inscrits') : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 lg:p-8 space-y-3 sm:space-y-4 lg:space-y-6">
                  {/* Statistiques */}
                  <div 
                    ref={statsRef}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                    role="region"
                    aria-label={t('courses.stats.ariaLabel', 'Statistiques des cours')}
                  >
                    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium">
                          {t('courses.stats.total', 'Total des cours')}
                        </CardTitle>
                        <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-200 flex-shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats.total}</div>
                        <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                          {t('courses.stats.totalDescription', 'Cours inscrits')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium">
                          {t('courses.stats.inProgress', 'En cours')}
                        </CardTitle>
                        <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-200 flex-shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats.inProgress}</div>
                        <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                          {t('courses.stats.inProgressDescription', 'En progression')}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group hover:shadow-md transition-all duration-300 border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4 lg:p-6">
                        <CardTitle className="text-[11px] sm:text-xs lg:text-sm font-medium">
                          {t('courses.stats.completed', 'Terminés')}
                        </CardTitle>
                        <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600 group-hover:text-green-700 transition-colors duration-200 flex-shrink-0" />
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats.completed}</div>
                        <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground">
                          {t('courses.stats.completedDescription', 'Cours terminés')}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Filtres et recherche */}
                  {stats.total > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-4 bg-card/30 rounded-lg border border-border/30 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {/* Recherche */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          type="search"
                          placeholder={t('courses.search.placeholder', 'Rechercher un cours... (Cmd/Ctrl+K)')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-9 sm:pr-20 h-9 sm:h-10 bg-background/50 border-border/50 focus:bg-background focus:border-primary/50 transition-all duration-200"
                        />
                        {searchQuery ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent/50 transition-all duration-200 z-10"
                            aria-label="Effacer la recherche"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-muted-foreground pointer-events-none">
                            <kbd className="hidden sm:inline-flex px-1.5 py-0.5 bg-muted/80 rounded border border-border/50 font-mono">
                              ⌘K
                            </kbd>
                          </div>
                        )}
                      </div>

                      {/* Filtres */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                          <SelectTrigger className="w-full sm:w-[140px] lg:w-[160px] h-9 sm:h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                            <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <SelectValue placeholder={t('courses.filters.status', 'Statut')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('courses.filters.all', 'Tous les statuts')}</SelectItem>
                            <SelectItem value="completed">{t('courses.filters.completed', 'Terminés')}</SelectItem>
                            <SelectItem value="in_progress">{t('courses.filters.inProgress', 'En cours')}</SelectItem>
                            <SelectItem value="not_started">{t('courses.filters.notStarted', 'Non commencés')}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-full sm:w-[140px] lg:w-[160px] h-9 sm:h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all duration-200">
                            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                            <SelectValue placeholder={t('courses.sort.placeholder', 'Trier par')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="recent">{t('courses.sort.recent', 'Plus récents')}</SelectItem>
                            <SelectItem value="progress">{t('courses.sort.progress', 'Progression')}</SelectItem>
                            <SelectItem value="name">{t('courses.sort.name', 'Nom (A-Z)')}</SelectItem>
                            <SelectItem value="duration">{t('courses.sort.duration', 'Durée')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Vue grille/liste */}
                        <div className="flex items-center gap-1 border border-border/50 rounded-lg p-1 bg-background/50">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-7 sm:h-8 w-7 sm:w-8 p-0 transition-all duration-200 hover:scale-110"
                            aria-label="Vue en grille"
                            title="Vue en grille (G)"
                          >
                            <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="h-7 sm:h-8 w-7 sm:w-8 p-0 transition-all duration-200 hover:scale-110"
                            aria-label="Vue en liste"
                            title="Vue en liste (G)"
                          >
                            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        {(searchQuery || statusFilter !== 'all' || sortBy !== 'recent') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="h-9 sm:h-10 text-xs sm:text-sm hover:bg-accent/50 transition-all duration-200"
                          >
                            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">{t('common.clearFilters', 'Réinitialiser')}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Résultats */}
                  {filteredAndSortedCourses.length === 0 ? (
                    <Card className="shadow-sm border-border/50 bg-card/30 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                      <CardContent className="py-8 sm:py-12 text-center">
                        <GraduationCap className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground animate-pulse" />
                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-2">
                          {searchQuery || statusFilter !== 'all' 
                            ? t('courses.empty.noResults', 'Aucun cours trouvé')
                            : t('courses.empty.noCourses', 'Aucun cours pour le moment')}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                          {searchQuery || statusFilter !== 'all'
                            ? t('courses.empty.noResultsDescription', 'Essayez de modifier vos filtres de recherche')
                            : t('courses.empty.noCoursesDescription', 'Explorez notre catalogue et inscrivez-vous à votre premier cours !')}
                        </p>
                        {(searchQuery || statusFilter !== 'all') && (
                          <Button 
                            variant="outline" 
                            onClick={clearFilters}
                            className="hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
                          >
                            {t('common.clearFilters', 'Réinitialiser les filtres')}
                          </Button>
                        )}
                        {!searchQuery && statusFilter === 'all' && (
                          <Button 
                            onClick={() => navigate('/marketplace')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 group"
                          >
                            <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                            {t('courses.empty.explore', 'Explorer les cours')}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Info et pagination supérieure */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-4 bg-card/50 rounded-lg border border-border/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-medium text-foreground">
                            {filteredAndSortedCourses.length} {filteredAndSortedCourses.length > 1 ? t('courses.courses', 'cours') : t('courses.course', 'cours')} {t('courses.found', 'trouvé')}{filteredAndSortedCourses.length > 1 ? 's' : ''}
                          </p>
                          {searchQuery && (
                            <Badge variant="secondary" className="text-xs">
                              {t('courses.search.result', 'Recherche')}: {searchQuery}
                            </Badge>
                          )}
                        </div>
                        {totalPages > 1 && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                            <label htmlFor="items-per-page" className="sr-only">{t('common.itemsPerPage', 'Éléments par page')}</label>
                            <span className="hidden sm:inline">{t('common.displaying', 'Affichage de')}</span>
                            <select
                              id="items-per-page"
                              value={itemsPerPage}
                              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                              className="px-2 py-1.5 border rounded-md bg-background text-xs sm:text-sm hover:bg-accent/50 transition-colors duration-200 focus:ring-2 focus:ring-primary focus:ring-offset-1"
                              aria-label={t('common.selectItemsPerPage', 'Sélectionner le nombre d\'éléments par page')}
                            >
                              {PAGINATION_OPTIONS.map(option => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                            <span className="hidden sm:inline">{t('common.perPage', 'par page')}</span>
                            <span className="sm:hidden">/ page</span>
                          </div>
                        )}
                      </div>

                      {/* Liste des cours */}
                      <div 
                        ref={coursesRef}
                        className={viewMode === 'grid' 
                          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                          : "space-y-2.5 sm:space-y-3 lg:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                        }
                        role="region"
                        aria-label={t('courses.list.ariaLabel', 'Liste des cours')}
                      >
                        {paginatedCourses.map((enrollment: any, index) => (
                          <div
                            key={enrollment.id}
                            className="animate-in fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <CourseCard enrollment={enrollment} viewMode={viewMode} />
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Card className="shadow-sm border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
                          <CardContent className="p-3 sm:p-4">
                            <nav className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4" role="navigation" aria-label={t('courses.pagination.ariaLabel', 'Navigation des pages')}>
                              <div className="text-xs sm:text-sm text-muted-foreground font-medium">
                                {t('courses.pagination.page', 'Page')} {currentPage} <span className="hidden sm:inline">{t('courses.pagination.of', 'sur')}</span> <span className="sm:hidden">/</span> {totalPages}
                              </div>

                              <div className="flex items-center gap-1" role="group" aria-label={t('courses.pagination.controls', 'Contrôles de pagination')}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(1)}
                                  disabled={currentPage === 1}
                                  aria-label={t('courses.pagination.firstPage', 'Première page')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40 touch-manipulation"
                                >
                                  <span className="sr-only">{t('courses.pagination.firstPage', 'Première page')}</span>
                                  «
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage - 1)}
                                  disabled={currentPage === 1}
                                  aria-label={t('courses.pagination.previousPage', 'Page précédente')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40 touch-manipulation"
                                >
                                  <span className="sr-only">{t('courses.pagination.previousPage', 'Page précédente')}</span>
                                  ‹
                                </Button>

                                <div className="flex items-center gap-1 px-1 sm:px-2">
                                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                      pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                      pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                      pageNumber = totalPages - 4 + i;
                                    } else {
                                      pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                      <Button
                                        key={pageNumber}
                                        variant={currentPage === pageNumber ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(pageNumber)}
                                        className="min-w-[32px] sm:min-w-[36px] h-8 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                                        aria-label={`${t('courses.pagination.goToPage', 'Aller à la page')} ${pageNumber}`}
                                        aria-current={currentPage === pageNumber ? "page" : undefined}
                                      >
                                        {pageNumber}
                                      </Button>
                                    );
                                  })}
                                </div>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(currentPage + 1)}
                                  disabled={currentPage === totalPages}
                                  aria-label={t('courses.pagination.nextPage', 'Page suivante')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40 touch-manipulation"
                                >
                                  <span className="sr-only">{t('courses.pagination.nextPage', 'Page suivante')}</span>
                                  ›
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePageChange(totalPages)}
                                  disabled={currentPage === totalPages}
                                  aria-label={t('courses.pagination.lastPage', 'Dernière page')}
                                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-all duration-200 disabled:opacity-40 touch-manipulation"
                                >
                                  <span className="sr-only">{t('courses.pagination.lastPage', 'Dernière page')}</span>
                                  »
                                </Button>
                              </div>
                            </nav>
                          </CardContent>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MyCourses;
