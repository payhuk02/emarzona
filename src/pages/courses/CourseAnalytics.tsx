/**
 * Page Analytics pour un cours spécifique
 * Accessible par les instructeurs pour voir les performances
 * Date : 27 octobre 2025
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { CourseAnalyticsDashboard } from '@/components/courses/analytics/CourseAnalyticsDashboard';
import { useAuth } from '@/contexts/AuthContext';

const CourseAnalytics = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useCourseDetail(slug || '');

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous devez être connecté pour accéder à cette page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/auth/login')} className="mt-4">
          Se connecter
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
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            {error?.message || 'Cours introuvable'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard/my-courses')} className="mt-4">
          Retour à mes cours
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
          <AlertTitle>Accès refusé</AlertTitle>
          <AlertDescription>
            Vous n'avez pas l'autorisation de voir les analytics de ce cours.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/dashboard/my-courses')} className="mt-4">
          Retour à mes cours
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto py-8 px-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses/${slug}`)}
            className="mb-4 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au cours
          </Button>

          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-xl text-blue-100">{product.name}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto py-8 px-4">
        <CourseAnalyticsDashboard productId={product.id} />
      </div>
    </div>
  );
};

export default CourseAnalytics;

