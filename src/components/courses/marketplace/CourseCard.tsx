import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Users, BookOpen, Play, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course } from "@/types/courses";
import { PriceStockAlertButton } from "@/components/marketplace/PriceStockAlertButton";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/ui/LazyImage";
import { getImageAttributesForPreset } from "@/lib/image-transform";

interface CourseCardProps {
  course: Course;
}

const CourseCardComponent = ({ course }: CourseCardProps) => {
  const { product } = course;
  const [userId, setUserId] = useState<string | null>(null);

  // Récupérer l'utilisateur pour les alertes
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  // Helper pour formater la durée
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? mins + 'm' : ''}`;
    }
    return `${mins}m`;
  };

  // Helper pour le badge de niveau
  const getLevelBadge = (level: string) => {
    const levels = {
      beginner: { label: 'Débutant', variant: 'default' as const },
      intermediate: { label: 'Intermédiaire', variant: 'secondary' as const },
      advanced: { label: 'Avancé', variant: 'destructive' as const },
      all_levels: { label: 'Tous niveaux', variant: 'outline' as const },
    };
    return levels[level as keyof typeof levels] || levels.all_levels;
  };

  const levelBadge = getLevelBadge(course.level);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group" style={{ willChange: 'transform' }}>
      {/* Image du cours */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product?.image_url ? (
          (() => {
            const imageAttrs = getImageAttributesForPreset(product.image_url, 'productImage');
            return imageAttrs ? (
              <LazyImage
                {...imageAttrs}
                alt={product.name}
                placeholder="none"
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                style={{ willChange: 'transform' }}
                format="webp"
                quality={85}
              />
            ) : (
              <img
                src={product.image_url}
                alt={product.name}
                width={1280}
                height={720}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                style={{ willChange: 'transform' }}
                loading="lazy"
              />
            );
          })()
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-400/20 to-orange-600/20">
            <GraduationCap className="w-16 h-16 text-orange-400" />
          </div>
        )}
        
        {/* Preview badge */}
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="gap-1 bg-white/90 backdrop-blur-sm">
            <Play className="w-3 h-3" />
            Preview
          </Badge>
        </div>
        
        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <Badge variant={levelBadge.variant} className="bg-white/90 backdrop-blur-sm">
            {levelBadge.label}
          </Badge>
        </div>
      </div>

      <CardHeader className="space-y-2">
        <CardTitle className="line-clamp-2 group-hover:text-orange-600 transition-colors">
          {product?.name || 'Cours sans titre'}
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {product?.short_description || product?.description || 'Aucune description'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats du cours */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1" title="Durée totale">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(course.total_duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-1" title="Nombre de leçons">
            <BookOpen className="w-4 h-4" />
            <span>{course.total_lessons} leçons</span>
          </div>
          {!course.product?.hide_purchase_count && (
            <div className="flex items-center gap-1" title="Nombre d'étudiants">
              <Users className="w-4 h-4" />
              <span>{course.total_enrollments} étudiants</span>
            </div>
          )}
        </div>

        {/* Rating */}
        {!course.product?.hide_rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{course.average_rating.toFixed(1)}</span>
            </div>
            {!course.product?.hide_reviews_count && (
              <span className="text-sm text-muted-foreground">
                ({course.total_enrollments} avis)
              </span>
            )}
          </div>
        )}

        {/* Certificat badge */}
        {course.certificate_enabled && (
          <Badge variant="outline" className="gap-1">
            <GraduationCap className="w-3 h-3" />
            Certificat inclus
          </Badge>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4 gap-2">
        {/* Prix */}
        <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 sm:gap-2 min-w-0 flex-1">
            {product?.promotional_price && product.promotional_price < product.price ? (
              <>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through flex-shrink-0 whitespace-nowrap">
                  {product.price} {product.currency}
                </span>
                <span className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold text-orange-600 whitespace-nowrap">
                  {product.promotional_price} {product.currency}
                </span>
              </>
            ) : (
              <span className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold whitespace-nowrap">
                {product?.price || 0} {product?.currency || 'XOF'}
              </span>
            )}
          </div>
          {product?.id && (
            <PriceStockAlertButton
              productId={product.id}
              productName={product.name}
              currentPrice={product.promotional_price && product.promotional_price < product.price ? product.promotional_price : (product.price || 0)}
              currency={product.currency || 'XOF'}
              productType="course"
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            />
          )}
        </div>

        {/* Bouton */}
        <Button asChild className="bg-orange-600 hover:bg-orange-700">
          <Link to={`/courses/${product?.slug}`}>
            Voir le cours
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const CourseCard = React.memo(CourseCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.total_enrollments === nextProps.course.total_enrollments &&
    prevProps.course.total_lessons === nextProps.course.total_lessons &&
    prevProps.course.total_duration_minutes === nextProps.course.total_duration_minutes &&
    prevProps.course.product?.price === nextProps.course.product?.price &&
    prevProps.course.product?.image_url === nextProps.course.product?.image_url &&
    prevProps.course.product?.name === nextProps.course.product?.name &&
    prevProps.course.product?.average_rating === nextProps.course.product?.average_rating
  );
});

CourseCard.displayName = 'CourseCard';







