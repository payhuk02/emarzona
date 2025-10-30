import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Clock, Users, BookOpen, Play, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import type { Course } from "@/types/courses";

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const { product } = course;

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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      {/* Image du cours */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {product?.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            width={1280}
            height={720}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
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
          <div className="flex items-center gap-1" title="Nombre d'étudiants">
            <Users className="w-4 h-4" />
            <span>{course.total_enrollments} étudiants</span>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{course.average_rating.toFixed(1)}</span>
          </div>
          <span className="text-sm text-muted-foreground">
            ({course.total_enrollments} avis)
          </span>
        </div>

        {/* Certificat badge */}
        {course.certificate_enabled && (
          <Badge variant="outline" className="gap-1">
            <GraduationCap className="w-3 h-3" />
            Certificat inclus
          </Badge>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        {/* Prix */}
        <div>
          {product?.promotional_price && product.promotional_price < product.price ? (
            <>
              <div className="text-2xl font-bold text-orange-600">
                {product.promotional_price} {product.currency}
              </div>
              <div className="text-sm text-muted-foreground line-through">
                {product.price} {product.currency}
              </div>
            </>
          ) : (
            <div className="text-2xl font-bold">
              {product?.price || 0} {product?.currency || 'XOF'}
            </div>
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

