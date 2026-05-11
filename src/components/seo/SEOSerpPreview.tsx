/**
 * Composant de prévisualisation SERP (Search Engine Results Page)
 * Affiche un aperçu visuel de la façon dont la boutique apparaîtra dans les résultats Google
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ExternalLink } from 'lucide-react';

interface SEOSerpPreviewProps {
  metaTitle: string;
  metaDescription: string;
  url?: string;
  faviconUrl?: string;
}

export const SEOSerpPreview = ({
  metaTitle,
  metaDescription,
  url = 'https://www.emarzona.com',
  faviconUrl,
}: SEOSerpPreviewProps) => {
  // Limiter la longueur pour un affichage réaliste
  const displayTitle = metaTitle || 'Titre de votre boutique';
  const displayDescription = metaDescription || 'Description de votre boutique';
  
  // Limiter à 60 caractères pour le titre (réaliste Google)
  const truncatedTitle = displayTitle.length > 60 
    ? displayTitle.substring(0, 57) + '...' 
    : displayTitle;
  
  // Limiter à 160 caractères pour la description (réaliste Google)
  const truncatedDescription = displayDescription.length > 160
    ? displayDescription.substring(0, 157) + '...'
    : displayDescription;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          <CardTitle className="text-lg">Aperçu Google</CardTitle>
        </div>
        <CardDescription>
          Prévisualisation de l'apparence dans les résultats de recherche Google
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-white dark:bg-gray-950 shadow-sm">
          {/* Ligne URL et favicon */}
          <div className="flex items-center gap-2 mb-1">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt="Favicon"
                className="w-4 h-4 rounded-sm"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {url}
            </span>
            <ExternalLink className="w-3 h-3 text-gray-400 ml-1 flex-shrink-0" />
          </div>

          {/* Titre (lien bleu) */}
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block text-xl text-blue-600 dark:text-blue-400 hover:underline mb-1 leading-tight cursor-default"
          >
            {truncatedTitle}
          </a>

          {/* Description */}
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-2">
            {truncatedDescription}
          </p>

          {/* Indicateurs de qualité */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <span className={`text-xs ${metaTitle.length >= 50 && metaTitle.length <= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                {metaTitle.length}/60 caractères
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-xs ${metaDescription.length >= 120 && metaDescription.length <= 160 ? 'text-green-600' : 'text-amber-600'}`}>
                {metaDescription.length}/160 caractères
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <p>
            💡 <strong>Conseil :</strong> Un titre entre 50-60 caractères et une description entre 120-160 caractères offrent les meilleurs résultats.
          </p>
          {metaTitle.length > 60 && (
            <p className="text-amber-600">
              ⚠️ Le titre sera tronqué dans les résultats Google (max 60 caractères).
            </p>
          )}
          {metaDescription.length > 160 && (
            <p className="text-amber-600">
              ⚠️ La description sera tronquée dans les résultats Google (max 160 caractères).
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};







