/**
 * Page: Conditions Générales d'Utilisation (CGU) / Terms of Service
 * Template à adapter selon vos besoins légaux
 * Date: 27 octobre 2025
 * 
 * ⚠️ IMPORTANT: Faites valider ce contenu par un avocat
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRecordConsent, useLegalDocument } from '@/hooks/useLegal';

export default function TermsOfService() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: termsDoc } = useLegalDocument('terms', 'fr');
  const recordConsent = useRecordConsent();

  useEffect(() => {
    // Enregistrer la visite de la page (optionnel)
    if (user && termsDoc) {
      // Note: Le consentement réel est enregistré lors du signup
      // Ceci est juste pour tracking
    }
  }, [user, termsDoc]);

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
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Dernière mise à jour: {termsDoc?.effective_date ? new Date(termsDoc.effective_date).toLocaleDateString('fr-FR') : '27 octobre 2025'} • 
            Version {termsDoc?.version || '1.0'}
          </p>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-blue max-w-none">
          
          {/* 1. Acceptation des conditions */}
          <h2>1. Acceptation des conditions</h2>
          <p>
            En accédant et en utilisant Payhuk (ci-après "la Plateforme"), vous acceptez 
            d'être lié par les présentes Conditions Générales d'Utilisation ("CGU"). 
            Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser la Plateforme.
          </p>

          {/* 2. Description du service */}
          <h2>2. Description du service</h2>
          <p>
            Payhuk est une plateforme e-commerce et e-learning permettant aux utilisateurs de :
          </p>
          <ul>
            <li>Acheter et vendre des produits digitaux, physiques et services</li>
            <li>Créer et vendre des cours en ligne</li>
            <li>S'inscrire à des cours et accéder au contenu éducatif</li>
            <li>Participer à des programmes d'affiliation</li>
            <li>Effectuer des paiements sécurisés via Moneroo</li>
          </ul>

          {/* 3. Inscription et compte utilisateur */}
          <h2>3. Inscription et compte utilisateur</h2>
          <p>
            Pour utiliser certaines fonctionnalités de la Plateforme, vous devez créer un compte. 
            Vous vous engagez à :
          </p>
          <ul>
            <li>Fournir des informations exactes, complètes et à jour</li>
            <li>Maintenir la sécurité de votre mot de passe</li>
            <li>Être responsable de toute activité sous votre compte</li>
            <li>Nous notifier immédiatement de toute utilisation non autorisée</li>
          </ul>

          {/* 4. Utilisation acceptable */}
          <h2>4. Utilisation acceptable</h2>
          <p>
            Vous acceptez de ne pas :
          </p>
          <ul>
            <li>Violer les lois ou règlements applicables</li>
            <li>Publier du contenu illégal, diffamatoire ou offensant</li>
            <li>Usurper l'identité d'une autre personne</li>
            <li>Interférer avec le fonctionnement de la Plateforme</li>
            <li>Utiliser des bots, scrapers ou autres outils automatisés</li>
            <li>Vendre des produits contrefaits ou illégaux</li>
          </ul>

          {/* 5. Propriété intellectuelle */}
          <h2>5. Propriété intellectuelle</h2>
          <p>
            Tout le contenu de la Plateforme (textes, images, logos, code) est protégé par 
            le droit d'auteur et appartient à Payhuk ou à ses concédants de licence. 
            Vous conservez les droits sur le contenu que vous créez et publiez.
          </p>

          {/* 6. Paiements et remboursements */}
          <h2>6. Paiements et remboursements</h2>
          <p>
            Les paiements sont traités de manière sécurisée via Moneroo. 
            Les remboursements sont soumis à notre Politique de Remboursement. 
            Consultez notre page dédiée pour plus d'informations.
          </p>

          {/* 7. Résiliation */}
          <h2>7. Résiliation</h2>
          <p>
            Nous nous réservons le droit de suspendre ou de résilier votre compte à tout moment, 
            avec ou sans préavis, en cas de violation des présentes CGU. 
            Vous pouvez également résilier votre compte à tout moment depuis vos paramètres.
          </p>

          {/* 8. Limitation de responsabilité */}
          <h2>8. Limitation de responsabilité</h2>
          <p>
            La Plateforme est fournie "en l'état". Nous ne garantissons pas que le service sera 
            ininterrompu, sécurisé ou exempt d'erreurs. Dans la mesure permise par la loi, 
            nous déclinons toute responsabilité pour les dommages indirects, consécutifs ou punitifs.
          </p>

          {/* 9. Modification des CGU */}
          <h2>9. Modification des CGU</h2>
          <p>
            Nous nous réservons le droit de modifier ces CGU à tout moment. 
            Les modifications prendront effet dès leur publication sur la Plateforme. 
            Votre utilisation continue constitue votre acceptation des modifications.
          </p>

          {/* 10. Droit applicable */}
          <h2>10. Droit applicable</h2>
          <p>
            Ces CGU sont régies par le droit applicable dans votre juridiction. 
            Tout litige sera soumis à la compétence exclusive des tribunaux compétents.
          </p>

          {/* 11. Contact */}
          <h2>11. Contact</h2>
          <p>
            Pour toute question concernant ces CGU, vous pouvez nous contacter à :
          </p>
          <ul>
            <li>Email: legal@payhuk.com</li>
            <li>Adresse: [Votre adresse]</li>
          </ul>

          {/* Avertissement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
            <p className="text-sm text-yellow-800 font-semibold mb-1">
              ⚠️ Document Template
            </p>
            <p className="text-sm text-yellow-700">
              Ce document est un template générique. Il doit être adapté à votre situation spécifique 
              et validé par un avocat spécialisé avant utilisation en production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

