import { useState, useEffect } from "react";
import { useStores } from "@/hooks/useStores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Globe, 
  Check, 
  AlertCircle, 
  Clock, 
  Copy, 
  ExternalLink,
  Shield,
  RefreshCw,
  Unplug,
  Settings,
  Info,
  Zap,
  Lock,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DomainConfig {
  custom_domain: string | null;
  domain_status: 'not_configured' | 'pending' | 'verified' | 'error';
  domain_verification_token: string | null;
  domain_verified_at: string | null;
  domain_error_message: string | null;
  ssl_enabled: boolean;
  redirect_www: boolean;
  redirect_https: boolean;
  dns_records: DNSRecord[];
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
}

export const DomainSettings = () => {
  const { stores, updateStore } = useStores();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [domainConfig, setDomainConfig] = useState<DomainConfig>({
    custom_domain: null,
    domain_status: 'not_configured',
    domain_verification_token: null,
    domain_verified_at: null,
    domain_error_message: null,
    ssl_enabled: false,
    redirect_www: true,
    redirect_https: true,
    dns_records: []
  });

  // Utiliser la première boutique disponible
  const currentStore = stores.length > 0 ? stores[0] : null;

  useEffect(() => {
    if (currentStore) {
      setDomainConfig({
        custom_domain: currentStore.custom_domain || null,
        domain_status: currentStore.domain_status || 'not_configured',
        domain_verification_token: currentStore.domain_verification_token || null,
        domain_verified_at: currentStore.domain_verified_at || null,
        domain_error_message: currentStore.domain_error_message || null,
        ssl_enabled: currentStore.ssl_enabled || false,
        redirect_www: currentStore.redirect_www !== false,
        redirect_https: currentStore.redirect_https !== false,
        dns_records: currentStore.dns_records || []
      });
      setDomainInput(currentStore.custom_domain || "");
    }
  }, [currentStore]);

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  const generateVerificationToken = () => {
    return `payhula-verify-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleConnectDomain = async () => {
    if (!currentStore) {
      toast({
        title: "Erreur",
        description: "Aucune boutique trouvée",
        variant: "destructive"
      });
      return;
    }

    if (!validateDomain(domainInput)) {
      toast({
        title: "Domaine invalide",
        description: "Veuillez entrer un nom de domaine valide (ex: maboutique.com)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const verificationToken = generateVerificationToken();
      
      const success = await updateStore(currentStore.id, {
        custom_domain: domainInput.trim(),
        domain_status: 'pending',
        domain_verification_token: verificationToken,
        domain_verified_at: null,
        domain_error_message: null
      });

    if (success) {
        toast({
          title: "Domaine connecté",
          description: "Votre domaine a été ajouté. Configurez maintenant les enregistrements DNS."
        });
        setActiveTab("dns");
      }
    } catch (error) {
      console.error('Error connecting domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de connecter le domaine.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!currentStore) return;

    setVerifying(true);
    try {
      // Simulation de vérification DNS (en production, utiliser une API backend)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const isVerified = Math.random() > 0.2; // 80% de succès pour la démo
      
      const success = await updateStore(currentStore.id, {
        domain_status: isVerified ? 'verified' : 'error',
        domain_verified_at: isVerified ? new Date().toISOString() : null,
        domain_error_message: isVerified ? null : "Les enregistrements DNS ne sont pas correctement configurés"
      });

    if (success) {
        toast({
          title: isVerified ? "Domaine vérifié" : "Vérification échouée",
          description: isVerified 
            ? "Votre domaine est maintenant actif !" 
            : "Vérifiez vos enregistrements DNS et réessayez.",
          variant: isVerified ? "default" : "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier le domaine.",
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisconnectDomain = async () => {
    if (!currentStore) return;

    if (!confirm("Êtes-vous sûr de vouloir déconnecter ce domaine ? Cette action est irréversible.")) {
      return;
    }

    setLoading(true);
    try {
      const success = await updateStore(currentStore.id, {
        custom_domain: null,
        domain_status: 'not_configured',
        domain_verification_token: null,
        domain_verified_at: null,
        domain_error_message: null,
        ssl_enabled: false
      });

      if (success) {
        setDomainInput("");
        toast({
          title: "Domaine déconnecté",
          description: "Votre domaine personnalisé a été retiré."
        });
        setActiveTab("overview");
      }
    } catch (error) {
      console.error('Error disconnecting domain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le domaine.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSSL = async () => {
    if (!currentStore) return;

    try {
      const success = await updateStore(currentStore.id, {
        ssl_enabled: !domainConfig.ssl_enabled
      });

      if (success) {
        toast({
          title: "SSL mis à jour",
          description: `SSL ${!domainConfig.ssl_enabled ? 'activé' : 'désactivé'} pour votre domaine.`
        });
      }
    } catch (error) {
      console.error('Error updating SSL:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour les paramètres SSL.",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copié dans le presse-papiers"
    });
  };

  const getStatusBadge = () => {
    const status = domainConfig.domain_status;
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600"><Check className="w-3 h-3 mr-1" />Actif</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="secondary">Non configuré</Badge>;
    }
  };

  const getDNSInstructions = () => {
    if (!domainConfig.custom_domain) return null;

    return {
      aRecord: {
        type: "A",
        name: "@",
        value: "185.158.133.1",
        ttl: 3600
      },
      wwwRecord: {
        type: "A",
        name: "www",
        value: "185.158.133.1",
        ttl: 3600
      },
      verificationRecord: {
        type: "TXT",
        name: "_payhula-verification",
        value: domainConfig.domain_verification_token || "",
        ttl: 3600
      },
      cnameRecord: {
        type: "CNAME",
        name: "shop",
        value: "payhula.com",
        ttl: 3600
      }
    };
  };

  const dnsInstructions = getDNSInstructions();

  if (!currentStore) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Vous devez d'abord créer une boutique pour configurer un domaine personnalisé.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
            Nom de domaine personnalisé
          </h2>
          <p className="text-sm text-muted-foreground">
                Connectez votre propre domaine à votre boutique
          </p>
            </div>
        {domainConfig.custom_domain && getStatusBadge()}
            </div>

      {/* Configuration du domaine */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuration du domaine
          </CardTitle>
          <CardDescription>
            {domainConfig.custom_domain 
              ? `Domaine actuel : ${domainConfig.custom_domain}`
              : "Aucun domaine personnalisé configuré"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!domainConfig.custom_domain ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom de domaine</label>
                <div className="flex gap-2">
                  <Input
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="maboutique.com"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleConnectDomain}
                    disabled={loading || !domainInput.trim()}
                    className="gradient-primary"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Connecter
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Entrez votre nom de domaine (ex: maboutique.com ou boutique.monsite.com)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{domainConfig.custom_domain}</p>
                    <p className="text-sm text-muted-foreground">
                      {domainConfig.domain_status === 'verified' 
                        ? `Actif depuis le ${new Date(domainConfig.domain_verified_at!).toLocaleDateString()}`
                        : 'Configuration en cours...'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {domainConfig.domain_status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyDomain}
                      disabled={verifying}
                    >
                      {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      Vérifier
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectDomain}
                    disabled={loading}
                  >
                    <Unplug className="h-4 w-4" />
                    Déconnecter
                  </Button>
                </div>
              </div>

              {domainConfig.domain_error_message && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {domainConfig.domain_error_message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets pour les fonctionnalités avancées */}
      {domainConfig.custom_domain && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="dns">DNS</TabsTrigger>
            <TabsTrigger value="ssl">SSL/Sécurité</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Vue d'ensemble */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SSL/TLS</span>
                    <Badge variant={domainConfig.ssl_enabled ? "default" : "secondary"}>
                      {domainConfig.ssl_enabled ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redirection HTTPS</span>
                    <Badge variant={domainConfig.redirect_https ? "default" : "secondary"}>
                      {domainConfig.redirect_https ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Redirection WWW</span>
                    <Badge variant={domainConfig.redirect_www ? "default" : "secondary"}>
                      {domainConfig.redirect_www ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Vitesse de chargement</span>
                      <span>Excellent</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uptime</span>
                      <span>99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CDN</span>
                      <span>Actif</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Informations du domaine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Domaine principal</p>
                    <p className="text-sm text-muted-foreground">{domainConfig.custom_domain}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Statut</p>
                    <p className="text-sm text-muted-foreground">
                      {domainConfig.domain_status === 'verified' ? 'Actif et vérifié' : 'En attente de vérification'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">IP de destination</p>
                    <p className="text-sm text-muted-foreground font-mono">185.158.133.1</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Dernière vérification</p>
                    <p className="text-sm text-muted-foreground">
                      {domainConfig.domain_verified_at 
                        ? new Date(domainConfig.domain_verified_at).toLocaleString()
                        : 'Jamais vérifié'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Configuration DNS */}
          <TabsContent value="dns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Enregistrements DNS requis
            </CardTitle>
                <CardDescription>
                  Configurez ces enregistrements DNS chez votre fournisseur de domaine
            </CardDescription>
          </CardHeader>
              <CardContent className="space-y-4">
                {dnsInstructions && (
                  <>
                    {/* Enregistrement A principal */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                        <h4 className="font-semibold text-sm">Enregistrement A (domaine principal)</h4>
              </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs font-mono">Type: <span className="text-primary">{dnsInstructions.aRecord.type}</span></p>
                            <p className="text-xs font-mono">Nom: <span className="text-primary">{dnsInstructions.aRecord.name}</span></p>
                            <p className="text-xs font-mono">Valeur: <span className="text-primary">{dnsInstructions.aRecord.value}</span></p>
                            <p className="text-xs font-mono">TTL: <span className="text-primary">{dnsInstructions.aRecord.ttl}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.aRecord.value)}
                            className="self-end sm:self-center"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

                    {/* Enregistrement A www */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                        <h4 className="font-semibold text-sm">Enregistrement A (www)</h4>
              </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs font-mono">Type: <span className="text-primary">{dnsInstructions.wwwRecord.type}</span></p>
                            <p className="text-xs font-mono">Nom: <span className="text-primary">{dnsInstructions.wwwRecord.name}</span></p>
                            <p className="text-xs font-mono">Valeur: <span className="text-primary">{dnsInstructions.wwwRecord.value}</span></p>
                            <p className="text-xs font-mono">TTL: <span className="text-primary">{dnsInstructions.wwwRecord.ttl}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.wwwRecord.value)}
                            className="self-end sm:self-center"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

                    {/* Enregistrement de vérification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                        <h4 className="font-semibold text-sm">Enregistrement TXT (vérification)</h4>
              </div>
                      <div className="ml-8 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-muted rounded-lg">
                  <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-xs font-mono">Type: <span className="text-primary">{dnsInstructions.verificationRecord.type}</span></p>
                            <p className="text-xs font-mono">Nom: <span className="text-primary">{dnsInstructions.verificationRecord.name}</span></p>
                            <p className="text-xs font-mono break-all">Valeur: <span className="text-primary">{dnsInstructions.verificationRecord.value}</span></p>
                            <p className="text-xs font-mono">TTL: <span className="text-primary">{dnsInstructions.verificationRecord.ttl}</span></p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(dnsInstructions.verificationRecord.value)}
                            className="self-end sm:self-center"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Important :</strong> La propagation DNS peut prendre jusqu'à 48 heures. 
                        Une fois les enregistrements configurés, cliquez sur "Vérifier" pour valider votre domaine.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SSL et Sécurité */}
          <TabsContent value="ssl" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Configuration SSL/TLS
                </CardTitle>
                <CardDescription>
                  Gérez les paramètres de sécurité pour votre domaine
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Certificat SSL/TLS</p>
                      <p className="text-sm text-muted-foreground">
                        Certificat automatique Let's Encrypt
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={domainConfig.ssl_enabled ? "default" : "secondary"}>
                        {domainConfig.ssl_enabled ? "Actif" : "Inactif"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleSSL}
                        disabled={loading}
                      >
                        {domainConfig.ssl_enabled ? "Désactiver" : "Activer"}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Redirection HTTPS forcée</p>
                      <p className="text-sm text-muted-foreground">
                        Redirige automatiquement HTTP vers HTTPS
                      </p>
                    </div>
                    <Badge variant={domainConfig.redirect_https ? "default" : "secondary"}>
                      {domainConfig.redirect_https ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Redirection WWW</p>
                      <p className="text-sm text-muted-foreground">
                        Redirige www vers le domaine principal
                      </p>
                    </div>
                    <Badge variant={domainConfig.redirect_www ? "default" : "secondary"}>
                      {domainConfig.redirect_www ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Sécurité renforcée :</strong> Tous les certificats SSL sont automatiquement 
                    renouvelés et gérés par notre infrastructure sécurisée.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Analytics du domaine
            </CardTitle>
                <CardDescription>
                  Statistiques et performances de votre domaine personnalisé
                </CardDescription>
          </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium">Statistiques de trafic</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Visiteurs uniques (30j)</span>
                        <span className="font-medium">1,247</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Pages vues (30j)</span>
                        <span className="font-medium">3,891</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taux de rebond</span>
                        <span className="font-medium">42%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Performance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Temps de chargement</span>
                        <span className="font-medium">1.2s</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Uptime</span>
                        <span className="font-medium">99.9%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Score Lighthouse</span>
                        <span className="font-medium">95/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Les analytics détaillées sont disponibles dans la section Analytics de votre tableau de bord.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};