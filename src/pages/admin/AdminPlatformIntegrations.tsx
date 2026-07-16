/**
 * Intégrations plateforme (admin) — secrets globaux GeniusPay, Resend, FedEx, etc.
 * Distinct de /dashboard/integrations (intégrations par boutique vendeur).
 */

import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { IntegrationsSection } from '@/components/admin/customization/IntegrationsSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, KeyRound, Webhook, Sparkles } from 'lucide-react';

export default function AdminPlatformIntegrations() {
  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Globe className="h-7 w-7 text-primary" aria-hidden />
              Intégrations plateforme
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Configuration globale des services externes (paiement, email, livraison, IA). Les
              intégrations par boutique restent dans le tableau de bord vendeur.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/webhooks">
                <Webhook className="h-4 w-4 mr-1" />
                Webhooks
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/api-keys">
                <KeyRound className="h-4 w-4 mr-1" />
                Clés API
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/platform-customization">
                <Sparkles className="h-4 w-4 mr-1" />
                Personnalisation
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Boutiques vendeurs</CardTitle>
            <CardDescription>
              Zoom, calendrier et intégrations spécifiques à une boutique :{' '}
              <Link to="/dashboard/integrations" className="text-primary underline">
                /dashboard/integrations
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Cette page admin ne modifie pas les intégrations d&apos;une boutique active dans votre
            session vendeur.
          </CardContent>
        </Card>

        <IntegrationsSection />
      </div>
    </AdminLayout>
  );
}
