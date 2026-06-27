/**
 * Page publique Emarzona Protect v1
 */

import { Link } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Clock, Package, Scale } from 'lucide-react';
import { EMARZONA_PROTECT_CLAIM_WINDOW_DAYS } from '@/lib/trust/emarzona-protect-policy';
import { SEOMeta } from '@/components/seo';

export default function EmarzonaProtectPage() {
  return (
    <AppPageShell>
      <SEOMeta
        title="Emarzona Protect — Protection acheteur"
        description="Couverture acheteur v1 : aide en cas de non-réception, produit non conforme ou endommagé."
      />
      <div className="container mx-auto max-w-3xl px-4 py-10 space-y-8">
        <div className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Emarzona Protect</h1>
          <p className="text-muted-foreground">
            Protection acheteur incluse sur les commandes éligibles, sans frais supplémentaires en
            v1.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-base">
                {EMARZONA_PROTECT_CLAIM_WINDOW_DAYS} jours
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Fenêtre de réclamation après paiement confirmé.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Package className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-base">Produits couverts</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Digital, physique, cours et œuvres artiste (1 000 – 5 M XOF).
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Scale className="h-5 w-5 text-primary mb-2" />
              <CardTitle className="text-base">Médiation plateforme</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Réclamation prioritaire traitée par l'équipe trust via le module litiges.
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comment ouvrir une réclamation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ol className="list-decimal list-inside space-y-2">
              <li>Connectez-vous et ouvrez Mes commandes.</li>
              <li>Sélectionnez une commande payée avec badge Protect actif.</li>
              <li>
                Décrivez le problème — un litige prioritaire est créé pour la boutique et l'équipe
                Emarzona.
              </li>
            </ol>
            <Button asChild>
              <Link to="/account/orders">Voir mes commandes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
}
