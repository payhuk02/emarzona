/**
 * Epic 4.3 — Page login SSO Enterprise (équipe vendeur)
 */

import { useParams, Link } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import { useStoreSsoPublicConfig, startStoreSsoLogin } from '@/hooks/sso/useStoreSso';
import { useState } from 'react';

export default function StoreSsoLoginPage() {
  const { storeSlug } = useParams<{ storeSlug: string }>();
  const { data: config, isLoading, error } = useStoreSsoPublicConfig(storeSlug);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleSsoLogin = async () => {
    if (!storeSlug) return;
    setStarting(true);
    setStartError(null);
    try {
      await startStoreSsoLogin(storeSlug, `${window.location.origin}/dashboard`);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Erreur SSO');
      setStarting(false);
    }
  };

  if (isLoading) {
    return (
      <AppPageShell mainClassName="flex items-center justify-center min-h-[60vh] p-6">
        <Skeleton className="h-64 w-full max-w-md" />
      </AppPageShell>
    );
  }

  if (error || !config?.enabled) {
    const isPlan = config?.reason === 'enterprise_plan_required';
    return (
      <AppPageShell mainClassName="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>SSO non disponible</CardTitle>
            <CardDescription>
              {isPlan
                ? `La boutique ${config?.store_name ?? ''} nécessite le plan Enterprise pour activer le SSO.`
                : 'Aucune configuration SSO active pour cette boutique.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" asChild>
              <Link to="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Connexion standard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell mainClassName="flex items-center justify-center min-h-[70vh] p-4 sm:p-6 bg-gradient-to-b from-background to-muted/30">
      <Card className="w-full max-w-lg border-border/60 shadow-lg">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" aria-hidden />
          </div>
          <CardTitle className="text-xl sm:text-2xl">{config.store_name}</CardTitle>
          <CardDescription className="text-base">
            Connexion équipe via <strong>{config.idp_display_name}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {config.allowed_email_domains?.length ? (
            <p className="text-xs text-center text-muted-foreground">
              Réservé aux adresses : {config.allowed_email_domains.join(', ')}
            </p>
          ) : null}

          <Button
            className="w-full min-h-[48px] text-base"
            size="lg"
            onClick={handleSsoLogin}
            disabled={starting}
          >
            {starting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Shield className="h-5 w-5 mr-2" />
            )}
            Se connecter avec SSO Enterprise
          </Button>

          {startError && (
            <p className="text-sm text-destructive text-center" role="alert">
              {startError}
            </p>
          )}

          {!config.enforce_sso && (
            <div className="text-center pt-2">
              <Button variant="link" className="text-muted-foreground" asChild>
                <Link to="/login">Utiliser email et mot de passe</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AppPageShell>
  );
}
