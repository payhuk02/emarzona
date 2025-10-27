/**
 * Page de détail d'un cours
 * Affiche toutes les informations, permet de s'inscrire et de suivre le cours
 * Date : 27 octobre 2025
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  ShoppingCart,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Globe,
  Award,
  TrendingUp,
  Target,
  Lightbulb
} from 'lucide-react';
import { useCourseDetail } from '@/hooks/courses/useCourseDetail';
import { VideoPlayer } from '@/components/courses/player/VideoPlayer';
import { CourseCurriculum } from '@/components/courses/detail/CourseCurriculum';
import { CourseProgressBar } from '@/components/courses/detail/CourseProgressBar';
import { LessonCompletionButton } from '@/components/courses/player/LessonCompletionButton';
import { CourseSchema, minutesToISO8601 } from '@/components/seo/CourseSchema';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackAnalyticsEvent, getSessionId } from '@/hooks/courses/useCourseAnalytics';
import { useIsAffiliateEnabled, useCalculateCommission } from '@/hooks/courses/useCourseAffiliates';
import { PixelsInit } from '@/components/analytics/PixelsInit';
import { useProductPixels } from '@/hooks/courses/useProductPixels';
import { ProductReviewsSummary } from '@/components/reviews';

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data, isLoading, error } = useCourseDetail(slug || '');
  const trackEvent = useTrackAnalyticsEvent();
  
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [hasTrackedView, setHasTrackedView] = useState(false);

  // Récupérer les infos d'affiliation
  const { isEnabled: affiliateEnabled, settings: affiliateSettings } = useIsAffiliateEnabled(
    data?.product?.id || ''
  );
  const { commission: affiliateCommission } = useCalculateCommission(
    data?.product?.id || '',
    data?.product?.price || 0
  );
  
  // Récupérer la configuration des pixels
  const { data: pixelsConfig } = useProductPixels(data?.product?.id || '');

  // Tracker automatiquement la vue de la page
  useEffect(() => {
    if (data && data.product && !hasTrackedView) {
      trackEvent.mutate({
        product_id: data.product.id,
        event_type: 'view',
        user_id: user?.id,
        session_id: getSessionId(),
        metadata: {
          source: 'course_detail',
          course_id: data.course.id,
        },
      });
      setHasTrackedView(true);
    }
  }, [data, hasTrackedView, trackEvent, user]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'Cours non trouvé'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/marketplace')} className="mt-4">
          Retour à la marketplace
        </Button>
      </div>
    );
  }

  const { product, course, sections, store, isEnrolled, enrollment, lastViewedLesson } = data;

  // Récupérer les FAQs du produit
  const faqs = product.faqs as any[] || [];

  // Récupérer la leçon à afficher : dernière vue > première preview > première leçon
  const getInitialLesson = () => {
    if (currentLesson) return currentLesson;
    
    // Si inscrit et a une dernière leçon vue, reprendre là où on s'était arrêté
    if (isEnrolled && lastViewedLesson) {
      return lastViewedLesson;
    }
    
    // Sinon chercher la première leçon preview
    for (const section of sections) {
      const previewLesson = section.lessons.find((l: any) => l.is_preview);
      if (previewLesson) return previewLesson;
      
      if (isEnrolled && section.lessons.length > 0) {
        return section.lessons[0];
      }
    }
    return null;
  };

  const handleLessonClick = (lesson: any) => {
    setCurrentLesson(lesson);
  };

  const handleEnroll = () => {
    if (!isEnrolled) {
      // Tracker le clic sur "S'inscrire"
      trackEvent.mutate({
        product_id: product.id,
        event_type: 'click',
        user_id: user?.id,
        session_id: getSessionId(),
        metadata: {
          source: 'enroll_button',
          course_id: course.id,
        },
      });

      toast({
        title: 'Inscription au cours',
        description: 'Fonctionnalité en cours de développement...',
      });
      // TODO: Implémenter le paiement et l'inscription
    }
  };

  const displayLesson = getInitialLesson();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Initialiser les pixels externes (GA, FB, GTM, TikTok) */}
      {pixelsConfig && pixelsConfig.tracking_enabled && (
        <PixelsInit
          googleAnalyticsId={pixelsConfig.google_analytics_id}
          facebookPixelId={pixelsConfig.facebook_pixel_id}
          googleTagManagerId={pixelsConfig.google_tag_manager_id}
          tiktokPixelId={pixelsConfig.tiktok_pixel_id}
        />
      )}
      
      {/* SEO - Schema.org Course markup */}
      <CourseSchema
        courseName={product.name}
        description={product.short_description || product.description || ''}
        provider={{
          name: store?.name || 'Payhuk',
          url: `https://payhula.vercel.app/stores/${store?.slug}`,
        }}
        instructor={{
          name: store?.name || 'Instructeur',
          url: `https://payhula.vercel.app/stores/${store?.slug}`,
        }}
        price={product.promotional_price || product.price}
        currency={product.currency}
        category={product.category || ''}
        level={course.level}
        language={course.language}
        totalLessons={course.total_lessons}
        duration={minutesToISO8601(course.total_duration_minutes)}
        rating={{
          value: course.average_rating || 0,
          count: course.total_reviews || 0,
        }}
        image={product.image_url || ''}
        url={`https://payhula.vercel.app/courses/${product.slug}`}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              {product.category}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {product.name}
            </h1>
            <p className="text-xl text-orange-100 mb-6">
              {product.short_description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <span>{course.average_rating || '4.5'} (125 avis)</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.total_enrollments || 0} étudiants</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>{course.total_duration_minutes} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                <span>{course.total_lessons} leçons</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                <span className="capitalize">{course.language}</span>
              </div>
            </div>

            {/* Instructor */}
            {store && (
              <div className="mt-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-orange-100">Créé par</p>
                  <p className="font-semibold">{store.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Barre de progression (si inscrit) */}
            {isEnrolled && enrollment && (
              <CourseProgressBar 
                enrollmentId={enrollment.id}
                totalLessons={course.total_lessons}
              />
            )}

            {/* Video Player */}
            {displayLesson && (
              <div>
                <VideoPlayer
                  videoType={displayLesson.video_type}
                  videoUrl={displayLesson.video_url}
                  title={displayLesson.title}
                  productId={product.id}
                  enrollmentId={isEnrolled ? enrollment?.id : undefined}
                  lessonId={displayLesson.id}
                />
                
                {/* Message "Reprendre où on s'est arrêté" */}
                {isEnrolled && lastViewedLesson && displayLesson?.id === lastViewedLesson.id && !currentLesson && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <PlayCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Vous reprenez là où vous vous êtes arrêté : <strong>{displayLesson.title}</strong>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Bouton de complétion (si inscrit) */}
                {isEnrolled && enrollment && (
                  <div className="mt-4">
                    <LessonCompletionButton
                      enrollmentId={enrollment.id}
                      lessonId={displayLesson.id}
                    />
                  </div>
                )}

                {/* Alert aperçu gratuit */}
                {!isEnrolled && displayLesson.is_preview && (
                  <Alert className="mt-4">
                    <PlayCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ceci est un aperçu gratuit. Inscrivez-vous pour accéder à tout le cours.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">À propos de ce cours</h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Objectives */}
            {course.learning_objectives && course.learning_objectives.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-600" />
                    Ce que vous allez apprendre
                  </h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learning_objectives.map((obj: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm">{obj}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites && course.prerequisites.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-orange-600" />
                    Prérequis
                  </h2>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-2 shrink-0" />
                        <span className="text-sm">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* FAQs */}
            {faqs && faqs.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-blue-600" />
                    Questions fréquentes
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq: any, index: number) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {/* Curriculum */}
            <CourseCurriculum
              sections={sections}
              isEnrolled={isEnrolled}
              currentLessonId={currentLesson?.id}
              onLessonClick={handleLessonClick}
            />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                {/* Prix */}
                <div className="mb-6">
                  {product.promotional_price && product.promotional_price < product.price ? (
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-orange-600">
                          {product.promotional_price.toLocaleString()} {product.currency}
                        </span>
                      </div>
                      <div className="text-lg text-gray-500 line-through">
                        {product.price.toLocaleString()} {product.currency}
                      </div>
                      <Badge variant="destructive" className="mt-2">
                        Promotion !
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold">
                      {product.price.toLocaleString()} {product.currency}
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isEnrolled ? (
                  <Button className="w-full bg-green-600 hover:bg-green-700" size="lg">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Déjà inscrit - Continuer
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    size="lg"
                    onClick={handleEnroll}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    S'inscrire maintenant
                  </Button>
                )}

                {/* Includes */}
                <div className="mt-6 space-y-3 text-sm">
                  <h3 className="font-semibold">Ce cours inclut :</h3>
                  <div className="flex items-center gap-2 text-gray-700">
                    <PlayCircle className="w-4 h-4 text-orange-600" />
                    <span>{course.total_lessons} leçons vidéo</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span>{Math.floor(course.total_duration_minutes / 60)}h {course.total_duration_minutes % 60}m de contenu</span>
                  </div>
                  {course.certificate_enabled && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Award className="w-4 h-4 text-orange-600" />
                      <span>Certificat de completion</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700">
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                    <span>Accès à vie</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affiliate Program */}
            {affiliateEnabled && affiliateSettings && (
              <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-900 dark:text-green-100">
                        Programme d'affiliation disponible
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Gagnez en promouvant ce cours
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Commission par vente</span>
                      <div className="text-right">
                        {affiliateSettings.commission_type === 'percentage' ? (
                          <>
                            <div className="font-bold text-green-600 dark:text-green-400">
                              {affiliateSettings.commission_rate}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ≈ {affiliateCommission.toFixed(0)} XOF
                            </div>
                          </>
                        ) : (
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {affiliateSettings.fixed_commission_amount.toLocaleString()} XOF
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">Durée du cookie</span>
                      <span className="font-semibold">
                        {affiliateSettings.cookie_duration_days} jours
                      </span>
                    </div>

                    {user ? (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => navigate(`/affiliate/courses/${product.slug}`)}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Devenir affilié
                      </Button>
                    ) : (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => navigate('/auth/login')}
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Connectez-vous pour devenir affilié
                      </Button>
                    )}

                    <p className="text-xs text-center text-muted-foreground">
                      Créez des liens et gagnez des commissions
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Level & Language */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Niveau</h3>
                  <Badge variant="secondary" className="capitalize">
                    {course.level}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Langue</h3>
                  <Badge variant="secondary" className="capitalize">
                    {course.language}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Reviews & Ratings - Full Width */}
        {product && (
          <div className="mt-12">
            <ProductReviewsSummary
              productId={product.id}
              productType="course"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
