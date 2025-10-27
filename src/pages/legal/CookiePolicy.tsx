/**
 * Page: Politique des Cookies / Cookie Policy
 * Détails des cookies utilisés sur Payhuk
 * Date: 27 octobre 2025
 */

import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLegalDocument } from '@/hooks/useLegal';

export default function CookiePolicy() {
  const navigate = useNavigate();
  const { data: cookieDoc } = useLegalDocument('cookies', 'fr');

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
            <Cookie className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Politique des Cookies
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Dernière mise à jour: {cookieDoc?.effective_date ? new Date(cookieDoc.effective_date).toLocaleDateString('fr-FR') : '27 octobre 2025'} • 
                Version {cookieDoc?.version || '1.0'}
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
            Cette politique explique ce que sont les cookies, comment nous les utilisons sur Payhuk, 
            et comment vous pouvez contrôler vos préférences.
          </p>

          {/* 1. Qu'est-ce qu'un cookie ? */}
          <h2>1. Qu'est-ce qu'un cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, smartphone, tablette) 
            lorsque vous visitez un site web. Les cookies permettent au site de mémoriser vos actions et 
            préférences sur une période donnée.
          </p>

          {/* 2. Types de cookies */}
          <h2>2. Types de cookies que nous utilisons</h2>

          <h3>2.1 Cookies strictement nécessaires (Toujours actifs)</h3>
          <p>
            Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés. 
            Ils permettent la navigation de base et l'accès aux zones sécurisées.
          </p>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Nom du cookie</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>sb-access-token</code></td>
                <td>Session utilisateur authentifié</td>
                <td>1 heure</td>
              </tr>
              <tr>
                <td><code>sb-refresh-token</code></td>
                <td>Renouvellement session</td>
                <td>30 jours</td>
              </tr>
              <tr>
                <td><code>cookieConsent</code></td>
                <td>Mémoriser votre choix de cookies</td>
                <td>1 an</td>
              </tr>
              <tr>
                <td><code>XSRF-TOKEN</code></td>
                <td>Protection contre attaques CSRF</td>
                <td>Session</td>
              </tr>
            </tbody>
          </table>

          <h3>2.2 Cookies fonctionnels (Optionnels)</h3>
          <p>
            Ces cookies permettent d'améliorer votre expérience en mémorisant vos préférences.
          </p>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Nom du cookie</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>theme</code></td>
                <td>Mémoriser votre préférence de thème (clair/sombre)</td>
                <td>1 an</td>
              </tr>
              <tr>
                <td><code>language</code></td>
                <td>Langue préférée (FR/EN/ES/PT)</td>
                <td>1 an</td>
              </tr>
              <tr>
                <td><code>videoVolume</code></td>
                <td>Volume préféré pour les vidéos de cours</td>
                <td>30 jours</td>
              </tr>
            </tbody>
          </table>

          <h3>2.3 Cookies analytics (Optionnels)</h3>
          <p>
            Ces cookies nous aident à comprendre comment vous utilisez le site pour l'améliorer.
          </p>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Nom du cookie</th>
                <th>Fournisseur</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_ga</code></td>
                <td>Google Analytics</td>
                <td>Distinguer les utilisateurs</td>
                <td>2 ans</td>
              </tr>
              <tr>
                <td><code>_gid</code></td>
                <td>Google Analytics</td>
                <td>Distinguer les utilisateurs</td>
                <td>24 heures</td>
              </tr>
              <tr>
                <td><code>_gat</code></td>
                <td>Google Analytics</td>
                <td>Limiter le taux de requêtes</td>
                <td>1 minute</td>
              </tr>
            </tbody>
          </table>

          <h3>2.4 Cookies marketing (Optionnels)</h3>
          <p>
            Ces cookies sont utilisés pour afficher des publicités pertinentes et mesurer l'efficacité des campagnes.
          </p>
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>Nom du cookie</th>
                <th>Fournisseur</th>
                <th>Finalité</th>
                <th>Durée</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>_fbp</code></td>
                <td>Facebook Pixel</td>
                <td>Tracking conversions publicitaires</td>
                <td>3 mois</td>
              </tr>
              <tr>
                <td><code>_ttp</code></td>
                <td>TikTok Pixel</td>
                <td>Mesure performance publicités</td>
                <td>13 mois</td>
              </tr>
              <tr>
                <td><code>IDE</code></td>
                <td>Google DoubleClick</td>
                <td>Publicité ciblée</td>
                <td>1 an</td>
              </tr>
            </tbody>
          </table>

          {/* 3. Gestion des cookies */}
          <h2>3. Comment gérer vos préférences cookies ?</h2>
          
          <h3>3.1 Via le banner cookies</h3>
          <p>
            Lors de votre première visite, un banner apparaît en bas de la page. 
            Vous pouvez :
          </p>
          <ul>
            <li><strong>Tout accepter :</strong> tous les cookies sont activés</li>
            <li><strong>Tout refuser :</strong> seuls les cookies nécessaires restent actifs</li>
            <li><strong>Personnaliser :</strong> choisir catégorie par catégorie</li>
          </ul>

          <h3>3.2 Via les paramètres du compte</h3>
          <p>
            Une fois connecté, vous pouvez modifier vos préférences à tout moment dans :
            <br />
            <strong>Paramètres → Confidentialité → Gestion des cookies</strong>
          </p>

          <h3>3.3 Via votre navigateur</h3>
          <p>
            Vous pouvez également gérer les cookies directement dans votre navigateur :
          </p>
          <ul>
            <li><strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies</li>
            <li><strong>Firefox :</strong> Options → Vie privée et sécurité → Cookies</li>
            <li><strong>Safari :</strong> Préférences → Confidentialité → Cookies</li>
            <li><strong>Edge :</strong> Paramètres → Confidentialité → Cookies</li>
          </ul>
          <p className="text-sm text-gray-600">
            ⚠️ Attention : Bloquer certains cookies peut affecter le fonctionnement du site.
          </p>

          {/* 4. Cookies tiers */}
          <h2>4. Cookies tiers</h2>
          <p>
            Certains cookies sont déposés par des services tiers que nous utilisons :
          </p>
          <ul>
            <li><strong>Google Analytics :</strong> mesure d'audience</li>
            <li><strong>Facebook Pixel :</strong> remarketing publicitaire</li>
            <li><strong>TikTok Pixel :</strong> mesure campagnes publicitaires</li>
            <li><strong>Crisp Chat :</strong> support client en ligne</li>
          </ul>
          <p>
            Ces sociétés ont leurs propres politiques de confidentialité. 
            Nous vous encourageons à les consulter.
          </p>

          {/* 5. Durée de conservation */}
          <h2>5. Durée de conservation</h2>
          <p>
            Les cookies ont des durées de vie variables :
          </p>
          <ul>
            <li><strong>Cookies de session :</strong> supprimés à la fermeture du navigateur</li>
            <li><strong>Cookies persistants :</strong> conservés selon la durée indiquée (max 13 mois pour analytics)</li>
          </ul>

          {/* 6. Modifications */}
          <h2>6. Modifications de cette politique</h2>
          <p>
            Nous pouvons modifier cette politique cookies pour refléter des changements dans nos pratiques. 
            La version mise à jour sera toujours disponible sur cette page avec la date de dernière modification.
          </p>

          {/* 7. Contact */}
          <h2>7. Questions ?</h2>
          <p>
            Pour toute question sur notre utilisation des cookies :
          </p>
          <ul>
            <li><strong>Email :</strong> privacy@payhuk.com</li>
            <li><strong>Support :</strong> Via le chat en bas à droite</li>
          </ul>

          {/* Bouton gestion cookies */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 text-center">
            <Cookie className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Gérer mes préférences cookies</h3>
            <p className="text-sm text-gray-600 mb-4">
              Modifiez vos choix de cookies à tout moment
            </p>
            <Button
              onClick={() => {
                // Ouvrir le modal de paramètres cookies
                localStorage.removeItem('cookieConsentGiven');
                window.location.reload();
              }}
            >
              Paramètres des cookies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

