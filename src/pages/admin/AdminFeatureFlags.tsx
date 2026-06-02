/**
 * Admin — feature flags / modules plateforme (via personnalisation)
 */

import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FeaturesSection } from '@/components/admin/customization/FeaturesSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Sparkles } from 'lucide-react';
import { usePlatformCustomization } from '@/hooks/admin/usePlatformCustomization';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminFeatureFlags() {
  const { loading } = usePlatformCustomization();

  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Zap className="h-7 w-7 text-primary" aria-hidden />
              Feature flags
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Active ou désactive les modules globaux (affiliation, IA, cours, etc.). Les
              changements sont persistés dans la configuration plateforme.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/platform-customization">
              <Sparkles className="h-4 w-4 mr-1" />
              Personnalisation complète
            </Link>
          </Button>
        </div>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Déploiement progressif</CardTitle>
            <CardDescription>
              Pour un rollout par pourcentage d&apos;utilisateurs ou par boutique, utilisez les
              variables d&apos;environnement Vercel ou un service dédié (LaunchDarkly, etc.) — non
              encore intégré nativement.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Les toggles ci-dessous contrôlent la visibilité des modules dans l&apos;application.
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <FeaturesSection />
        )}
      </div>
    </AdminLayout>
  );
}
