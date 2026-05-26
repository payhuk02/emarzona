/**
 * Page Portfolio d'Artiste — layout public marketplace
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArtistGalleryGrid } from '@/components/artist/ArtistGalleryGrid';
import { PortfolioComments } from '@/components/artist/PortfolioComments';
import { CollectionsGallery } from '@/components/artist/CollectionsGallery';
import { ArtistPublicPageShell } from '@/components/artist/ArtistPublicPageShell';
import { SEOMeta } from '@/components/seo/SEOMeta';
import {
  useArtistPortfolioBySlug,
  usePortfolioGalleries,
  useTrackPortfolioView,
  useTogglePortfolioLike,
  usePortfolioLikeStatus,
} from '@/hooks/artist/useArtistPortfolios';
import { LazyImage } from '@/components/ui/LazyImage';
import {
  Heart,
  Eye,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Globe,
  Youtube,
  Linkedin,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ArtistPortfolioPage() {
  const { slug } = useParams<{ slug: string; storeSlug?: string }>();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: portfolio, isLoading: portfolioLoading } = useArtistPortfolioBySlug(
    slug,
    undefined
  );

  const { data: galleries = [], isLoading: galleriesLoading } = usePortfolioGalleries(
    portfolio?.id,
    {
      category: selectedCategory || undefined,
      publicOnly: true,
    }
  );

  const trackView = useTrackPortfolioView();
  const { data: isLiked = false } = usePortfolioLikeStatus(portfolio?.id);
  const toggleLike = useTogglePortfolioLike();

  useEffect(() => {
    if (portfolio?.id) {
      trackView.mutate(portfolio.id);
    }
  }, [portfolio?.id]);

  const handleLike = () => {
    if (!portfolio?.id) return;
    toggleLike.mutate({ portfolioId: portfolio.id, isLiked });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: portfolio?.portfolio_name,
          text: portfolio?.portfolio_description,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Lien copié',
        description: 'Le lien du portfolio a été copié dans le presse-papiers.',
      });
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return Instagram;
      case 'facebook':
        return Facebook;
      case 'twitter':
        return Twitter;
      case 'youtube':
        return Youtube;
      case 'linkedin':
        return Linkedin;
      default:
        return Globe;
    }
  };

  if (portfolioLoading) {
    return (
      <ArtistPublicPageShell>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </ArtistPublicPageShell>
    );
  }

  if (!portfolio) {
    return (
      <ArtistPublicPageShell>
        <div className="max-w-4xl mx-auto text-center">
          <Card>
            <CardContent className="p-12">
              <h1 className="text-2xl font-bold mb-4">Portfolio non trouvé</h1>
              <p className="text-muted-foreground mb-6">
                Le portfolio que vous recherchez n&apos;existe pas ou n&apos;est pas public.
              </p>
              <Button asChild>
                <Link to="/">Retour à l&apos;accueil</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ArtistPublicPageShell>
    );
  }

  const artistProduct = portfolio.artist_products as {
    artist_name?: string;
    artist_bio?: string;
  } | null;
  const portfolioLinks = (portfolio.portfolio_links || {}) as Record<string, string>;
  const categories = Array.from(
    new Set(galleries.map(g => g.gallery_category).filter(Boolean))
  ) as string[];

  const portfolioUrl = slug
    ? `https://www.emarzona.com/portfolio/${slug}`
    : 'https://www.emarzona.com/portfolio';

  return (
    <>
      <SEOMeta
        title={portfolio.portfolio_name}
        description={
          portfolio.portfolio_description ||
          portfolio.portfolio_bio ||
          `Portfolio de ${artistProduct?.artist_name || 'artiste'} sur Emarzona`
        }
        url={portfolioUrl}
        canonical={portfolioUrl}
        image={portfolio.portfolio_image_url || undefined}
      />
      <ArtistPublicPageShell bleed className="p-0">
        <div className="relative">
          {portfolio.portfolio_image_url ? (
            <div className="relative h-[400px] md:h-[500px] overflow-hidden">
              <LazyImage
                src={portfolio.portfolio_image_url}
                alt={portfolio.portfolio_name}
                className="w-full h-full object-cover"
                aspectRatio="16/9"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 text-white">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">{portfolio.portfolio_name}</h1>
                {portfolio.portfolio_description && (
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                    {portfolio.portfolio_description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-[300px] md:h-[400px] flex items-center justify-center text-white">
              <div className="text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold mb-2">{portfolio.portfolio_name}</h1>
                {portfolio.portfolio_description && (
                  <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                    {portfolio.portfolio_description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 -mt-8">
          <Card className="mb-8 relative z-10 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl md:text-4xl font-bold">
                    {artistProduct?.artist_name?.charAt(0) || 'A'}
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">
                    {artistProduct?.artist_name || 'Artiste'}
                  </h2>
                  {portfolio.portfolio_bio && (
                    <p className="text-muted-foreground mb-4">{portfolio.portfolio_bio}</p>
                  )}
                  {artistProduct?.artist_bio && !portfolio.portfolio_bio && (
                    <p className="text-muted-foreground mb-4">{artistProduct.artist_bio}</p>
                  )}

                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      {portfolio.total_views} vues
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="h-4 w-4" />
                      {portfolio.total_likes} likes
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {portfolio.total_artworks} œuvres
                    </div>
                  </div>

                  {Object.keys(portfolioLinks).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(portfolioLinks).map(([platform, url]) => {
                        const Icon = getSocialIcon(platform);
                        return (
                          <Button key={platform} variant="outline" size="sm" asChild>
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <Icon className="h-4 w-4" />
                              <span className="capitalize">{platform}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant={isLiked ? 'default' : 'outline'}
                    onClick={handleLike}
                    className={cn(isLiked && 'bg-red-600 hover:bg-red-700')}
                  >
                    <Heart className={cn('h-4 w-4 mr-2', isLiked && 'fill-current')} />
                    {isLiked ? 'Aimé' : "J'aime"}
                  </Button>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {portfolio.id && <PortfolioComments portfolioId={portfolio.id} />}

          {galleriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : galleries.length > 0 ? (
            <Tabs defaultValue="all" className="space-y-6">
              {categories.length > 0 && (
                <TabsList>
                  <TabsTrigger value="all" onClick={() => setSelectedCategory(null)}>
                    Toutes
                  </TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}

              <TabsContent value="all" className="space-y-8 mt-6">
                {galleries.map(gallery => (
                  <Card key={gallery.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-2xl mb-2">{gallery.gallery_name}</CardTitle>
                          {gallery.gallery_description && (
                            <p className="text-muted-foreground">{gallery.gallery_description}</p>
                          )}
                        </div>
                        {gallery.gallery_category && (
                          <Badge variant="outline">{gallery.gallery_category}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ArtistGalleryGrid galleryId={gallery.id} columns={3} showTitle />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">Aucune galerie disponible pour le moment.</p>
              </CardContent>
            </Card>
          )}

          {portfolio.store_id && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Collections</h2>
                  <p className="text-muted-foreground mt-1">
                    Collections thématiques de cet artiste
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/collections">Voir toutes les collections</Link>
                </Button>
              </div>
              <CollectionsGallery storeId={portfolio.store_id} showPrivate={false} limit={6} />
            </div>
          )}
        </div>
      </ArtistPublicPageShell>
    </>
  );
}
