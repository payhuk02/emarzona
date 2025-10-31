/**
 * Admin Courses Dashboard
 * Vue globale des cours en ligne de tous les instructeurs
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { AppSidebar } from '@/components/AppSidebar';
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
import {
  GraduationCap,
  Search,
  Users,
  BookOpen,
  Star,
  TrendingUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AdminCourses() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
        .select(`
          *,
          instructor:profiles!courses_instructor_id_fkey(full_name),
          enrollments:course_enrollments(count),
          reviews:course_reviews(rating)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Stats optimisées avec useMemo
  const stats = useMemo(() => ({
    totalCourses: courses?.length || 0,
    publishedCourses: courses?.filter(c => c.status === 'published').length || 0,
    totalStudents: courses?.reduce((sum, c) => sum + (c.enrollments?.[0]?.count || 0), 0) || 0,
    averageRating: courses?.length
      ? courses.reduce((sum, c) => {
          const ratings = c.reviews || [];
          const avgRating = ratings.length
            ? ratings.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratings.length
            : 0;
          return sum + avgRating;
        }, 0) / courses.length
      : 0,
  }), [courses]);

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

  const filteredCourses = useMemo(() => courses?.filter(course => {
    const matchesSearch =
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'published' && course.status === 'published') ||
      (activeTab === 'draft' && course.status === 'draft') ||
      (activeTab === 'archived' && course.status === 'archived');

    return matchesSearch && matchesTab;
  }) || [], [courses, searchQuery, activeTab]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div ref={headerRef} role="banner">
              <h1 className="text-3xl font-bold tracking-tight" id="admin-courses-title">Cours en Ligne</h1>
              <p className="text-muted-foreground">
                Vue d'ensemble de tous les cours de la plateforme
              </p>
            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid gap-4 md:grid-cols-4" role="region" aria-label="Statistiques des cours">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cours</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cours Publiés</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.publishedCourses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Étudiants</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                      <TabsTrigger value="all">Tous</TabsTrigger>
                      <TabsTrigger value="published">Publiés</TabsTrigger>
                      <TabsTrigger value="draft">Brouillons</TabsTrigger>
                      <TabsTrigger value="archived">Archivés</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>

              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : filteredCourses && filteredCourses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Instructeur</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Étudiants</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date Création</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.map((course) => {
                        const ratings = course.reviews || [];
                        const avgRating = ratings.length
                          ? ratings.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratings.length
                          : 0;

                        return (
                          <TableRow key={course.id}>
                            <TableCell className="font-medium">{course.title}</TableCell>
                            <TableCell>{course.instructor?.full_name || 'N/A'}</TableCell>
                            <TableCell>{course.price?.toLocaleString()} FCFA</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {course.enrollments?.[0]?.count || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                {avgRating > 0 ? avgRating.toFixed(1) : '-'}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(course.status)}</TableCell>
                            <TableCell>
                              {format(new Date(course.created_at), 'PP', { locale: fr })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun cours</h3>
                    <p className="text-muted-foreground">Aucun cours trouvé.</p>
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

