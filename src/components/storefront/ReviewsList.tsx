import { Review } from "@/hooks/useReviews";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, User } from '@/components/icons';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewsListProps {
  reviews: Review[];
  loading: boolean;
  storeSlug?: string;
}

const ReviewsList = ({ reviews, loading, storeSlug }: ReviewsListProps) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-primary text-primary"
                : "fill-muted text-muted"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start gap-3 sm:gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">Aucun avis pour le moment</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Soyez le premier à laisser un avis sur cette boutique !
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="bg-card border-border hover:shadow-medium transition-shadow animate-fade-in">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex items-start gap-3 sm:gap-4">
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <User className="h-5 w-5 sm:h-6 sm:w-6" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {renderStars(review.rating)}
                    </div>
                    {review.product && (
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                        Avis sur <span className="font-medium text-foreground">{review.product.name}</span>
                      </p>
                    )}
                  </div>
                  <time className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(review.created_at), "d MMMM yyyy", { locale: fr })}
                  </time>
                </div>
              </div>
            </div>
          </CardHeader>
          
          {review.comment && (
            <CardContent className="pt-0 pb-4 sm:pb-6">
              <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap pl-0 sm:pl-16">
                {review.comment}
              </p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default ReviewsList;
