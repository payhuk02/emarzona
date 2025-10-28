/**
 * Composant Two-Factor Authentication (2FA)
 * 
 * Authentification à deux facteurs pour sécuriser les comptes admins
 * Utilise Supabase MFA (Multi-Factor Authentication)
 * 
 * @module TwoFactorAuth
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Smartphone, Key, CheckCircle2, AlertCircle, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface Factor {
  id: string;
  friendly_name: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
}

export const TwoFactorAuth = () => {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnabling, setIsEnabling] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const { toast } = useToast();

  // Charger les facteurs d'authentification existants
  useEffect(() => {
    loadFactors();
  }, []);

  const loadFactors = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Note: Supabase MFA API
      // const { data, error } = await supabase.auth.mfa.listFactors();
      
      // Pour l'instant, simuler (Supabase MFA nécessite configuration serveur)
      setFactors([]);
      
    } catch (error) {
      console.error('Erreur chargement 2FA:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les paramètres 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const enable2FA = async () => {
    setIsEnabling(true);
    try {
      // Étape 1 : Enroll un nouveau facteur TOTP
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        // data contient : id, type, totp { qr_code, secret, uri }
        setFactorId(data.id);
        setSecret(data.totp.secret);
        
        // Générer QR Code pour l'app authenticator
        const qrUrl = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(qrUrl);

        toast({
          title: '2FA initialisé',
          description: 'Scannez le QR code avec votre app authentificator',
        });
      }
    } catch (error: any) {
      console.error('Erreur activation 2FA:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'activer le 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsEnabling(false);
    }
  };

  const verify2FA = async () => {
    if (!factorId || !verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Code invalide',
        description: 'Le code doit contenir 6 chiffres',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Étape 2 : Vérifier le code TOTP
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (error) throw error;

      if (data) {
        // Vérifier le code
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: factorId,
          challengeId: data.id,
          code: verificationCode,
        });

        if (verifyError) throw verifyError;

        toast({
          title: '2FA activé !',
          description: 'Votre compte est maintenant protégé par l\'authentification à deux facteurs',
        });

        // Reset et recharger
        setQrCodeUrl(null);
        setSecret(null);
        setVerificationCode('');
        setFactorId(null);
        await loadFactors();
      }
    } catch (error: any) {
      console.error('Erreur vérification 2FA:', error);
      toast({
        title: 'Code incorrect',
        description: error.message || 'Le code saisi est invalide',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const disable2FA = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;

      toast({
        title: '2FA désactivé',
        description: 'L\'authentification à deux facteurs a été désactivée',
      });

      await loadFactors();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de désactiver le 2FA',
        variant: 'destructive',
      });
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      toast({
        title: 'Copié !',
        description: 'Clé secrète copiée dans le presse-papiers',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Authentification à Deux Facteurs (2FA)</CardTitle>
          </div>
          <CardDescription>
            Ajoutez une couche de sécurité supplémentaire à votre compte admin
          </CardDescription>
        </CardHeader>
      </Card>

      {/* État actuel */}
      {factors.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            L'authentification à deux facteurs n'est pas activée. Votre compte admin est vulnérable.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            2FA activé - Votre compte est protégé
          </AlertDescription>
        </Alert>
      )}

      {/* Configuration 2FA */}
      {!qrCodeUrl ? (
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Utilisez une app authenticator (Google Authenticator, Authy, Microsoft Authenticator)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {factors.length === 0 ? (
              <Button 
                onClick={enable2FA} 
                disabled={isEnabling}
                className="w-full"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {isEnabling ? 'Initialisation...' : 'Activer le 2FA'}
              </Button>
            ) : (
              <div className="space-y-4">
                {factors.map((factor) => (
                  <div 
                    key={factor.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{factor.friendly_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Créé le {new Date(factor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={factor.status === 'verified' ? 'default' : 'secondary'}>
                        {factor.status === 'verified' ? 'Vérifié' : 'En attente'}
                      </Badge>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => disable2FA(factor.id)}
                      >
                        Désactiver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scanner le QR Code</CardTitle>
            <CardDescription>
              Utilisez votre app authenticator pour scanner ce code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg border">
                <img src={qrCodeUrl} alt="QR Code 2FA" className="w-48 h-48" />
              </div>
            </div>

            {/* Clé manuelle */}
            {secret && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Ou entrez manuellement cette clé :
                </p>
                <div className="flex gap-2">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Vérification */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Code de vérification</label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="mt-2 text-center text-2xl tracking-widest font-mono"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Entrez le code à 6 chiffres affiché dans votre app
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={verify2FA}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {isVerifying ? 'Vérification...' : 'Vérifier et activer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setQrCodeUrl(null);
                    setSecret(null);
                    setVerificationCode('');
                    setFactorId(null);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apps Authenticator recommandées</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Google Authenticator (iOS & Android)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Microsoft Authenticator (iOS & Android)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Authy (Multi-plateforme avec backup)</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

