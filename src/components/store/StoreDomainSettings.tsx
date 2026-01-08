/**
 * StoreDomainSettings Component
 * Composant simplifié pour la gestion de domaine personnalisé d'une boutique spécifique
 * Intégré dans StoreDetails.tsx
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Globe,
  Check,
  AlertCircle,
  Clock,
  Copy,
  Shield,
  Unplug,
  Info,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { checkDNSPropagation } from '@/lib/domainUtils';
import type { Store } from '@/hooks/useStores';

interface StoreDomainSettingsProps {
  store: Store & {
    custom_domain?: string | null | undefined;
    domain_status?: 'not_configured' | 'pending' | 'verified' | 'error' | null | undefined;
    domain_verification_token?: string | null | undefined;
    domain_verified_at?: string | null | undefined;
    domain_error_message?: string | null | undefined;
    ssl_enabled?: boolean | null | undefined;
    redirect_www?: boolean | null | undefined;
    redirect_https?: boolean | null | undefined;
    dns_records?: Array<Record<string, unknown>> | null | undefined;
  };
  onUpdateStore: (updates: Partial<Store>) => Promise<boolean>;
}

export const StoreDomainSettings = ({ store, onUpdateStore: onUpdate }: StoreDomainSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [domainInput, setDomainInput] = useState(store.custom_domain || '');
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [sslEnabled, setSslEnabled] = useState(store.ssl_enabled || false);
  const [redirectWww, setRedirectWww] = useState(store.redirect_www !== false);
  const [redirectHttps, setRedirectHttps] = useState(store.redirect_https !== false);

  useEffect(() => {
    setDomainInput(store.custom_domain || '');
    setSslEnabled(store.ssl_enabled || false);
    setRedirectWww(store.redirect_www !== false);
    setRedirectHttps(store.redirect_https !== false);
  }, [store]);

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.([a-zA-Z]{2,}|[a-zA-Z]{2,}\.[a-zA-Z]{2,})$/;
    return domainRegex.test(domain);
  };

  const generateVerificationToken = () => {
    return `emarzona-verify-${Math.random().toString(36).substring(2, 15)}`;
  };

  const getDNSInstructions = (domain: string, token: string) => {
    return {
      aRecord: {
        type: 'A',
        name: domain,
        value: '76.76.19.61', // IP Vercel (recommandé: utiliser CNAME vers cname.vercel-dns.com)
        ttl: 3600,
      },
      wwwRecord: {
        type: 'A',
        name: `www.${domain}`,
        value: '76.76.19.61', // IP Vercel (recommandé: utiliser CNAME vers cname.vercel-dns.com)
        ttl: 3600,
      },
      verificationRecord: {
        type: 'TXT',
        name: `_emarzona-verification.${domain}`,
        value: token,
        ttl: 3600,
      },
    };
  };

  const handleConnectDomain = async () => {
    if (!validateDomain(domainInput)) {
      toast({
        title: 'Domaine invalide',
        description: 'Veuillez entrer un nom de domaine valide (ex: maboutique.com)',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const verificationToken = generateVerificationToken();
      const success = await onUpdate({
        custom_domain: domainInput.trim(),
        domain_status: 'pending',
        domain_verification_token: verificationToken,
        domain_verified_at: null,
        domain_error_message: null,
      });

      if (success) {
        toast({
          title: 'Domaine connecté',
          description: 'Votre domaine a été ajouté. Configurez maintenant les enregistrements DNS.',
        });
      }
    } catch (error) {
      logger.error('Error connecting domain', { error, domain: domainInput });
      toast({
        title: 'Erreur',
        description: 'Impossible de connecter le domaine.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!store.custom_domain || !store.domain_verification_token) {
      toast({
        title: 'Erreur',
        description: 'Domaine ou token de vérification manquant.',
        variant: 'destructive',
      });
      return;
    }

    setVerifying(true);
    try {
      // Vérification DNS réelle via Google DNS API
      logger.info('Starting DNS verification', { 
        domain: store.custom_domain, 
        token: store.domain_verification_token 
      });

      const verificationResult = await checkDNSPropagation(
        store.custom_domain,
        store.domain_verification_token
      );

      if (!verificationResult.isPropagated) {
        // Erreurs de propagation DNS
        const errorMessage = verificationResult.errors.length > 0
          ? verificationResult.errors.join(', ')
          : 'La propagation DNS n\'est pas complète. Veuillez vérifier vos enregistrements DNS.';

        const success = await onUpdate({
          domain_status: 'error',
          domain_error_message: errorMessage,
        });

        if (success) {
          toast({
            title: 'Vérification échouée',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        return;
      }

      // Si la propagation est OK, marquer comme vérifié et activer SSL
      const success = await onUpdate({
        domain_status: 'verified',
        domain_verified_at: new Date().toISOString(),
        domain_error_message: null,
        ssl_enabled: true,
      });

      if (success) {
        const propagationTimeMinutes = Math.floor(verificationResult.propagationTime / 60000);
        const propagationTimeSeconds = Math.floor((verificationResult.propagationTime % 60000) / 1000);
        
        toast({
          title: 'Domaine vérifié avec succès',
          description: `Propagation DNS complète (${propagationTimeMinutes}min ${propagationTimeSeconds}s). SSL activé automatiquement.`,
        });
      }
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Impossible de vérifier le domaine.';
      logger.error('Error verifying domain', { error, domain: store.custom_domain });
      
      await onUpdate({
        domain_status: 'error',
        domain_error_message: errorMessage,
      });

      toast({
        title: 'Erreur de vérification',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnectDomain = async () => {
    setLoading(true);
    try {
      const success = await onUpdate({
        custom_domain: null,
        domain_status: 'not_configured',
        domain_verification_token: null,
        domain_verified_at: null,
        domain_error_message: null,
        ssl_enabled: false,
      });

      if (success) {
        setDomainInput('');
        toast({
          title: 'Domaine déconnecté',
          description: 'Le domaine personnalisé a été retiré.',
        });
      }
    } catch (error) {
      logger.error('Error disconnecting domain', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de déconnecter le domaine.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setShowDisconnectDialog(false);
    }
  };

  const handleCopyDNSRecord = (record: { type: string; name: string; value: string }) => {
    const text = `${record.type} ${record.name} ${record.value}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copié',
      description: 'Enregistrement DNS copié dans le presse-papiers.',
    });
  };

  const getStatusBadge = () => {
    const status = store.domain_status || 'not_configured';
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <Check className="w-3 h-3 mr-1" />
            Actif
            {store.ssl_enabled && (
              <Shield className="w-3 h-3 ml-1" />
            )}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            En attente
            <Info className="w-3 h-3 ml-1" title="Vérification automatique toutes les 15 minutes" />
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erreur
          </Badge>
        );
      default:
        return <Badge variant="secondary">Non configuré</Badge>;
    }
  };

  const dnsInstructions =
    store.custom_domain && store.domain_verification_token
      ? getDNSInstructions(store.custom_domain, store.domain_verification_token)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domaine personnalisé
          </h3>
          <p className="text-sm text-muted-foreground">
            Connectez votre propre domaine à votre boutique
          </p>
        </div>
        {store.custom_domain && getStatusBadge()}
      </div>

      {/* Configuration du domaine */}
      {!store.custom_domain ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Connecter un domaine</CardTitle>
            <CardDescription>
              Entrez votre nom de domaine pour le connecter à votre boutique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="domain-input">Nom de domaine</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  id="domain-input"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value.trim())}
                  placeholder="maboutique.com"
                  className="flex-1"
                />
                <Button onClick={handleConnectDomain} disabled={loading || !domainInput.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Globe className="h-4 w-4 mr-2" />
                  )}
                  Connecter
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Entrez votre nom de domaine (ex: maboutique.com ou boutique.monsite.com)
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Domaine connecté */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Domaine connecté</CardTitle>
              <CardDescription>
                Votre domaine est connecté. Configurez les enregistrements DNS pour l'activer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{store.custom_domain}</p>
                    <p className="text-sm text-muted-foreground">
                      {store.domain_status === 'verified'
                        ? `Actif depuis le ${new Date(store.domain_verified_at!).toLocaleDateString()}`
                        : 'Configuration en cours...'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {store.domain_status === 'pending' && (
                    <Button variant="outline" size="sm" onClick={handleVerifyDomain} disabled={verifying}>
                      {verifying ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Vérifier
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisconnectDialog(true)}
                    disabled={loading}
                  >
                    <Unplug className="h-4 w-4 mr-2" />
                    Déconnecter
                  </Button>
                </div>
              </div>

              {store.domain_error_message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{store.domain_error_message}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Instructions DNS */}
          {dnsInstructions && store.domain_status === 'pending' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Instructions DNS</CardTitle>
                <CardDescription>
                  Ajoutez ces enregistrements DNS dans votre panneau de contrôle de domaine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Ces enregistrements peuvent prendre jusqu'à 48 heures pour se propager. Une fois
                    configurés, cliquez sur "Vérifier" pour activer votre domaine.
                    <br />
                    <span className="text-xs mt-2 block">
                      💡 <strong>Vérification automatique :</strong> Votre domaine sera vérifié automatiquement toutes les 15 minutes. 
                      Le SSL sera activé automatiquement dès que la propagation DNS sera complète.
                    </span>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {/* A Record */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">A</Badge>
                        <span className="font-medium">Enregistrement A</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyDNSRecord(dnsInstructions.aRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm font-mono bg-muted p-2 rounded">
                      <p>
                        <span className="text-muted-foreground">Type:</span> {dnsInstructions.aRecord.type}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Nom:</span> {dnsInstructions.aRecord.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Valeur:</span> {dnsInstructions.aRecord.value}
                      </p>
                      <p>
                        <span className="text-muted-foreground">TTL:</span> {dnsInstructions.aRecord.ttl}
                      </p>
                    </div>
                  </div>

                  {/* WWW A Record */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">A</Badge>
                        <span className="font-medium">Enregistrement A (www)</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyDNSRecord(dnsInstructions.wwwRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm font-mono bg-muted p-2 rounded">
                      <p>
                        <span className="text-muted-foreground">Type:</span> {dnsInstructions.wwwRecord.type}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Nom:</span> {dnsInstructions.wwwRecord.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Valeur:</span> {dnsInstructions.wwwRecord.value}
                      </p>
                      <p>
                        <span className="text-muted-foreground">TTL:</span> {dnsInstructions.wwwRecord.ttl}
                      </p>
                    </div>
                  </div>

                  {/* TXT Verification Record */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">TXT</Badge>
                        <span className="font-medium">Enregistrement de vérification</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyDNSRecord(dnsInstructions.verificationRecord)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 text-sm font-mono bg-muted p-2 rounded">
                      <p>
                        <span className="text-muted-foreground">Type:</span>{' '}
                        {dnsInstructions.verificationRecord.type}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Nom:</span>{' '}
                        {dnsInstructions.verificationRecord.name}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Valeur:</span>{' '}
                        {dnsInstructions.verificationRecord.value}
                      </p>
                      <p>
                        <span className="text-muted-foreground">TTL:</span>{' '}
                        {dnsInstructions.verificationRecord.ttl}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Options avancées */}
          {store.domain_status === 'verified' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Options avancées</CardTitle>
                <CardDescription>Configurez les options de redirection et de sécurité</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="ssl-enabled">SSL/HTTPS</Label>
                    <p className="text-xs text-muted-foreground">
                      Activer le certificat SSL pour votre domaine
                    </p>
                  </div>
                  <Switch
                    id="ssl-enabled"
                    checked={sslEnabled}
                    onCheckedChange={async (checked) => {
                      setSslEnabled(checked);
                      await onUpdate({ ssl_enabled: checked });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="redirect-www">Redirection www</Label>
                    <p className="text-xs text-muted-foreground">
                      Rediriger automatiquement www vers le domaine principal
                    </p>
                  </div>
                  <Switch
                    id="redirect-www"
                    checked={redirectWww}
                    onCheckedChange={async (checked) => {
                      setRedirectWww(checked);
                      await onUpdate({ redirect_www: checked });
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="redirect-https">Redirection HTTPS</Label>
                    <p className="text-xs text-muted-foreground">
                      Rediriger automatiquement HTTP vers HTTPS
                    </p>
                  </div>
                  <Switch
                    id="redirect-https"
                    checked={redirectHttps}
                    onCheckedChange={async (checked) => {
                      setRedirectHttps(checked);
                      await onUpdate({ redirect_https: checked });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog de confirmation de déconnexion */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter le domaine ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir déconnecter le domaine <strong>{store.custom_domain}</strong> ? Cette
              action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectDomain} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};







