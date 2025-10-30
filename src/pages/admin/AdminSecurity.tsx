import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Check } from 'lucide-react';

export default function AdminSecurity() {
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [uri, setUri] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isAAL2, setIsAAL2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
    })();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    setError(null);
    setQr(null);
    setSecret(null);
    setUri(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) {
        console.error('MFA enroll error:', error);
        throw error;
      }
      if (!data) {
        throw new Error('Aucune donnée retournée par Supabase');
      }
      setFactorId(data.id);
      // Le QR code peut être en format data:image/svg+xml ou data:image/png
      if (data.totp?.qr_code) {
        setQr(data.totp.qr_code);
      }
      // Le secret en texte brut pour entrée manuelle
      if (data.totp?.secret) {
        setSecret(data.totp.secret);
      }
      // L'URI TOTP complète (optionnel)
      if (data.totp?.uri) {
        setUri(data.totp.uri);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'Erreur lors de l\'enrollment 2FA';
      setError(errorMsg);
      toast({
        title: 'Erreur d\'activation',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnroll = async () => {
    if (!factorId) {
      toast({
        title: 'Erreur',
        description: 'Aucun facteur en cours d\'enrollment',
        variant: 'destructive',
      });
      return;
    }
    if (!verifyCode || verifyCode.length !== 6) {
      toast({
        title: 'Code invalide',
        description: 'Veuillez entrer un code à 6 chiffres',
        variant: 'destructive',
      });
      return;
    }
    try {
      const { error } = await supabase.auth.mfa.verify({ factorId, code: verifyCode });
      if (error) {
        console.error('MFA verify error:', error);
        // Si le facteur n'existe plus (expiré ou invalidé), proposer de relancer
        if (error.message?.includes('not found') || error.message?.includes('challenge ID')) {
          toast({
            title: 'Facteur expiré',
            description: 'Le QR code a expiré. Veuillez cliquer sur "Commencer l\'activation" pour en générer un nouveau.',
            variant: 'destructive',
          });
          // Reset pour permettre un nouvel enrollment
          setFactorId(null);
          setQr(null);
          setSecret(null);
          setUri(null);
          setVerifyCode('');
          return;
        }
        toast({
          title: 'Code invalide',
          description: error.message || 'Le code entré est incorrect. Vérifiez que l\'heure de votre appareil est correcte.',
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: '2FA activée',
        description: 'L\'authentification à deux facteurs a été activée avec succès',
      });
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
      // Reset après succès
      setFactorId(null);
      setQr(null);
      setSecret(null);
      setUri(null);
      setVerifyCode('');
    } catch (e: any) {
      toast({
        title: 'Erreur',
        description: e.message || 'Erreur lors de la vérification',
        variant: 'destructive',
      });
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setSecretCopied(true);
      toast({
        title: 'Secret copié',
        description: 'Le secret a été copié dans le presse-papiers',
      });
      setTimeout(() => setSecretCopied(false), 2000);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sécurité admin</h1>
          <p className="text-muted-foreground">Activez la double authentification (2FA) via TOTP</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>2FA (TOTP)</CardTitle>
            <CardDescription>Protection renforcée des accès administrateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAAL2 ? (
              <div className="text-green-700 dark:text-green-400">2FA activée (AAL2).</div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {!qr && !secret ? (
                  <Button onClick={startEnroll} disabled={enrolling}>
                    {enrolling ? 'Activation en cours...' : 'Commencer l\'activation'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, Microsoft Authenticator, etc.), puis entrez le code à 6 chiffres généré.
                      </p>
                      <Alert className="mb-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          ⚠️ <strong>Important :</strong> Ce QR code expire après quelques minutes. Si vous obtenez une erreur "not found", cliquez à nouveau sur "Commencer l'activation" pour générer un nouveau QR code.
                        </AlertDescription>
                      </Alert>
                      {qr ? (
                        <div className="flex justify-center mb-4">
                          <img 
                            src={qr} 
                            alt="QR Code 2FA" 
                            className="w-64 h-64 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white p-2" 
                          />
                        </div>
                      ) : (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Le QR code n'a pas pu être généré. Utilisez le secret ci-dessous pour l'ajout manuel.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                    
                    {secret && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Secret de secours (pour ajout manuel) :</p>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={secret} 
                            readOnly 
                            className="font-mono text-sm"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={copySecret}
                          >
                            {secretCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Si le scan QR ne fonctionne pas, copiez ce secret et ajoutez-le manuellement dans votre app d'authentification.
                        </p>
                      </div>
                    )}

                    <div className="pt-4 border-t space-y-3">
                      <p className="text-sm font-medium mb-2">Entrez le code à 6 chiffres de votre application :</p>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="000000" 
                          value={verifyCode} 
                          onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                          className="w-48 font-mono text-center text-lg tracking-widest"
                          maxLength={6}
                        />
                        <Button onClick={verifyEnroll} disabled={!verifyCode || verifyCode.length !== 6}>
                          Vérifier
                        </Button>
                      </div>
                      <div className="flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={startEnroll}
                          disabled={enrolling}
                        >
                          {enrolling ? 'Génération...' : 'Générer un nouveau QR code'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}


