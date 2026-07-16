/**
 * Epic 6.2 — Accord de traitement des données (DPA) B2B / Enterprise
 */
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOMeta } from '@/components/seo/SEOMeta';

export default function DataProcessingAgreementPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEOMeta
        title="Accord de traitement des données (DPA)"
        description="DPA Emarzona pour vendeurs Enterprise — conformité RGPD et sous-traitance."
        url="https://www.emarzona.com/legal/dpa"
        canonical="https://www.emarzona.com/legal/dpa"
        type="article"
      />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-2">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              Accord de traitement des données (DPA)
            </h1>
            <p className="text-sm text-gray-600 mt-2">Version 1.0 — Juin 2026</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8 prose prose-blue max-w-none">
            <p>
              Le présent DPA complète les{' '}
              <a href="/legal/terms" className="underline">
                Conditions générales
              </a>{' '}
              et la{' '}
              <a href="/legal/privacy" className="underline">
                Politique de confidentialité
              </a>{' '}
              pour les vendeurs utilisant Emarzona en qualité de responsable de traitement.
            </p>
            <h2>1. Objet</h2>
            <p>
              Emarzona agit en tant que sous-traitant pour le traitement des données personnelles
              des acheteurs finalisés via votre boutique (commandes, livraisons, support).
            </p>
            <h2>2. Mesures de sécurité</h2>
            <ul>
              <li>Chiffrement TLS en transit, RLS PostgreSQL par boutique</li>
              <li>Journal d’audit exportable (SOC2) — plan Enterprise</li>
              <li>SSO SAML/OIDC et clés API REST documentées</li>
              <li>Redaction PII dans les outils d’observabilité (Sentry)</li>
            </ul>
            <h2>3. Sous-traitants ultérieurs</h2>
            <p>
              Supabase (hébergement EU), Vercel (CDN/Edge), GeniusPay/Stripe/PayPal (paiements),
              Resend (emails transactionnels). Liste disponible sur demande à{' '}
              <a href="mailto:privacy@emarzona.com">privacy@emarzona.com</a>.
            </p>
            <h2>4. Durée et suppression</h2>
            <p>
              Les données sont conservées pendant la durée du contrat puis supprimées ou anonymisées
              sous 30 jours après résiliation, sauf obligation légale de conservation.
            </p>
            <h2>5. Droits des personnes</h2>
            <p>
              Les acheteurs peuvent exercer leurs droits via votre boutique ou{' '}
              <a href="/account/profile" className="underline">
                leur espace client
              </a>
              . Les vendeurs peuvent demander la suppression de leur compte depuis les paramètres de
              sécurité.
            </p>
            <h2>6. Contact DPO</h2>
            <p>
              Délégué à la protection des données :{' '}
              <a href="mailto:privacy@emarzona.com">privacy@emarzona.com</a>
            </p>
            <p className="text-sm text-muted-foreground mt-8">
              Document informatif — faites valider par votre conseil juridique avant signature
              commerciale Enterprise.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
