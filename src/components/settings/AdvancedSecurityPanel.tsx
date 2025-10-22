import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Settings,
  Zap,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
  ExternalLink,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SecurityConfig {
  dnssec: boolean;
  hsts: boolean;
  csp: boolean;
  cspPolicy: string;
  firewall: boolean;
  sslGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  vulnerabilities: SecurityVulnerability[];
}

interface SecurityVulnerability {
  id: string;
  type: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  fixed: boolean;
}

interface AdvancedSecurityPanelProps {
  domain: string;
  onEnableDNSSEC: (domain: string) => Promise<boolean>;
  onEnableHSTS: (domain: string) => Promise<boolean>;
  onEnableCSP: (domain: string, policy: string) => Promise<boolean>;
}

export const AdvancedSecurityPanel = ({
  domain,
  onEnableDNSSEC,
  onEnableHSTS,
  onEnableCSP
}: AdvancedSecurityPanelProps) => {
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    dnssec: false,
    hsts: false,
    csp: false,
    cspPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    firewall: false,
    sslGrade: 'A',
    vulnerabilities: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCSPPolicy, setShowCSPPolicy] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulation de chargement de la configuration de sécurité
    loadSecurityConfig();
  }, [domain]);

  const loadSecurityConfig = async () => {
    setIsLoading(true);
    try {
      // Simulation de chargement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockConfig: SecurityConfig = {
        dnssec: Math.random() > 0.5,
        hsts: Math.random() > 0.3,
        csp: Math.random() > 0.4,
        cspPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        firewall: Math.random() > 0.2,
        sslGrade: ['A+', 'A', 'B'][Math.floor(Math.random() * 3)] as 'A+' | 'A' | 'B',
        vulnerabilities: [
          {
            id: 'vuln-1',
            type: 'medium',
            title: 'Headers de sécurité manquants',
            description: 'Certains headers de sécurité recommandés ne sont pas configurés',
            fixed: false
          },
          {
            id: 'vuln-2',
            type: 'low',
            title: 'Version TLS obsolète',
            description: 'Considérer la mise à jour vers TLS 1.3',
            fixed: false
          }
        ]
      };

      setSecurityConfig(mockConfig);
    } catch (error) {
      console.error('Error loading security config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDNSSEC = async () => {
    try {
      const success = await onEnableDNSSEC(domain);
      if (success) {
        setSecurityConfig(prev => ({ ...prev, dnssec: !prev.dnssec }));
      }
    } catch (error) {
      console.error('Error toggling DNSSEC:', error);
    }
  };

  const handleToggleHSTS = async () => {
    try {
      const success = await onEnableHSTS(domain);
      if (success) {
        setSecurityConfig(prev => ({ ...prev, hsts: !prev.hsts }));
      }
    } catch (error) {
      console.error('Error toggling HSTS:', error);
    }
  };

  const handleToggleCSP = async () => {
    try {
      const success = await onEnableCSP(domain, securityConfig.cspPolicy);
      if (success) {
        setSecurityConfig(prev => ({ ...prev, csp: !prev.csp }));
      }
    } catch (error) {
      console.error('Error toggling CSP:', error);
    }
  };

  const handleUpdateCSPPolicy = async () => {
    try {
      const success = await onEnableCSP(domain, securityConfig.cspPolicy);
      if (success) {
        toast({
          title: "CSP mis à jour",
          description: "La politique Content Security Policy a été mise à jour",
        });
      }
    } catch (error) {
      console.error('Error updating CSP policy:', error);
    }
  };

  const getSSLGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-yellow-600 bg-yellow-100';
      case 'C': return 'text-orange-600 bg-orange-100';
      case 'D': return 'text-red-600 bg-red-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getVulnerabilityColor = (type: string) => {
    switch (type) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Texte copié dans le presse-papiers",
    });
  };

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Chargement de la configuration de sécurité...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Security Overview */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Vue d'Ensemble Sécurité
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            État de sécurité de {domain}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* SSL Grade */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Note SSL</h4>
                <Badge className={getSSLGradeColor(securityConfig.sslGrade)}>
                  {securityConfig.sslGrade}
                </Badge>
              </div>
              <Progress value={securityConfig.sslGrade === 'A+' ? 100 : securityConfig.sslGrade === 'A' ? 90 : 70} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Certificat SSL valide et bien configuré
              </p>
            </div>

            {/* Security Score */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Score Sécurité</h4>
                <span className="text-2xl font-bold text-green-600">85%</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Bon niveau de sécurité général
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Fonctionnalités de Sécurité
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configurez les protections avancées pour votre domaine
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-4">
            {/* DNSSEC */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">DNSSEC</p>
                  <p className="text-sm text-muted-foreground">
                    Signature des enregistrements DNS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {securityConfig.dnssec ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Switch
                  checked={securityConfig.dnssec}
                  onCheckedChange={handleToggleDNSSEC}
                />
              </div>
            </div>

            {/* HSTS */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">HSTS</p>
                  <p className="text-sm text-muted-foreground">
                    HTTP Strict Transport Security
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {securityConfig.hsts ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Switch
                  checked={securityConfig.hsts}
                  onCheckedChange={handleToggleHSTS}
                />
              </div>
            </div>

            {/* CSP */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">CSP</p>
                    <p className="text-sm text-muted-foreground">
                      Content Security Policy
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {securityConfig.csp ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Switch
                    checked={securityConfig.csp}
                    onCheckedChange={handleToggleCSP}
                  />
                </div>
              </div>
              
              {securityConfig.csp && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="csp-policy">Politique CSP</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCSPPolicy(!showCSPPolicy)}
                    >
                      {showCSPPolicy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Textarea
                    id="csp-policy"
                    value={securityConfig.cspPolicy}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, cspPolicy: e.target.value }))}
                    className="min-h-[80px] font-mono text-sm"
                    placeholder="default-src 'self'; script-src 'self' 'unsafe-inline';"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateCSPPolicy}>
                      <Settings className="h-4 w-4 mr-2" />
                      Mettre à jour
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(securityConfig.cspPolicy)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copier
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Firewall */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Firewall DNS</p>
                  <p className="text-sm text-muted-foreground">
                    Protection contre les attaques DDoS
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {securityConfig.firewall ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <Switch
                  checked={securityConfig.firewall}
                  onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, firewall: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vulnerabilities */}
      {securityConfig.vulnerabilities.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Vulnérabilités Détectées
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Problèmes de sécurité identifiés
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <div className="space-y-3">
              {securityConfig.vulnerabilities.map((vuln) => (
                <div key={vuln.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="font-medium">{vuln.title}</p>
                      <p className="text-sm text-muted-foreground">{vuln.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getVulnerabilityColor(vuln.type)}>
                      {vuln.type === 'high' ? 'Élevé' : 
                       vuln.type === 'medium' ? 'Moyen' : 'Faible'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tips */}
      <Card className="border-none shadow-lg">
        <CardHeader className="space-y-1 px-4 py-4 sm:px-6 sm:py-5">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Info className="h-5 w-5" />
            Conseils de Sécurité
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Bonnes pratiques pour sécuriser votre domaine
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="space-y-3">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>DNSSEC</strong> : Activez DNSSEC pour protéger vos enregistrements DNS contre la falsification.
              </AlertDescription>
            </Alert>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>HSTS</strong> : Forcez l'utilisation de HTTPS pour tous les visiteurs de votre site.
              </AlertDescription>
            </Alert>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>CSP</strong> : Configurez une politique de sécurité du contenu pour bloquer les attaques XSS.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
