import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { persistReferralCode } from '@/components/referral/ReferralTracker';
import { logger } from '@/lib/logger';

/**
 * Lien court /p/abcdef → mémorise le code puis inscription.
 */
export default function ReferralShortLinkLanding() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code?.trim()) {
      persistReferralCode(code);
      logger.info('Referral short link tracked', { code: code.trim() });
    }
    navigate('/register', { replace: true });
  }, [code, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <span className="sr-only">Redirection vers l’inscription…</span>
    </div>
  );
}
