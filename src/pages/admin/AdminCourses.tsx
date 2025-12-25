/**
 * Admin Courses Dashboard
 * Vue globale des cours en ligne de tous les instructeurs
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileTableCard } from '@/components/ui/mobile-table-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GraduationCap, Search, Users, BookOpen, Star, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const isMobile = useIsMobile();

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tableRef = useScrollAnimation<HTMLDivElement>();

  // Fetch all courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name),
          enrollments:course_enrollments(count),
          reviews:course_reviews(rating)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Stats optimisées avec useMemo
  const stats = useMemo(
    () => ({
      totalCourses: courses?.length || 0,
      publishedCourses: courses?.filter(c => c.status === 'published').length || 0,
      totalStudents: courses?.reduce((sum, c) => sum + (c.enrollments?.[0]?.count || 0), 0) || 0,
      averageRating: courses?.length
        ? courses.reduce((sum, c) => {
            const ratings = c.reviews || [];
            const avgRating = ratings.length
              ? ratings.reduce((s: number, r: { rating?: number }) => s + (r.rating || 0), 0) /
                ratings.length
              : 0;
            return sum + avgRating;
          }, 0) / courses.length
        : 0,
    }),
    [courses]
  );

  useEffect(() => {
    if (!isLoading && courses) {
      logger.info(`Admin Courses: ${courses.length} cours chargés`);
    }
  }, [isLoading, courses]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default">Publié</Badge>;
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'archived':
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }, []);

  const filteredCourses = useMemo(
    () =>
      courses?.filter(course => {
        const matchesSearch =
          course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'published' && course.status === 'published') ||
          (activeTab === 'draft' && course.status === 'draft') ||
          (activeTab === 'archived' && course.status === 'archived');

        return matchesSearch && matchesTab;
      }) || [],
    [courses, searchQuery, activeTab]
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div ref={headerRef} role="banner">
              <h1
                className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold tracking-tight"
                id="admin-courses-title"
              >
                Cours en Ligne
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                Vue d'ensemble de tous les cours de la plateforme
              </p>
            </div>

            {/* Stats Cards */}
            <div
              ref={statsRef}
              className="grid gap-4 md:grid-cols-4"
              role="region"
              aria-label="Statistiques des cours"
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                    Total Cours
                  </CardTitle>
                  <GraduationCap
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {stats.totalCourses}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                    Cours Publiés
                  </CardTitle>
                  <BookOpen
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-500"
                    aria-hidden="true"
                  />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                    {stats.publishedCourses}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                    Total Étudiants
                  </CardTitle>
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-500" aria-hidden="true" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-600">
                    {stats.totalStudents}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                    Note Moyenne
                  </CardTitle>
                  <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-500" aria-hidden="true" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-yellow-600">
                    {stats.averageRating.toFixed(1)} ⭐
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters & Table */}
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher cours ou instructeur..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 min-h-[40px] text-[10px] sm:text-[11px] md:text-xs"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all" className="min-h-[40px] text-xs sm:text-sm">
                        Tous
                      </TabsTrigger>
                      <TabsTrigger value="published" className="min-h-[40px] text-xs sm:text-sm">
                        Publiés
                      </TabsTrigger>
                      <TabsTrigger value="draft" className="min-h-[40px] text-xs sm:text-sm">
                        Brouillons
                      </TabsTrigger>
                      <TabsTrigger value="archived" className="min-h-[40px] text-xs sm:text-sm">
                        Archivés
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : filteredCourses && filteredCourses.length > 0 ? (
                  isMobile ? (
                    <MobileTableCard
                      data={filteredCourses.map(c => {
                        const ratings = c.reviews || [];
                        const avgRating = ratings.length
                          ? ratings.reduce(
                              (s: number, r: { rating?: number }) => s + (r.rating || 0),
                              0
                            ) / ratings.length
                          : 0;
                        return { id: c.id, ...c, avgRating };
                      })}
                      columns={[
                        {
                          key: 'title',
                          header: 'Titre',
                          priority: 'high',
                          className: 'font-medium',
                        },
                        {
                          key: 'instructor',
                          header: 'Instructeur',
                          priority: 'medium',
                          render: (value, row) => row.instructor?.full_name || 'N/A',
                        },
                        {
                          key: 'price',
                          header: 'Prix',
                          priority: 'high',
                          render: value => `${Number(value || 0).toLocaleString()} FCFA`,
                          className: 'font-medium',
                        },
                        {
                          key: 'enrollments',
                          header: 'Étudiants',
                          priority: 'high',
                          render: (value, row) => (
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {row.enrollments?.[0]?.count || 0}
                            </div>
                          ),
                        },
                        {
                          key: 'avgRating',
                          header: 'Note',
                          priority: 'medium',
                          render: value => (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              {Number(value) > 0 ? Number(value).toFixed(1) : '-'}
                            </div>
                          ),
                        },
                        {
                          key: 'status',
                          header: 'Statut',
                          priority: 'high',
                          render: value => getStatusBadge(String(value)),
                        },
                        {
                          key: 'created_at',
                          header: 'Date Création',
                          priority: 'low',
                          render: value => format(new Date(value), 'PP', { locale: fr }),
                        },
                      ]}
                    />
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">Titre</TableHead>
                          <TableHead className="hidden md:table-cell text-xs sm:text-sm">
                            Instructeur
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">Prix</TableHead>
                          <TableHead className="text-xs sm:text-sm">Étudiants</TableHead>
                          <TableHead className="hidden sm:table-cell text-xs sm:text-sm">
                            Note
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                          <TableHead className="hidden lg:table-cell text-xs sm:text-sm">
                            Date Création
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCourses.map(course => {
                          const ratings = course.reviews || [];
                          const avgRating = ratings.length
                            ? ratings.reduce(
                                (s: number, r: { rating?: number }) => s + (r.rating || 0),
                                0
                              ) / ratings.length
                            : 0;

                          return (
                            <TableRow key={course.id}>
                              <TableCell className="font-medium text-xs sm:text-sm">
                                {course.title}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                                {course.instructor?.full_name || 'N/A'}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {course.price?.toLocaleString()} FCFA
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {course.enrollments?.[0]?.count || 0}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-xs sm:text-sm">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {getStatusBadge(course.status)}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                                {format(new Date(course.created_at), 'PP', { locale: fr })}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <GraduationCap className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2">
                      Aucun cours
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Aucun cours trouvé.</p>
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
