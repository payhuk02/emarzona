/**
 * Page My Courses - Mes Cours (Customer Portal)
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Liste tous cours inscrits
 * - Progression par cours
 * - Statistiques d'apprentissage
 * - Filtres par statut (en cours, terminé)
 * - Recherche par cours
 * - Accès rapide continuer apprentissage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  PlayCircle,
  CheckCircle2,
  Clock,
  Award,
  Calendar,
  BarChart3,
  GraduationCap,
  Sparkles,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { CourseEnrollment as CourseEnrollmentType } from '@/types/courses';

interface CourseEnrollment {
  id: string;
  course_id: string;
  enrollment_date?: string;
  enrolled_at?: string; // Fallback for compatibility
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  last_accessed_at?: string;
  course: {
    id: string;
    product?: {
      id: string;
      name: string;
      description: string;
      image_url?: string;
      slug: string;
    };
  };
}

export default function MyCourses() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState<'all' | 'in-progress' | 'completed'>('all');
  const [error, setError] = useState<string | null>(null);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const coursesRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch enrollments with progress
  const {
    data: enrollments,
    isLoading: itemsLoading,
    error: itemsError,
    refetch,
  } = useQuery({
    queryKey: ['customer-enrollments', user?.id],
    queryFn: async (): Promise<CourseEnrollment[]> => {
      if (!user?.id) return [];

      // Fetch enrollments - Using type assertion for untyped Supabase tables
      // Join courses table and products table to get course and product data
      const { data: enrollmentsData, error } = await (supabase
        .from('course_enrollments' as never)
        .select(
          `
          *,
          course:courses(
            *,
            product:products(
              id,
              name,
              description,
              image_url,
              slug
            )
          )
        `
        )
        .eq('user_id', user.id)
        .order('enrollment_date', { ascending: false, nullsFirst: false }) as {
        data: unknown[] | null;
        error: unknown;
      });

      if (error) throw error;

      // Fetch progress for each enrollment
      const enrollmentsWithProgress = await Promise.all(
        (enrollmentsData || []).map(
          async (enrollment: {
            course_id: string;
            course?: {
              product?: {
                id: string;
                name: string;
                description: string;
                image_url?: string;
                slug: string;
              };
            };
          }) => {
            // Get course sections first
            const { data: sectionsData } = await (supabase
              .from('course_sections' as never)
              .select('id')
              .eq('course_id', enrollment.course_id) as { data: Array<{ id: string }> | null });

            const sectionIds = sectionsData?.map((s: { id: string }) => s.id) || [];

            // Get course lessons count
            const { count: totalLessons } = await (supabase
              .from('course_lessons' as never)
              .select('*', { count: 'exact', head: true })
              .in('section_id', sectionIds.length > 0 ? sectionIds : ['']) as {
              count: number | null;
            });

            // Get lesson IDs for this course
            const { data: lessonsData } = await (supabase
              .from('course_lessons' as never)
              .select('id')
              .in('section_id', sectionIds.length > 0 ? sectionIds : ['']) as {
              data: Array<{ id: string }> | null;
            });

            const lessonIds = lessonsData?.map((l: { id: string }) => l.id) || [];

            // Get completed lessons count
            const { count: completedLessons } = await (supabase
              .from('course_lesson_progress' as never)
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_completed', true)
              .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['']) as {
              count: number | null;
            });

            const total = totalLessons || 0;
            const completed = completedLessons || 0;
            const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

            // Extract product data from course.product
            const product = enrollment.course?.product || {};

            // Map enrollment data to CourseEnrollment interface
            return {
              id: enrollment.id,
              course_id: enrollment.course_id,
              enrollment_date:
                enrollment.enrollment_date || enrollment.enrolled_at || new Date().toISOString(),
              enrolled_at:
                enrollment.enrolled_at || enrollment.enrollment_date || new Date().toISOString(), // Fallback
              progress_percentage: progress,
              completed_lessons_count: completed,
              total_lessons_count: total,
              last_accessed_at: enrollment.last_accessed_at,
              course: {
                id: enrollment.course?.id || enrollment.course_id,
                product: product,
              },
            } as CourseEnrollment;
          }
        )
      );

      return enrollmentsWithProgress;
    },
    enabled: !!user?.id,
  });

  const isLoading = itemsLoading;

  // Filter items with useMemo - Style Inventaire
  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];

    return enrollments.filter((enrollment: CourseEnrollment) => {
      const courseName = enrollment.course?.product?.name || '';
      const courseSlug = enrollment.course?.product?.slug || '';

      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        courseName.toLowerCase().includes(searchLower) ||
        courseSlug.toLowerCase().includes(searchLower);

      // Tab filter
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'in-progress' &&
          enrollment.progress_percentage < 100 &&
          enrollment.progress_percentage > 0) ||
        (activeTab === 'completed' && enrollment.progress_percentage === 100);

      return matchesSearch && matchesTab;
    });
  }, [enrollments, debouncedSearch, activeTab]);

  // Stats calculation with useMemo - Style Inventaire
  const stats = useMemo(() => {
    return {
      total: enrollments?.length || 0,
      inProgress:
        enrollments?.filter(e => e.progress_percentage < 100 && e.progress_percentage > 0).length ||
        0,
      completed: enrollments?.filter(e => e.progress_percentage === 100).length || 0,
      averageProgress: enrollments?.length
        ? Math.round(
            enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length
          )
        : 0,
    };
  }, [enrollments]);

  // Handle refresh - Style Inventaire
  const handleRefresh = useCallback(() => {
    setError(null);
    refetch();
    logger.info('Courses refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'La liste des cours a été actualisée.',
    });
  }, [refetch, toast]);

  // Keyboard shortcuts - Style Inventaire
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-courses')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-courses') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Error handling - Style Inventaire
  useEffect(() => {
    if (itemsError) {
      const errorMessage = itemsError?.message || 'Erreur lors du chargement des cours';
      setError(errorMessage);
      logger.error('Courses fetch error', { error: itemsError });
    } else {
      setError(null);
    }
  }, [itemsError]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto text-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground">Chargement des cours...</p>
              </div>
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
            {/* Header avec animation - Style Inventaire */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <GraduationCap
                      className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-5 lg:w-5 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mes Cours
                  </span>
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                  Continuez votre apprentissage et suivez votre progression
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  className="min-h-[40px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                >
                  <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">Rafraîchir</span>
                  <span className="sm:hidden">Raf.</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards - Style Inventaire (Purple-Pink Gradient) */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Total Cours',
                  value: stats.total,
                  icon: BookOpen,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: 'En Cours',
                  value: stats.inProgress,
                  icon: PlayCircle,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Terminés',
                  value: stats.completed,
                  icon: Award,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'Progression Moyenne',
                  value: `${stats.averageProgress}%`,
                  icon: BarChart3,
                  color: 'from-purple-600 to-pink-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div
                        className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Error Alert - Style Inventaire */}
            {error && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Search & Filters - Style Inventaire */}
            <Card
              ref={filtersRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      id="search-courses"
                      placeholder="Rechercher par nom de cours..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 pr-8 sm:pr-20 h-9 sm:h-10 text-[10px] sm:text-xs md:text-sm"
                      aria-label="Rechercher"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {searchInput && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => setSearchInput('')}
                          aria-label="Effacer"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs - Style Inventaire */}
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v)}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto">
                <TabsTrigger
                  value="all"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  Tous ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="in-progress"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  En cours ({stats.inProgress})
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  Terminés ({stats.completed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* Courses List - Style Inventaire */}
                <div
                  ref={coursesRef}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
                >
                  {!filteredEnrollments || filteredEnrollments.length === 0 ? (
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                      <CardContent className="py-12 sm:py-16 lg:py-20 text-center">
                        <div className="max-w-md mx-auto">
                          <div className="p-4 rounded-full bg-muted/50 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                            <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                          </div>
                          <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground mb-2 sm:mb-3">
                            Aucun cours trouvé
                          </h3>
                          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-4 sm:mb-6">
                            {searchInput || activeTab !== 'all'
                              ? 'Aucun cours ne correspond à vos critères de recherche'
                              : "Vous n'êtes inscrit à aucun cours pour le moment. Explorez notre catalogue pour découvrir des cours passionnants !"}
                          </p>
                          {!searchInput && activeTab === 'all' && (
                            <Button
                              onClick={() => navigate('/marketplace')}
                              size="lg"
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] px-6 sm:px-8"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Découvrir les cours disponibles
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredEnrollments.map(enrollment => (
                        <Card
                          key={enrollment.id}
                          className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:scale-[1.02] overflow-hidden"
                        >
                          {/* Image du cours */}
                          <div className="relative h-40 sm:h-48 lg:h-52 overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600">
                            {enrollment.course?.product?.image_url ? (
                              <img
                                src={enrollment.course.product.image_url}
                                alt={enrollment.course.product.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-white/60" />
                              </div>
                            )}
                            {/* Badge de statut sur l'image */}
                            <div className="absolute top-3 right-3">
                              {enrollment.progress_percentage === 100 ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white shadow-lg border-0">
                                  <Award className="h-3 w-3 mr-1" />
                                  Terminé
                                </Badge>
                              ) : enrollment.progress_percentage > 0 ? (
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-0">
                                  <PlayCircle className="h-3 w-3 mr-1" />
                                  En cours
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="shadow-lg">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Nouveau
                                </Badge>
                              )}
                            </div>
                          </div>

                          <CardHeader className="p-4 sm:p-6">
                            <CardTitle className="text-sm sm:text-base md:text-lg font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
                              {enrollment.course?.product?.name || 'Cours'}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-[10px] sm:text-xs md:text-sm">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span>
                                Inscrit le{' '}
                                {new Date(
                                  enrollment.enrollment_date || enrollment.enrolled_at || new Date()
                                ).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                            {/* Progress Bar améliorée */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] sm:text-xs md:text-sm">
                                <span className="font-medium text-foreground">Progression</span>
                                <span className="font-bold text-primary">
                                  {enrollment.progress_percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2.5 sm:h-3 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    enrollment.progress_percentage === 100
                                      ? 'bg-gradient-to-r from-green-500 to-green-600'
                                      : enrollment.progress_percentage >= 50
                                        ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                        : enrollment.progress_percentage > 0
                                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                                          : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                  }`}
                                  style={{ width: `${enrollment.progress_percentage}%` }}
                                />
                              </div>
                              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                                {enrollment.completed_lessons_count} /{' '}
                                {enrollment.total_lessons_count} leçons complétées
                              </p>
                            </div>

                            {/* Bouton d'action amélioré */}
                            <Button
                              asChild
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 min-h-[44px] touch-manipulation"
                              variant={
                                enrollment.progress_percentage === 100 ? 'outline' : 'default'
                              }
                            >
                              <Link
                                to={`/courses/${enrollment.course?.product?.slug || ''}`}
                                className="flex items-center justify-center"
                              >
                                {enrollment.progress_percentage === 100 ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    <span>Revoir le cours</span>
                                  </>
                                ) : enrollment.progress_percentage > 0 ? (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    <span>Continuer l'apprentissage</span>
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    <span>Commencer le cours</span>
                                  </>
                                )}
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






