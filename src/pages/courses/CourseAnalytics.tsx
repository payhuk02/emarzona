/**
 * Page Analytics pour un cours spécifique
 * Accessible par les instructeurs pour voir les performances
 * Date : 27 octobre 2025
 */

import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { CourseAnalyticsDashboard } from '@/components/courses/analytics/CourseAnalyticsDashboard';
import { ProgressionAnalyticsDashboard } from '@/components/courses/analytics/ProgressionAnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CourseAnalytics = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useCourseDetail(slug || '');

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('courses.analytics.accessDenied')}</AlertTitle>
          <AlertDescription>
            {t('courses.analytics.mustBeLoggedIn')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth/login')} className="mt-4">
          {t('auth.login.button')}
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error')}</AlertTitle>
          <AlertDescription>
            {error?.message || t('courses.analytics.courseNotFound')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard/my-courses')} className="mt-4">
          {t('courses.analytics.backToMyCourses')}
        </Button>
      </div>
    );
  }

  const { product, course, store } = data;

  // Vérifier que l'utilisateur est bien le propriétaire du cours
  if (store?.user_id !== user.id) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('courses.analytics.accessDenied')}</AlertTitle>
          <AlertDescription>
            {t('courses.analytics.noPermission')}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard/my-courses')} className="mt-4">
          {t('courses.analytics.backToMyCourses')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${slug}`)}
            className="mb-3 sm:mb-4 text-white hover:bg-white/20 h-8 sm:h-9 text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">{t('courses.analytics.backToCourse')}</span>
            <span className="sm:hidden">Retour</span>
          </Button>

          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-1 sm:mb-2">{t('courses.analytics.title')}</h1>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-blue-100">{product.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="progression">Progression</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <CourseAnalyticsDashboard productId={product.id} />
          </TabsContent>
          
          <TabsContent value="progression" className="space-y-6">
            {course?.id && (
              <ProgressionAnalyticsDashboard courseId={course.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CourseAnalytics;

