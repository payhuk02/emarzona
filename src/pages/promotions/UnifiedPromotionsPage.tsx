/**
 * Unified Promotions Page
 * Date: 28 Janvier 2025
 *
 * Page unifiée pour gérer toutes les promotions de la plateforme
 * Remplace les anciennes pages séparées pour différents types de promotions
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PromotionsManager } from '@/components/physical/promotions/PromotionsManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Tag, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';

export const UnifiedPromotionsPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <MainLayout layoutType="promotions">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
              <Tag className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('promotions.title', 'Gestion des Promotions')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {t(
                  'promotions.description',
                  'Créez et gérez toutes vos promotions et codes de réduction'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Info Alert about Unified System */}
        <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CheckCircle2 className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">
            Système Unifié de Promotions
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Toutes vos promotions sont maintenant gérées dans un système unifié. Vous pouvez créer
            des promotions pour tous les types de produits (physiques, digitaux, services, cours)
            depuis cette interface unique.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Promotions</CardTitle>
            <CardDescription>
              Créez et gérez vos codes promotionnels pour tous vos produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromotionsManager />
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Guide d'utilisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Types de réductions</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Pourcentage:</strong> Réduction en % sur le total
                  </li>
                  <li>
                    <strong>Montant fixe:</strong> Réduction d'un montant précis
                  </li>
                  <li>
                    <strong>Livraison gratuite:</strong> Offre la livraison gratuite
                  </li>
                  <li>
                    <strong>Acheter X obtenir Y:</strong> Promotion conditionnelle
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Portée de la promotion</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    <strong>Tous les produits:</strong> S'applique à tous vos produits
                  </li>
                  <li>
                    <strong>Produits spécifiques:</strong> Sélectionnez des produits précis
                  </li>
                  <li>
                    <strong>Catégories:</strong> Par catégorie de produits
                  </li>
                  <li>
                    <strong>Collections:</strong> Par collection de produits
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
