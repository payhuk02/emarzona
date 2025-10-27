/**
 * Dashboard Étudiant - Mes Cours
 * Affiche tous les cours auxquels l'utilisateur est inscrit avec progression
 * Date : 27 octobre 2025
 * Phase : 5 - Progression
 */

import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { useMyEnrollments } from '@/hooks/courses/useCourseEnrollment';
import { useCourseProgressPercentage } from '@/hooks/courses/useCourseProgress';

const CourseCard = ({ enrollment }: { enrollment: any }) => {
  const navigate = useNavigate();
  const { percentage, completedLessons, totalLessons } = useCourseProgressPercentage(enrollment.id);
  const product = enrollment.course?.product;
  const course = enrollment.course;

  if (!product || !course) return null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Image du cours */}
        <div className="h-48 overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600">
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <GraduationCap className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Badge de progression */}
        {percentage === 100 && (
          <Badge className="absolute top-4 right-4 bg-green-600">
            <Trophy className="w-3 h-3 mr-1" />
            Terminé
          </Badge>
        )}
        {percentage > 0 && percentage < 100 && (
          <Badge className="absolute top-4 right-4 bg-orange-600">
            En cours
          </Badge>
        )}
      </div>

      <CardContent className="p-6">
        {/* Titre et description */}
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {product.short_description}
        </p>

        {/* Barre de progression */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{percentage}% complété</span>
            <span className="text-muted-foreground">
              {completedLessons}/{totalLessons} leçons
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{course.total_lessons} leçons</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}m</span>
          </div>
        </div>

        {/* Bouton continuer */}
        <Button
          className="w-full"
          onClick={() => navigate(`/courses/${product.slug}`)}
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          {percentage === 0 ? 'Commencer' : percentage === 100 ? 'Revoir le cours' : 'Continuer'}
        </Button>
      </CardContent>
    </Card>
  );
};

const MyCourses = () => {
  const { data: enrollments, isLoading, error } = useMyEnrollments();

  // Calculer les statistiques globales
  const totalCourses = enrollments?.length || 0;
  const completedCourses = enrollments?.filter((e: any) => {
    // Vérifier si le cours est terminé en comparant les leçons
    return e.completed_lessons === e.total_lessons && e.total_lessons > 0;
  }).length || 0;
  const inProgressCourses = totalCourses - completedCourses;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 bg-gray-50">
          {isLoading ? (
            <div className="p-8">
              <Skeleton className="h-10 w-64 mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-96" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Erreur lors du chargement de vos cours.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <>
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
                <div className="max-w-7xl mx-auto py-12 px-8">
                  <h1 className="text-4xl font-bold mb-4">Mes Cours</h1>
                  <p className="text-xl text-orange-100">
                    Suivez votre progression et continuez votre apprentissage
                  </p>
                </div>
              </div>

              {/* Contenu */}
              <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total des cours
                      </CardTitle>
                      <BookOpen className="w-4 h-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalCourses}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        En cours
                      </CardTitle>
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{inProgressCourses}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Terminés
                      </CardTitle>
                      <Trophy className="w-4 h-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{completedCourses}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Liste des cours */}
                {totalCourses === 0 ? (
                  <Card className="p-12">
                    <div className="text-center">
                      <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h2 className="text-2xl font-bold mb-2">Aucun cours pour le moment</h2>
                      <p className="text-muted-foreground mb-6">
                        Explorez notre catalogue et inscrivez-vous à votre premier cours !
                      </p>
                      <Button onClick={() => window.location.href = '/marketplace'}>
                        Explorer les cours
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments?.map((enrollment: any) => (
                      <CourseCard key={enrollment.id} enrollment={enrollment} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MyCourses;
