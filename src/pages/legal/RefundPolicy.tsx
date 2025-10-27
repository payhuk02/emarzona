/**
 * Page: Politique de Remboursement / Refund Policy
 * Conditions de remboursement pour les produits et cours
 * Date: 27 octobre 2025
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLegalDocument } from '@/hooks/useLegal';

export default function RefundPolicy() {
  const navigate = useNavigate();
  const { data: refundDoc } = useLegalDocument('refund', 'fr');

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
          <div className="flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Politique de Remboursement
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dernière mise à jour: {refundDoc?.effective_date ? new Date(refundDoc.effective_date).toLocaleDateString('fr-FR') : '27 octobre 2025'} • 
                Version {refundDoc?.version || '1.0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 prose prose-blue max-w-none">
          
          {/* Introduction */}
          <p className="lead">
            Chez Payhuk, votre satisfaction est notre priorité. Cette politique explique les conditions 
            de remboursement pour nos différents types de produits et services.
          </p>

          {/* 1. Garantie satisfait ou remboursé */}
          <h2>1. Garantie satisfait ou remboursé - 14 jours</h2>
          <p>
            Nous offrons une garantie satisfait ou remboursé de <strong>14 jours</strong> sur tous nos cours en ligne, 
            à compter de la date d'achat, sous certaines conditions.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm mb-0">
              ✅ <strong>Vous êtes éligible au remboursement si :</strong>
            </p>
            <ul className="text-green-700 text-sm mb-0">
              <li>Vous avez acheté le cours il y a moins de 14 jours</li>
              <li>Vous avez visionné moins de 30% du contenu</li>
              <li>Vous n'avez pas téléchargé de ressources payantes</li>
              <li>C'est votre première demande de remboursement pour ce cours</li>
            </ul>
          </div>

          {/* 2. Par type de produit */}
          <h2>2. Conditions par type de produit</h2>

          <h3>2.1 Cours en ligne (e-learning)</h3>
          <ul>
            <li><strong>Délai :</strong> 14 jours calendaires</li>
            <li><strong>Condition :</strong> Moins de 30% du contenu visionné</li>
            <li><strong>Remboursement :</strong> 100% du montant payé</li>
            <li><strong>Délai de traitement :</strong> 5-10 jours ouvrés</li>
          </ul>

          <h3>2.2 Produits digitaux (ebooks, templates, etc.)</h3>
          <ul>
            <li><strong>Délai :</strong> 14 jours calendaires</li>
            <li><strong>Condition :</strong> Produit défectueux ou ne correspondant pas à la description</li>
            <li><strong>Remboursement :</strong> 100% si défectueux, au cas par cas sinon</li>
            <li><strong>Délai de traitement :</strong> 5-10 jours ouvrés</li>
          </ul>

          <h3>2.3 Produits physiques</h3>
          <ul>
            <li><strong>Délai :</strong> 14 jours calendaires après réception</li>
            <li><strong>Condition :</strong> Produit non utilisé, dans son emballage d'origine</li>
            <li><strong>Remboursement :</strong> 100% (frais de retour à votre charge sauf défaut)</li>
            <li><strong>Délai de traitement :</strong> 10-15 jours après réception du retour</li>
          </ul>

          <h3>2.4 Services</h3>
          <ul>
            <li><strong>Délai :</strong> Avant le début de la prestation</li>
            <li><strong>Condition :</strong> Annulation au moins 48h avant</li>
            <li><strong>Remboursement :</strong> 100% si {'>'}48h, 50% si 24-48h, 0% si {'<'}24h</li>
            <li><strong>Délai de traitement :</strong> 5-10 jours ouvrés</li>
          </ul>

          {/* 3. Cas d'exclusion */}
          <h2>3. Cas ne donnant PAS droit au remboursement</h2>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm mb-0">
              ❌ <strong>Vous n'êtes PAS éligible au remboursement si :</strong>
            </p>
            <ul className="text-red-700 text-sm mb-0">
              <li>Vous avez déjà visionné plus de 30% du cours</li>
              <li>Vous avez téléchargé des ressources payantes (certificats, fichiers bonus)</li>
              <li>Le délai de 14 jours est dépassé</li>
              <li>Vous avez abusé de la politique de remboursement dans le passé</li>
              <li>Le produit a été acheté en promotion ou avec un code promo (sauf défaut)</li>
              <li>Vous avez violé les CGU (fraude, partage de compte, etc.)</li>
            </ul>
          </div>

          {/* 4. Procédure */}
          <h2>4. Comment demander un remboursement ?</h2>
          
          <p><strong>Étape 1 : Accéder à vos commandes</strong></p>
          <ol>
            <li>Connectez-vous à votre compte</li>
            <li>Allez dans <strong>Dashboard → Mes Commandes</strong></li>
            <li>Trouvez la commande concernée</li>
          </ol>

          <p><strong>Étape 2 : Faire la demande</strong></p>
          <ol>
            <li>Cliquez sur "Demander un remboursement"</li>
            <li>Sélectionnez la raison (obligatoire)</li>
            <li>Ajoutez des détails (optionnel mais recommandé)</li>
            <li>Soumettez la demande</li>
          </ol>

          <p><strong>Étape 3 : Traitement</strong></p>
          <ul>
            <li>Notre équipe examine votre demande sous 48h</li>
            <li>Vous recevez une notification (email + in-app)</li>
            <li>Si approuvé : remboursement sous 5-10 jours</li>
            <li>Si refusé : explication fournie</li>
          </ul>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm font-semibold mb-1">
              💡 Conseil
            </p>
            <p className="text-blue-700 text-sm mb-0">
              Avant de demander un remboursement, contactez le support. 
              Nous pouvons souvent résoudre le problème rapidement !
            </p>
          </div>

          {/* 5. Modalités de remboursement */}
          <h2>5. Modalités de remboursement</h2>
          <p>
            Le remboursement est effectué via le même moyen de paiement utilisé lors de l'achat :
          </p>
          <ul>
            <li><strong>Carte bancaire :</strong> crédit sur la carte (5-10 jours ouvrés)</li>
            <li><strong>Mobile Money :</strong> crédit sur le compte (3-5 jours ouvrés)</li>
            <li><strong>Virement :</strong> sur le compte bancaire fourni (5-15 jours)</li>
          </ul>

          {/* 6. Abonnements */}
          <h2>6. Abonnements et renouvellements</h2>
          <p>
            Si vous avez souscrit à un abonnement (accès illimité, etc.) :
          </p>
          <ul>
            <li>Vous pouvez annuler à tout moment</li>
            <li>L'accès reste actif jusqu'à la fin de la période payée</li>
            <li>Pas de remboursement au prorata (sauf exceptions légales)</li>
            <li>Désactivez le renouvellement automatique dans vos paramètres</li>
          </ul>

          {/* 7. Litiges */}
          <h2>7. Réclamations et litiges</h2>
          <p>
            Si vous n'êtes pas satisfait de notre réponse concernant votre demande de remboursement :
          </p>
          <ol>
            <li><strong>Médiation :</strong> Contactez notre service client senior : support@payhuk.com</li>
            <li><strong>Plateforme européenne :</strong> Si vous êtes en UE, utilisez la plateforme ODR</li>
            <li><strong>Tribunal :</strong> En dernier recours, saisir le tribunal compétent</li>
          </ol>

          {/* 8. Exceptions légales */}
          <h2>8. Droit de rétractation légal (UE)</h2>
          <p>
            Conformément à la directive européenne 2011/83/UE, vous disposez d'un droit de rétractation de 14 jours 
            pour les achats en ligne, SAUF pour :
          </p>
          <ul>
            <li>Les contenus numériques dont l'exécution a commencé avec votre accord</li>
            <li>Les services pleinement exécutés</li>
            <li>Les biens personnalisés</li>
          </ul>
          <p className="text-sm text-gray-600">
            En achetant un cours et en commençant à le visionner, vous renoncez explicitement 
            à ce droit de rétractation légal. Notre garantie 14 jours s'applique à la place.
          </p>

          {/* 9. Modifications */}
          <h2>9. Modifications de cette politique</h2>
          <p>
            Nous nous réservons le droit de modifier cette politique de remboursement. 
            Les modifications s'appliqueront aux achats effectués après la date de modification. 
            Les achats antérieurs restent soumis à la politique en vigueur au moment de l'achat.
          </p>

          {/* 10. Contact */}
          <h2>10. Nous contacter</h2>
          <p>
            Pour toute question sur notre politique de remboursement :
          </p>
          <ul>
            <li><strong>Email :</strong> refunds@payhuk.com</li>
            <li><strong>Support :</strong> Via le chat (en bas à droite)</li>
            <li><strong>Téléphone :</strong> [Votre numéro] (Lu-Ve 9h-18h)</li>
          </ul>

          {/* Avertissement */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-8">
            <p className="text-sm text-yellow-800 font-semibold mb-1">
              ⚠️ Document Template
            </p>
            <p className="text-sm text-yellow-700">
              Ce document est un template générique. Adaptez-le à votre juridiction 
              et faites-le valider par un avocat, notamment concernant les obligations légales 
              de votre pays (droit de rétractation, garanties, etc.).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

