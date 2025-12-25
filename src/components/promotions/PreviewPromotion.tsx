/**
 * PreviewPromotion Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour prévisualiser une promotion avant création
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, Percent, Tag, Users, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PreviewPromotionProps {
  code?: string;
  description?: string;
  discountType: string;
  discountValue: number | string;
  minPurchaseAmount?: number | string;
  maxUses?: number | string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export const PreviewPromotion: React.FC<PreviewPromotionProps> = ({
  code,
  description,
  discountType,
  discountValue,
  minPurchaseAmount,
  maxUses,
  startDate,
  endDate,
  isActive = true,
}) => {
  const discountDisplay = discountType === 'percentage' 
    ? `${discountValue}%`
    : `${discountValue} XOF`;

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5 text-blue-500" />
            Aperçu de la promotion
          </CardTitle>
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        <CardDescription>
          Voici à quoi ressemblera votre promotion
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Code */}
        {code && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Code promo</p>
              <p className="font-mono font-semibold text-lg">{code}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{description}</p>
          </div>
        )}

        {/* Réduction */}
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Réduction</p>
            <p className="font-semibold text-lg text-green-600">
              {discountDisplay}
            </p>
          </div>
        </div>

        {/* Conditions */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          {minPurchaseAmount && Number(minPurchaseAmount) > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Montant minimum</p>
                <p className="text-sm font-medium">
                  {Number(minPurchaseAmount).toLocaleString()} XOF
                </p>
              </div>
            </div>
          )}

          {maxUses && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Utilisations max</p>
                <p className="text-sm font-medium">
                  {maxUses} {Number(maxUses) === 1 ? 'fois' : 'fois'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              {startDate && (
                <p>
                  <span className="text-muted-foreground">Début:</span>{' '}
                  {format(new Date(startDate), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}
              {endDate && (
                <p>
                  <span className="text-muted-foreground">Fin:</span>{' '}
                  {format(new Date(endDate), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

