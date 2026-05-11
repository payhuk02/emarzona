/**
 * ProductStatisticsDisplaySettings - Composant partagé pour les options d'affichage des statistiques
 * Date: 2 Février 2025
 * 
 * Permet aux vendeurs de contrôler l'affichage des statistiques sur les cartes produits
 * Utilisé dans les wizards de création et les formulaires d'édition
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface ProductStatisticsDisplaySettingsProps {
  formData: {
    hide_purchase_count?: boolean;
    hide_likes_count?: boolean;
    hide_recommendations_count?: boolean;
    hide_downloads_count?: boolean;
    hide_reviews_count?: boolean;
    hide_rating?: boolean;
  };
  updateFormData: (field: string, value: boolean) => void;
  productType?: 'digital' | 'physical' | 'service' | 'course' | 'artist';
  variant?: 'default' | 'compact';
}

export const ProductStatisticsDisplaySettings : React.FC<ProductStatisticsDisplaySettingsProps> = ({
  formData,
  updateFormData,
  productType,
  variant = 'default',
}) => {
  const isCompact = variant === 'compact';

  return (
    <Card className={isCompact ? 'border-gray-200 bg-white shadow-sm' : ''}>
      <CardHeader>
        <CardTitle className={isCompact ? 'text-lg font-semibold text-gray-900' : ''}>
          Affichage des Statistiques
        </CardTitle>
        <CardDescription className={isCompact ? 'text-gray-600' : ''}>
          Contrôlez quelles statistiques sont visibles sur les cartes produits
        </CardDescription>
      </CardHeader>
      <CardContent className={isCompact ? 'space-y-3' : 'space-y-4'}>
        {/* Masquer le nombre d'achats */}
        <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                Masquer le nombre d'achats
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ne pas afficher le nombre d'achats sur les cartes produits</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Ne pas afficher le nombre d'achats
            </p>
          </div>
          <Switch
            checked={formData.hide_purchase_count || false}
            onCheckedChange={(checked) => updateFormData('hide_purchase_count', checked)}
            aria-label="Masquer le nombre d'achats"
          />
        </div>

        {/* Masquer le nombre de likes */}
        <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                Masquer le nombre de likes
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ne pas afficher le nombre de likes sur les cartes produits</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Masquer le nombre de likes
            </p>
          </div>
          <Switch
            checked={formData.hide_likes_count || false}
            onCheckedChange={(checked) => updateFormData('hide_likes_count', checked)}
            aria-label="Masquer le nombre de likes"
          />
        </div>

        {/* Masquer le nombre de recommandations */}
        <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                Masquer le nombre de recommandations
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ne pas afficher le nombre de recommandations sur les cartes produits</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Masquer le nombre de recommandations
            </p>
          </div>
          <Switch
            checked={formData.hide_recommendations_count || false}
            onCheckedChange={(checked) => updateFormData('hide_recommendations_count', checked)}
            aria-label="Masquer le nombre de recommandations"
          />
        </div>

        {/* Masquer le nombre de téléchargements (produits digitaux uniquement) */}
        {(productType === 'digital' || !productType) && (
          <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                  Masquer le nombre de téléchargements
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ne pas afficher le nombre de téléchargements (produits digitaux uniquement)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
                Masquer le nombre de téléchargements
              </p>
            </div>
            <Switch
              checked={formData.hide_downloads_count || false}
              onCheckedChange={(checked) => updateFormData('hide_downloads_count', checked)}
              aria-label="Masquer le nombre de téléchargements"
            />
          </div>
        )}

        {/* Masquer le nombre d'avis */}
        <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                Masquer le nombre d'avis
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ne pas afficher le nombre d'avis sur les cartes produits</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Masquer le nombre d'avis
            </p>
          </div>
          <Switch
            checked={formData.hide_reviews_count || false}
            onCheckedChange={(checked) => updateFormData('hide_reviews_count', checked)}
            aria-label="Masquer le nombre d'avis"
          />
        </div>

        {/* Masquer la note moyenne */}
        <div className={`flex items-center justify-between ${isCompact ? 'p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-colors' : 'gap-4 min-h-[60px]'}`}>
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Label className={isCompact ? 'text-sm font-medium text-gray-900' : ''}>
                Masquer la note moyenne
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className={`h-3 w-3 ${isCompact ? 'text-gray-500' : 'text-muted-foreground'}`} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ne pas afficher la note moyenne (étoiles) sur les cartes produits</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className={`text-xs ${isCompact ? 'text-gray-600' : 'text-muted-foreground'}`}>
              Masquer la note moyenne
            </p>
          </div>
          <Switch
            checked={formData.hide_rating || false}
            onCheckedChange={(checked) => updateFormData('hide_rating', checked)}
            aria-label="Masquer la note moyenne"
          />
        </div>
      </CardContent>
    </Card>
  );
};








