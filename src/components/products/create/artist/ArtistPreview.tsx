/**
 * Artist Product - Preview Component
 * Date: 28 Janvier 2025
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  User,
  Calendar,
  Ruler,
  Shield,
  CheckCircle2,
  X,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import type { ArtistProductFormData } from '@/types/artist-product';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ArtistPreviewProps {
  data: Partial<ArtistProductFormData>;
}

const ARTIST_TYPE_LABELS: Record<string, string> = {
  writer: 'Écrivain / Auteur',
  musician: 'Musicien / Compositeur',
  visual_artist: 'Artiste Visuel',
  designer: 'Designer / Créateur',
  multimedia: 'Artiste Multimédia',
  other: 'Autre',
};

const EDITION_TYPE_LABELS: Record<string, string> = {
  original: 'Original',
  limited_edition: 'Édition Limitée',
  print: 'Tirage',
  reproduction: 'Reproduction',
};

export const ArtistPreview = ({ data }: ArtistPreviewProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [artistPhotoError, setArtistPhotoError] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleImageError = (imageUrl: string) => {
    setImageErrors(prev => new Set(prev).add(imageUrl));
  };

  const handleArtistPhotoError = () => {
    setArtistPhotoError(true);
  };

  const isValidImage = (imageUrl: string) => {
    return imageUrl && !imageErrors.has(imageUrl);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold mb-2">Aperçu de l'œuvre</h3>
        <p className="text-muted-foreground">
          Vérifiez toutes les informations avant de publier
        </p>
      </div>

      {/* Images Preview */}
      {data.images && data.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Galerie d'images
            </CardTitle>
            <CardDescription>
              {data.images.length} image{data.images.length > 1 ? 's' : ''} dans la galerie
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Image principale - plus grande */}
            {isValidImage(data.images[0]) ? (
              <div className="mb-4">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-primary/20 bg-muted shadow-sm">
                  <img
                    src={data.images[0]}
                    alt="Aperçu principal de l'œuvre"
                    className="w-full h-full object-contain"
                    loading="eager"
                    decoding="async"
                    style={{
                      imageRendering: 'high-quality',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    onError={() => handleImageError(data.images[0])}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Image non disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">L'image n'a pas pu être chargée</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Miniatures de la galerie */}
            {data.images.length > 1 && (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {data.images.slice(1).map((image, index) => (
                  isValidImage(image) ? (
                    <div 
                      key={index + 1} 
                      className="relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer hover:border-primary transition-colors group"
                    >
                      <img
                        src={image}
                        alt={`Aperçu ${index + 2}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        decoding="async"
                        style={{
                          imageRendering: 'high-quality',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                        }}
                        onError={() => handleImageError(image)}
                      />
                    </div>
                  ) : (
                    <div 
                      key={index + 1} 
                      className="relative aspect-square rounded-lg overflow-hidden border border-dashed border-muted-foreground/25 bg-muted flex items-center justify-center"
                    >
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Artwork Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Informations de l'œuvre
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Titre</p>
            <p className="text-lg font-semibold">{data.artwork_title || 'Non renseigné'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Type d'artiste</p>
              <Badge variant="secondary">
                {data.artist_type ? ARTIST_TYPE_LABELS[data.artist_type] : 'Non renseigné'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type d'édition</p>
              <Badge variant="outline">
                {data.edition_type ? EDITION_TYPE_LABELS[data.edition_type] : 'Non renseigné'}
              </Badge>
            </div>
          </div>

          {data.artwork_year && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Année : {data.artwork_year}</span>
            </div>
          )}

          {data.artwork_medium && (
            <div>
              <p className="text-sm text-muted-foreground">Médium / Technique</p>
              <p className="font-medium">{data.artwork_medium}</p>
            </div>
          )}

          {data.artwork_dimensions && (
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {data.artwork_dimensions.width && data.artwork_dimensions.height
                  ? `${data.artwork_dimensions.width} × ${data.artwork_dimensions.height} ${data.artwork_dimensions.unit}`
                  : 'Dimensions non renseignées'}
              </span>
            </div>
          )}

          {data.artwork_link_url && !data.requires_shipping && (
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a
                href={data.artwork_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {data.artwork_link_url}
              </a>
            </div>
          )}

          {data.edition_number && data.total_editions && (
            <div>
              <p className="text-sm text-muted-foreground">Édition</p>
              <p className="font-medium">
                {data.edition_number} / {data.total_editions}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artist Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations Artiste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-primary/30 flex-shrink-0 bg-muted shadow-md">
              {data.artist_photo_url && !artistPhotoError ? (
                <img
                  src={data.artist_photo_url}
                  alt="Photo de l'artiste"
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                  style={{
                    imageRendering: 'high-quality',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                  onError={handleArtistPhotoError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div>
                <p className="text-sm text-muted-foreground">Nom de l'artiste</p>
                <p className="text-lg font-semibold">{data.artist_name || 'Non renseigné'}</p>
              </div>
            </div>
          </div>

          {data.artist_bio && (
            <div>
              <p className="text-sm text-muted-foreground">Biographie</p>
              <p className="text-sm">{data.artist_bio}</p>
            </div>
          )}

          {data.artist_website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={data.artist_website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {data.artist_website}
              </a>
            </div>
          )}

          {data.artist_social_links && Object.keys(data.artist_social_links).length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Réseaux sociaux</p>
              <div className="flex flex-wrap gap-2">
                {data.artist_social_links.instagram && (
                  <Badge variant="secondary" className="gap-1">
                    <Instagram className="h-3 w-3" />
                    Instagram
                  </Badge>
                )}
                {data.artist_social_links.facebook && (
                  <Badge variant="secondary" className="gap-1">
                    <Facebook className="h-3 w-3" />
                    Facebook
                  </Badge>
                )}
                {data.artist_social_links.twitter && (
                  <Badge variant="secondary" className="gap-1">
                    <Twitter className="h-3 w-3" />
                    Twitter
                  </Badge>
                )}
                {data.artist_social_links.youtube && (
                  <Badge variant="secondary" className="gap-1">
                    <Youtube className="h-3 w-3" />
                    YouTube
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Tarification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Prix de vente</span>
            <span className="text-2xl font-bold">
              {data.price ? formatPrice(data.price) : 'Non renseigné'}
            </span>
          </div>
          {data.compare_at_price && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix de comparaison</span>
              <span className="text-lg line-through text-muted-foreground">
                {formatPrice(data.compare_at_price)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping & Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Expédition & Authentification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Expédition requise</span>
            {data.requires_shipping ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {data.requires_shipping && (
            <>
              {data.shipping_handling_time && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Délai de préparation</span>
                  <span className="text-sm font-medium">{data.shipping_handling_time} jours</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">Œuvre fragile</span>
                {data.shipping_fragile ? (
                  <CheckCircle2 className="h-4 w-4 text-orange-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Assurance requise</span>
                {data.shipping_insurance_required ? (
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                ) : (
                  <X className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-sm">Certificat d'authenticité</span>
            {data.certificate_of_authenticity ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Signature authentifiée</span>
            {data.signature_authenticated ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      {data.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: data.description }}
            />
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

