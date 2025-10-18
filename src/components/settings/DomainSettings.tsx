import { useState, useEffect } from "react";
import { useStore } from "@/hooks/useStore";
import { useDomain } from "@/hooks/useDomain";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  Check, 
  AlertCircle, 
  Clock, 
  Copy, 
  ExternalLink,
  Shield,
  RefreshCw,
  Unplug
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const DomainSettings = () => {
  const { store, refreshStore } = useStore();
  const { loading, verifying, connectDomain, verifyDomain, disconnectDomain, getDNSInstructions } = useDomain(store);
  const [domainInput, setDomainInput] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (store?.custom_domain) {
      setDomainInput(store.custom_domain);
    }
  }, [store]);

  const handleConnect = async () => {
    const success = await connectDomain(domainInput);
    if (success) {
      await refreshStore();
    }
  };

  const handleVerify = async () => {
    const success = await verifyDomain();
    if (success) {
      await refreshStore();
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Êtes-vous sûr de vouloir déconnecter ce domaine ?")) {
      const success = await disconnectDomain();
      if (success) {
        setDomainInput("");
        await refreshStore();
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copié dans le presse-papiers"
    });
  };

  const getStatusBadge = () => {
    const status = store?.domain_status || 'not_configured';
    
    switch (status) {
      case 'verified':
        return <Badge className="bg-success"><Check className="w-3 h-3 mr-1" /> Connecté</Badge>;
      case 'pending':
        return <Badge className="bg-warning"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Erreur</Badge>;
      default:
        return <Badge variant="outline">Non configuré</Badge>;
    }
  };

  const dnsInstructions = getDNSInstructions();

  if (!store) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Créez d'abord une boutique pour configurer un domaine personnalisé.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Status Card - Responsive */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="line-clamp-2">Nom de domaine personnalisé</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Connectez votre propre domaine à votre boutique
              </CardDescription>
            </div>
            <div className="self-start sm:self-center">
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
          {!store.custom_domain ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de domaine</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="maboutique.com"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    disabled={loading}
                    className="text-sm"
                  />
                  <Button 
                    onClick={handleConnect} 
                    disabled={loading || !domainInput}
                    className="w-full sm:w-auto sm:min-w-[120px] shrink-0"
                  >
                    {loading ? "Configuration..." : "Connecter"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Entrez votre nom de domaine (ex: maboutique.com ou boutique.monsite.com)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-muted rounded-lg">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <Globe className="w-5 h-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base break-all">{store.custom_domain}</p>
                    {store.domain_verified_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Vérifié le {new Date(store.domain_verified_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  {store.domain_status === 'verified' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://${store.custom_domain}`, '_blank')}
                      className="shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="shrink-0"
                  >
                    <Unplug className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {store.domain_error_message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{store.domain_error_message}</AlertDescription>
                </Alert>
              )}

              {store.domain_status !== 'verified' && (
                <Button 
                  onClick={handleVerify} 
                  disabled={verifying}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${verifying ? 'animate-spin' : ''}`} />
                  {verifying ? "Vérification..." : "Vérifier la connexion"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions - Responsive */}
      {store.custom_domain && store.domain_status !== 'verified' && dnsInstructions && (
        <Card className="border-none shadow-lg">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <span>📋</span>
              <span>Instructions DNS</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Ajoutez ces enregistrements DNS chez votre fournisseur de domaine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Step 1 - Responsive */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                  1
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Enregistrement A (domaine principal)</h4>
              </div>
              <div className="ml-0 sm:ml-9 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-mono break-all">Type: <span className="text-primary">{dnsInstructions.aRecord.type}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Nom: <span className="text-primary">{dnsInstructions.aRecord.name}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Valeur: <span className="text-primary">{dnsInstructions.aRecord.value}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.aRecord.value)}
                    className="self-end sm:self-center shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 2 - Responsive */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                  2
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Enregistrement A (www)</h4>
              </div>
              <div className="ml-0 sm:ml-9 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-mono break-all">Type: <span className="text-primary">{dnsInstructions.wwwRecord.type}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Nom: <span className="text-primary">{dnsInstructions.wwwRecord.name}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Valeur: <span className="text-primary">{dnsInstructions.wwwRecord.value}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.wwwRecord.value)}
                    className="self-end sm:self-center shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Step 3 - Responsive */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                  3
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Enregistrement TXT (vérification)</h4>
              </div>
              <div className="ml-0 sm:ml-9 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 sm:p-4 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-mono break-all">Type: <span className="text-primary">{dnsInstructions.verificationRecord.type}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Nom: <span className="text-primary">{dnsInstructions.verificationRecord.name}</span></p>
                    <p className="text-xs sm:text-sm font-mono break-all">Valeur: <span className="text-primary break-all">{dnsInstructions.verificationRecord.value}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.verificationRecord.value)}
                    className="self-end sm:self-start shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Alert className="border-l-4 border-l-primary">
              <Shield className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                <strong>Propagation DNS :</strong> Les modifications DNS peuvent prendre jusqu'à 24-48 heures pour se propager. 
                Une fois configuré, un certificat SSL sera automatiquement généré pour activer HTTPS.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* SSL Certificate Info - Responsive */}
      {store.domain_status === 'verified' && (
        <Card className="border-none shadow-lg bg-gradient-to-br from-success/5 to-success/10">
          <CardHeader className="px-4 py-4 sm:px-6 sm:py-5">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-success shrink-0" />
              <span>Certificat SSL actif</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Alert className="border-success bg-success/5">
              <Check className="h-4 w-4 text-success shrink-0" />
              <AlertDescription className="text-xs sm:text-sm leading-relaxed">
                Votre domaine est sécurisé avec HTTPS. Les visiteurs peuvent accéder à votre boutique en toute sécurité.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
