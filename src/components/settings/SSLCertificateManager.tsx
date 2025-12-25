import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Upload, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Calendar,
  Key,
  FileText,
  Lock,
  Loader2
} from "lucide-react";
import { SSLCertificate, SSLConfiguration } from "@/hooks/useDomain";
import { logger } from "@/lib/logger";

interface SSLCertificateManagerProps {
  domain: string | null;
  sslConfiguration: SSLConfiguration | null;
  onGetSSLCertificates: (domain: string) => Promise<SSLCertificate[]>;
  onUploadCustomCertificate: (domain: string, certificate: string, privateKey: string, chain?: string) => Promise<boolean>;
  onRenewSSLCertificate: (certificateId: string) => Promise<boolean>;
  onDeleteSSLCertificate: (certificateId: string) => Promise<boolean>;
  onGetSSLGrade: (domain: string) => Promise<SSLConfiguration>;
  onUpdateSSLConfiguration: (domain: string, config: Partial<SSLConfiguration>) => Promise<boolean>;
}

export const SSLCertificateManager: React.FC<SSLCertificateManagerProps> = ({
  domain,
  sslConfiguration,
  onGetSSLCertificates,
  onUploadCustomCertificate,
  onRenewSSLCertificate,
  onDeleteSSLCertificate,
  onGetSSLGrade,
  onUpdateSSLConfiguration
}) => {
  const [certificates, setCertificates] = useState<SSLCertificate[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Upload form state
  const [certificateText, setCertificateText] = useState('');
  const [privateKeyText, setPrivateKeyText] = useState('');
  const [chainText, setChainText] = useState('');

  useEffect(() => {
    if (domain && sslConfiguration) {
      setCertificates(sslConfiguration.certificates);
    }
  }, [domain, sslConfiguration]);

  const handleGetCertificates = async () => {
    if (!domain) return;
    
    setLoading(true);
    try {
      const certs = await onGetSSLCertificates(domain);
      setCertificates(certs);
    } catch (error) {
      logger.error('Error fetching certificates', { error, domain });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = async () => {
    if (!domain || !certificateText || !privateKeyText) return;
    
    setUploading(true);
    try {
      const success = await onUploadCustomCertificate(domain, certificateText, privateKeyText, chainText);
      if (success) {
        setShowUploadForm(false);
        setCertificateText('');
        setPrivateKeyText('');
        setChainText('');
        await handleGetCertificates();
      }
    } catch (error) {
      logger.error('Error uploading certificate', { error, domain });
    } finally {
      setUploading(false);
    }
  };

  const handleRenewCertificate = async (certificateId: string) => {
    try {
      const success = await onRenewSSLCertificate(certificateId);
      if (success) {
        await handleGetCertificates();
      }
    } catch (error) {
      logger.error('Error renewing certificate', { error, certificateId });
    }
  };

  const handleDeleteCertificate = async (certificateId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce certificat SSL ?')) return;
    
    try {
      const success = await onDeleteSSLCertificate(certificateId);
      if (success) {
        await handleGetCertificates();
      }
    } catch (error) {
      logger.error('Error deleting certificate', { error, certificateId });
    }
  };

  const handleAnalyzeSSL = async () => {
    if (!domain) return;
    
    setLoading(true);
    try {
      await onGetSSLGrade(domain);
    } catch (error) {
      logger.error('Error analyzing SSL', { error, domain });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SSLCertificate['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Actif</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" />En attente</Badge>;
      case 'expired':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expiré</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Erreur</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getTypeBadge = (type: SSLCertificate['type']) => {
    switch (type) {
      case 'lets_encrypt':
        return <Badge variant="outline" className="text-blue-600">Let's Encrypt</Badge>;
      case 'custom':
        return <Badge variant="outline" className="text-purple-600">Personnalisé</Badge>;
      case 'wildcard':
        return <Badge variant="outline" className="text-orange-600">Wildcard</Badge>;
      case 'multi_domain':
        return <Badge variant="outline" className="text-green-600">Multi-domaines</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getSSLGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
        return 'text-green-600 bg-green-100';
      case 'A':
        return 'text-green-600 bg-green-100';
      case 'B':
        return 'text-yellow-600 bg-yellow-100';
      case 'C':
        return 'text-orange-600 bg-orange-100';
      case 'D':
        return 'text-red-600 bg-red-100';
      case 'F':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!domain) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Aucun domaine configuré</p>
            <p className="text-sm">Configurez un domaine pour gérer les certificats SSL</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SSL Grade Overview */}
      {sslConfiguration && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Analyse SSL
            </CardTitle>
            <CardDescription>
              Évaluation de la sécurité SSL de votre domaine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getSSLGradeColor(sslConfiguration.sslGrade)}`}>
                  Note SSL: {sslConfiguration.sslGrade}
                </div>
                <div className="text-sm text-gray-600">
                  {sslConfiguration.certificates.length} certificat(s) actif(s)
                </div>
              </div>
              <Button onClick={handleAnalyzeSSL} disabled={loading} size="sm">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Analyser
              </Button>
            </div>

            {sslConfiguration.vulnerabilities.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Vulnérabilités détectées:</strong>
                  <ul className="mt-2 list-disc list-inside">
                    {sslConfiguration.vulnerabilities.map((vuln, index) => (
                      <li key={index}>{vuln}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* SSL Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Configuration SSL</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Renouvellement automatique</span>
                    <Switch 
                      checked={sslConfiguration.autoRenewal} 
                      onCheckedChange={(checked) => onUpdateSSLConfiguration(domain, { autoRenewal: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HSTS activé</span>
                    <Switch 
                      checked={sslConfiguration.hstsEnabled} 
                      onCheckedChange={(checked) => onUpdateSSLConfiguration(domain, { hstsEnabled: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OCSP Stapling</span>
                    <Switch 
                      checked={sslConfiguration.ocspStapling} 
                      onCheckedChange={(checked) => onUpdateSSLConfiguration(domain, { ocspStapling: checked })}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Paramètres HSTS</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Durée (secondes)</span>
                    <span className="text-sm font-mono">{sslConfiguration.hstsMaxAge.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inclure sous-domaines</span>
                    <Switch 
                      checked={sslConfiguration.includeSubdomains} 
                      onCheckedChange={(checked) => onUpdateSSLConfiguration(domain, { includeSubdomains: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Preload</span>
                    <Switch 
                      checked={sslConfiguration.preload} 
                      onCheckedChange={(checked) => onUpdateSSLConfiguration(domain, { preload: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Certificats SSL
              </CardTitle>
              <CardDescription>
                Gestion des certificats SSL pour {domain}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGetCertificates} disabled={loading} size="sm" variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Actualiser
              </Button>
              <Button onClick={() => setShowUploadForm(!showUploadForm)} size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Aucun certificat SSL trouvé</p>
              <p className="text-sm">Ajoutez un certificat SSL pour sécuriser votre domaine</p>
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => {
                const daysUntilExpiry = getDaysUntilExpiry(cert.expiresAt);
                const isExpiringSoon = daysUntilExpiry <= 30;
                
                return (
                  <div key={cert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusBadge(cert.status)}
                        {getTypeBadge(cert.type)}
                        <span className="text-sm font-medium">{cert.domain}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRenewCertificate(cert.id)}
                          disabled={cert.status !== 'active'}
                          size="sm"
                          variant="outline"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCertificate(cert.id)}
                          disabled={certificates.length === 1}
                          size="sm"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-gray-500">Émetteur</Label>
                        <p className="font-medium">{cert.issuer}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Empreinte</Label>
                        <p className="font-mono text-xs">{cert.fingerprint.substring(0, 20)}...</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Expiration</Label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span className={isExpiringSoon ? 'text-red-600 font-medium' : ''}>
                            {new Date(cert.expiresAt).toLocaleDateString('fr-FR')}
                          </span>
                          {isExpiringSoon && (
                            <Badge variant="destructive" className="text-xs">
                              {daysUntilExpiry} jours
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {cert.domains.length > 1 && (
                      <div>
                        <Label className="text-xs text-gray-500">Domaines couverts</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cert.domains.map((domain, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {domain}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {cert.status === 'active' && (
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={Math.max(0, Math.min(100, (daysUntilExpiry / 90) * 100))} 
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-500">
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} jours restants` : 'Expiré'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Certificat Personnalisé
            </CardTitle>
            <CardDescription>
              Ajoutez votre propre certificat SSL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="certificate">Certificat SSL (.crt/.pem)</Label>
              <div className="relative">
                <Textarea
                  id="certificate"
                  placeholder="-----BEGIN CERTIFICATE-----&#10;Votre certificat SSL ici...&#10;-----END CERTIFICATE-----"
                  value={certificateText}
                  onChange={(e) => setCertificateText(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowCertificate(!showCertificate)}
                >
                  {showCertificate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="privateKey">Clé Privée (.key/.pem)</Label>
              <div className="relative">
                <Textarea
                  id="privateKey"
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;Votre clé privée ici...&#10;-----END PRIVATE KEY-----"
                  value={privateKeyText}
                  onChange={(e) => setPrivateKeyText(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                >
                  {showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chain">Chaîne de Certificats (optionnel)</Label>
              <Textarea
                id="chain"
                placeholder="-----BEGIN CERTIFICATE-----&#10;Certificat intermédiaire...&#10;-----END CERTIFICATE-----"
                value={chainText}
                onChange={(e) => setChainText(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Sécurité:</strong> Vos certificats sont chiffrés et stockés de manière sécurisée. 
                Seuls les administrateurs autorisés peuvent y accéder.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button 
                onClick={handleUploadCertificate} 
                disabled={uploading || !certificateText || !privateKeyText}
                className="flex-1"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload Certificat
              </Button>
              <Button 
                onClick={() => setShowUploadForm(false)} 
                variant="outline"
                disabled={uploading}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
