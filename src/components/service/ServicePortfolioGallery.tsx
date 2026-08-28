/**
 * Horizontal portfolio gallery for service gig listings (work samples).
 */

import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { cn } from '@/lib/utils';

interface ServicePortfolioGalleryProps {
  images: string[];
  title?: string;
  description?: string;
  className?: string;
}

export function ServicePortfolioGallery({
  images,
  title = 'Portfolio & réalisations',
  description = 'Exemples de travaux publiés par le vendeur.',
  className,
}: ServicePortfolioGalleryProps) {
  const [index, setIndex] = useState(0);
  const slides = images.filter(Boolean);

  const goPrev = useCallback(() => {
    setIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goNext = useCallback(() => {
    setIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  if (slides.length < 2) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base md:text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
          <ResponsiveProductImage
            src={slides[index]}
            alt={`${title} ${index + 1}`}
            sizes="(max-width: 1024px) 100vw, 66vw"
            context="detail"
            fit="cover"
            className="h-full w-full"
          />
          {slides.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
                onClick={goPrev}
                aria-label="Image précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full shadow-md"
                onClick={goNext}
                aria-label="Image suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {slides.map((src, thumbIndex) => (
            <button
              key={`${src}-${thumbIndex}`}
              type="button"
              onClick={() => setIndex(thumbIndex)}
              className={cn(
                'shrink-0 rounded-md overflow-hidden border-2 transition-colors',
                thumbIndex === index
                  ? 'border-primary'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
              aria-label={`Voir l'image ${thumbIndex + 1}`}
            >
              <ResponsiveProductImage
                src={src}
                alt=""
                sizes="80px"
                context="thumb"
                fit="cover"
                className="h-16 w-24"
              />
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
