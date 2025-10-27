/**
 * Page: Politique de Confidentialité / Privacy Policy
 * Conformité RGPD
 * Date: 27 octobre 2025
 * 
 * ⚠️ IMPORTANT: Faites valider ce contenu par un avocat spécialisé RGPD
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLegalDocument } from '@/hooks/useLegal';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { data: privacyDoc } = useLegalDocument('privacy', 'fr');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Dernière mise à jour: {privacyDoc?.effective_date ? new Date(privacyDoc.effective_date).toLocaleDateString('fr-FR') : '27 octobre 2025'} • 
            Version {privacyDoc?.version || '1.0'}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-blue max-w-none">
          
          {/* Introduction */}
          <p className="lead">
            Chez Payhuk, nous prenons très au sérieux la protection de vos données personnelles. 
            Cette politique de confidentialité explique quelles données nous collectons, 
            comment nous les utilisons et quels sont vos droits.
          </p>

          {/* 1. Responsable du traitement */}
          <h2>1. Responsable du traitement des données</h2>
          <p>
            Le responsable du traitement de vos données personnelles est :
          </p>
          <ul>
            <li><strong>Nom :</strong> Payhuk</li>
            <li><strong>Email :</strong> privacy@payhuk.com</li>
            <li><strong>Adresse :</strong> [Votre adresse]</li>
          </ul>

          {/* 2. Données collectées */}
          <h2>2. Données personnelles collectées</h2>
          
          <h3>2.1 Données fournies directement par vous</h3>
          <ul>
            <li><strong>Lors de l'inscription :</strong> nom, prénom, email, mot de passe (hashé)</li>
            <li><strong>Profil utilisateur :</strong> photo de profil, bio, lien site web</li>
            <li><strong>Paiements :</strong> informations de facturation (traitées par Moneroo)</li>
            <li><strong>KYC :</strong> documents d'identité (pour vendeurs)</li>
            <li><strong>Contenu :</strong> cours créés, commentaires, avis</li>
          </ul>

          <h3>2.2 Données collectées automatiquement</h3>
          <ul>
            <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation</li>
            <li><strong>Cookies :</strong> identifiants de session, préférences (voir notre Politique Cookies)</li>
            <li><strong>Analytics :</strong> pages visitées, temps passé, interactions (si consentement)</li>
            <li><strong>Progression :</strong> leçons complétées, résultats quiz (cours)</li>
          </ul>

          {/* 3. Finalités du traitement */}
          <h2>3. Finalités du traitement</h2>
          <p>
            Nous utilisons vos données pour :
          </p>
          <ul>
            <li><strong>Fourniture du service :</strong> créer et gérer votre compte, traiter vos commandes</li>
            <li><strong>Communications :</strong> emails transactionnels (confirmations, notifications)</li>
            <li><strong>Amélioration :</strong> analyser l'utilisation pour améliorer la plateforme</li>
            <li><strong>Sécurité :</strong> prévenir la fraude, détecter abus</li>
            <li><strong>Marketing :</strong> newsletters, promotions (avec votre consentement)</li>
            <li><strong>Légal :</strong> respecter nos obligations légales</li>
          </ul>

          {/* 4. Base légale */}
          <h2>4. Base légale du traitement</h2>
          <p>
            Le traitement de vos données repose sur :
          </p>
          <ul>
            <li><strong>Exécution du contrat :</strong> nécessaire pour vous fournir nos services</li>
            <li><strong>Consentement :</strong> pour les cookies non essentiels, marketing</li>
            <li><strong>Intérêt légitime :</strong> sécurité, prévention fraude, amélioration</li>
            <li><strong>Obligation légale :</strong> comptabilité, fiscalité, KYC</li>
          </ul>

          {/* 5. Partage des données */}
          <h2>5. Partage des données avec des tiers</h2>
          <p>
            Nous ne vendons jamais vos données. Nous les partageons uniquement avec :
          </p>
          <ul>
            <li><strong>Moneroo :</strong> traitement des paiements</li>
            <li><strong>Supabase :</strong> hébergement base de données (certifié ISO 27001)</li>
            <li><strong>Vercel :</strong> hébergement application web</li>
            <li><strong>Services analytics :</strong> Google Analytics, Facebook Pixel (si consentement)</li>
            <li><strong>Autorités :</strong> si requis par la loi</li>
          </ul>

          {/* 6. Transferts internationaux */}
          <h2>6. Transferts de données hors UE</h2>
          <p>
            Certains de nos prestataires peuvent être situés hors de l'Union Européenne. 
            Dans ce cas, nous assurons un niveau de protection adéquat via :
          </p>
          <ul>
            <li>Clauses contractuelles types approuvées par la Commission Européenne</li>
            <li>Certification Privacy Shield (si applicable)</li>
            <li>Garanties contractuelles renforcées</li>
          </ul>

          {/* 7. Durée de conservation */}
          <h2>7. Durée de conservation des données</h2>
          <table className="min-w-full">
            <thead>
              <tr>
                <th>Type de données</th>
                <th>Durée de conservation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Compte utilisateur actif</td>
                <td>Tant que le compte est actif</td>
              </tr>
              <tr>
                <td>Compte supprimé</td>
                <td>30 jours puis suppression définitive</td>
              </tr>
              <tr>
                <td>Données de facturation</td>
                <td>10 ans (obligation légale)</td>
              </tr>
              <tr>
                <td>Cookies analytics</td>
                <td>13 mois maximum</td>
              </tr>
              <tr>
                <td>Logs de connexion</td>
                <td>12 mois</td>
              </tr>
            </tbody>
          </table>

          {/* 8. Vos droits RGPD */}
          <h2>8. Vos droits (RGPD)</h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul>
            <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
            <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
            <li><strong>Droit à l'effacement :</strong> supprimer vos données ("droit à l'oubli")</li>
            <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
            <li><strong>Droit d'opposition :</strong> vous opposer au traitement pour motifs légitimes</li>
            <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
          </ul>

          <p>
            <strong>Comment exercer vos droits ?</strong>
          </p>
          <ol>
            <li>Via votre espace personnel : Paramètres → Confidentialité & Données</li>
            <li>Par email : privacy@payhuk.com</li>
            <li>Par courrier : [Votre adresse]</li>
          </ol>
          <p className="text-sm text-gray-600">
            Nous répondons sous 30 jours maximum (RGPD). 
            Vous pouvez également introduire une réclamation auprès de la CNIL.
          </p>

          {/* 9. Sécurité */}
          <h2>9. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures de sécurité appropriées :
          </p>
          <ul>
            <li>Chiffrement des données en transit (HTTPS/TLS)</li>
            <li>Chiffrement des mots de passe (bcrypt)</li>
            <li>Authentification sécurisée (2FA disponible)</li>
            <li>Pare-feu et détection d'intrusion</li>
            <li>Sauvegardes régulières</li>
            <li>Accès restreint aux données (principe du moindre privilège)</li>
          </ul>

          {/* 10. Cookies */}
          <h2>10. Cookies et technologies similaires</h2>
          <p>
            Nous utilisons des cookies pour améliorer votre expérience. 
            Consultez notre <a href="/legal/cookies" className="text-blue-600 hover:underline">Politique Cookies</a> pour plus d'informations.
          </p>

          {/* 11. Modifications */}
          <h2>11. Modifications de cette politique</h2>
          <p>
            Nous pouvons modifier cette politique de temps en temps. 
            Les modifications importantes vous seront notifiées par email et/ou via la plateforme. 
            La version à jour sera toujours disponible sur cette page.
          </p>

          {/* 12. Contact */}
          <h2>12. Nous contacter</h2>
          <p>
            Pour toute question concernant cette politique ou vos données personnelles :
          </p>
          <ul>
            <li><strong>Email DPO :</strong> dpo@payhuk.com</li>
            <li><strong>Email général :</strong> privacy@payhuk.com</li>
            <li><strong>Courrier :</strong> [Votre adresse]</li>
          </ul>

          {/* Avertissement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
            <p className="text-sm text-yellow-800 font-semibold mb-1">
              ⚠️ Document Template
            </p>
            <p className="text-sm text-yellow-700">
              Ce document est un template générique conforme RGPD. 
              Il doit être adapté à votre situation spécifique et validé par un avocat 
              spécialisé en protection des données avant utilisation en production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

