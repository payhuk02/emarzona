import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedAction } from '@/components/admin/ProtectedAction';

export default function AdminSecurity() {
  const [enrolling, setEnrolling] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isAAL2, setIsAAL2] = useState(false);

  useEffect(() => {
    (async () => {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
    })();
  }, []);

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnroll = async () => {
    if (!factorId) return;
    const { error } = await supabase.auth.mfa.verify({ factorId, code: verifyCode });
    if (!error) {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aal.data?.currentLevel === 'aal2');
    }
  };

  return (
    <AdminLayout>
      <ProtectedAction permission="settings.manage">
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
                <div className="text-green-700">2FA activée (AAL2).</div>
              ) : (
                <div className="space-y-4">
                  {!qr ? (
                    <Button onClick={startEnroll} disabled={enrolling}>Commencer l’activation</Button>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Scannez ce QR avec votre application d’authentification (Google Authenticator, Authy, …), puis entrez le code.</p>
                        <img src={qr} alt="QR 2FA" className="w-56 h-56 border rounded" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Input placeholder="Code à 6 chiffres" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} className="w-48" />
                        <Button onClick={verifyEnroll}>Vérifier</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ProtectedAction>
    </AdminLayout>
  );
}


