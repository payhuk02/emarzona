import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { redeemDownloadToken } from '@/lib/digital/redeem-download';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Lock, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

export default function PremiumUnlockPage() {
  const { storeSlug, licenseType } = useParams<{ storeSlug: string; licenseType: string }>();
  const [licenseKey, setLicenseKey] = useState('');
  const [state, setState] = useState<'idle' | 'verifying' | 'unlocking' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKey.trim()) return;

    setState('verifying');
    setErrorMsg(null);

    try {
      // 1. Call RPC to validate key and mint token
      const { data, error } = await supabase.rpc('unlock_digital_product_direct_access', {
        p_store_slug: storeSlug,
        p_license_type: licenseType,
        p_license_key: licenseKey.trim(),
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data || data.length === 0 || !data[0].download_token) {
        throw new Error('Impossible de générer le jeton de téléchargement.');
      }

      const { download_token: token } = data[0];

      setState('unlocking');

      // 2. Redeem the token to get the signed URL or external URL
      const result = await redeemDownloadToken(token);

      if (!result.ok) {
        throw new Error(result.error.error);
      }

      const { signedUrl, fileName, external } = result.data;

      // 3. Trigger download / open file directly
      if (external) {
        // For Google Drive / Dropbox, redirect the user directly in the same tab
        window.location.replace(signedUrl);
      } else {
        // For internal storage, force download
        const link = document.createElement('a');
        link.href = signedUrl;
        link.download = fileName;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setState('success');
      }
    } catch (err) {
      setState('idle');
      const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.';
      setErrorMsg(message);
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-4">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] pointer-events-none animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Accès Sécurisé</h1>
            <p className="text-slate-400 text-sm">
              Veuillez saisir votre clé de licence pour déverrouiller votre produit{' '}
              {licenseType?.toUpperCase()}.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {state === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Produit déverrouillé !</h2>
                <p className="text-slate-400 text-sm">
                  Le téléchargement a démarré automatiquement. Merci pour votre achat sur{' '}
                  {storeSlug}.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleUnlock}
                className="space-y-6"
              >
                <div className="space-y-2 relative">
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                    <Input
                      type="text"
                      placeholder="Ex: XXXX-XXXX-XXXX-XXXX"
                      value={licenseKey}
                      onChange={e => setLicenseKey(e.target.value)}
                      disabled={state !== 'idle'}
                      className="pl-12 h-14 bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus:ring-primary/50 text-center font-mono text-lg rounded-xl transition-all"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20 text-sm"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <p>{errorMsg}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={state !== 'idle' || !licenseKey.trim()}
                  className="w-full h-14 text-base font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]"
                >
                  {state === 'verifying' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Vérification...
                    </>
                  ) : state === 'unlocking' ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Préparation...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-5 w-5" />
                      Déverrouiller l'accès
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 text-center border-t border-slate-800/50 pt-6">
            <p className="text-xs text-slate-500">Transaction sécurisée par Emarzona</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
