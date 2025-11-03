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

import { useState, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
// Progress component (fallback if not exists)
const Progress = ({ value }: { value: number }) => (
  <div className="w-full bg-secondary rounded-full h-2">
    <div
      className="bg-primary rounded-full h-2 transition-all"
      style={{ width: `${value}%` }}
    />
  </div>
);
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface CourseEnrollment {
  id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  completed_lessons_count: number;
  total_lessons_count: number;
  last_accessed_at: string;
  course: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    slug: string;
  };
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch enrollments with progress
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['customer-enrollments', user?.id],
    queryFn: async (): Promise<CourseEnrollment[]> => {
      if (!user?.id) return [];

      // Fetch enrollments
      const { data: enrollmentsData, error } = await supabase
        .from('course_enrollments')
        .select('*, course:course_id(id, name, description, image_url, slug)')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Fetch progress for each enrollment
      const enrollmentsWithProgress = await Promise.all(
        (enrollmentsData || []).map(async (enrollment: any) => {
          // Get course lessons count
          const { count: totalLessons } = await supabase
            .from('course_lessons')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', 
              await supabase
                .from('course_sections')
                .select('id')
                .eq('course_id', enrollment.course_id)
                .then(({ data }) => data?.map(s => s.id) || [])
            );

          // Get completed lessons count
          const { count: completedLessons } = await supabase
            .from('course_lesson_completions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('course_id', enrollment.course_id)
            .eq('completed', true);

          const total = totalLessons || 0;
          const completed = completedLessons || 0;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          return {
            ...enrollment,
            progress_percentage: progress,
            completed_lessons_count: completed,
            total_lessons_count: total,
            course: enrollment.course || {},
          } as CourseEnrollment;
        })
      );

      return enrollmentsWithProgress;
    },
    enabled: !!user?.id,
  });

  // Filter enrollments
  const filteredEnrollments = enrollments?.filter((enrollment) => {
    const courseName = enrollment.course?.name || '';
    const matchesSearch = courseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'completed') {
      matchesStatus = enrollment.progress_percentage === 100;
    } else if (statusFilter === 'in-progress') {
      matchesStatus = enrollment.progress_percentage < 100 && enrollment.progress_percentage > 0;
    }
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: enrollments?.length || 0,
    inProgress: enrollments?.filter(e => e.progress_percentage < 100 && e.progress_percentage > 0).length || 0,
    completed: enrollments?.filter(e => e.progress_percentage === 100).length || 0,
    averageProgress: enrollments?.length
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length)
      : 0,
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/account')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h1 className="text-3xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8" />
                    Mes Cours
                  </h1>
                </div>
                <p className="text-muted-foreground">
                  Continuez votre apprentissage et suivez votre progression
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cours</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Cours inscrits</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En Cours</CardTitle>
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <p className="text-xs text-muted-foreground">En apprentissage</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminés</CardTitle>
                  <Award className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <p className="text-xs text-muted-foreground">Complétés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progression Moyenne</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.averageProgress}%</div>
                  <p className="text-xs text-muted-foreground">Sur tous vos cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un cours..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Status Filter */}
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="in-progress">En cours</TabsTrigger>
                      <TabsTrigger value="completed">Terminés</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Courses List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {filteredEnrollments?.length || 0} {filteredEnrollments?.length === 1 ? 'cours' : 'cours'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!filteredEnrollments || filteredEnrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun cours</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Aucun cours ne correspond à vos critères'
                        : 'Vous n\'êtes inscrit à aucun cours pour le moment'}
                    </p>
                    {!searchQuery && statusFilter === 'all' && (
                      <Button onClick={() => navigate('/marketplace')}>
                        Découvrir les cours disponibles
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEnrollments.map((enrollment) => (
                      <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                        {enrollment.course?.image_url && (
                          <img
                            src={enrollment.course.image_url}
                            alt={enrollment.course.name}
                            className="w-full h-48 object-cover rounded-t-lg"
                          />
                        )}
                        <CardHeader>
                          <CardTitle className="line-clamp-2">{enrollment.course?.name || 'Cours'}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="font-semibold">{enrollment.progress_percentage}%</span>
                            </div>
                            <Progress value={enrollment.progress_percentage} />
                            <p className="text-xs text-muted-foreground">
                              {enrollment.completed_lessons_count} / {enrollment.total_lessons_count} leçons complétées
                            </p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {enrollment.progress_percentage === 100 ? (
                              <Badge className="bg-green-600">
                                <Award className="h-3 w-3 mr-1" />
                                Terminé
                              </Badge>
                            ) : enrollment.progress_percentage > 0 ? (
                              <Badge variant="default">
                                <PlayCircle className="h-3 w-3 mr-1" />
                                En cours
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Non commencé
                              </Badge>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              asChild
                              className="flex-1"
                              variant={enrollment.progress_percentage === 100 ? 'outline' : 'default'}
                            >
                              <Link to={`/courses/${enrollment.course?.slug}`}>
                                {enrollment.progress_percentage === 100 ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Revoir
                                  </>
                                ) : (
                                  <>
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Continuer
                                  </>
                                )}
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

