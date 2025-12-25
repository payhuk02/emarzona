/**
 * Script de vérification i18n pour toutes les pages
 * Vérifie que toutes les pages utilisent le système de traduction
 */

import * as fs from 'fs';
import * as path from 'path';

const PAGES_DIR = path.join(process.cwd(), 'src/pages');
const I18N_IMPORTS = [
  'useTranslation',
  'useTrans',
  't(',
  'i18n.t',
  'from \'react-i18next\'',
  'from \'@/i18n\'',
  'from "@/i18n"',
];

interface PageStatus {
  file: string;
  hasI18n: boolean;
  hasHardcodedText: boolean;
  issues: string[];
}

const results: PageStatus[] = [];

function checkFile(filePath: string): PageStatus {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const hasI18n = I18N_IMPORTS.some(importPattern => content.includes(importPattern));
  
  // Détecter les textes hardcodés potentiels (français)
  const frenchPatterns = [
    /['"](Bonjour|Bienvenue|Connexion|Inscription|Déconnexion|Enregistrer|Supprimer|Modifier|Créer|Annuler|Confirmer|Valider|Rechercher|Filtrer|Trier|Ajouter|Retirer|Voir|Détails|Commander|Acheter|Payer|Panier|Produit|Produits|Commande|Commandes|Client|Clients|Boutique|Boutiques|Paramètres|Profil|Tableau de bord|Statistiques|Rapports|Analyses|Notifications|Messages|Historique|Factures|Téléchargements|Favoris|Liste de souhaits|Retours|Remboursements|Livraison|Expédition|Paiement|Paiements|Retrait|Retraits|Affilié|Affiliés|Commissions|Promotions|Réductions|Codes promo|Cadeaux|Fidélité|Points|Badges|Trophées|Classement|Leaderboard|Gamification|Cours|Formations|Services|Réservations|Calendrier|Disponibilité|Personnel|Employés|Équipe|Inventaire|Stock|Entrepôt|Entrepôts|Fournisseurs|Suppliers|Intégrations|Webhooks|API|Sécurité|Authentification|Autorisation|Permissions|Rôles|Utilisateurs|Administration|Admin|Modérateur|Vendeur|Vendeurs|Acheteur|Acheteurs|Client|Clients|Marché|Marketplace|Boutique|Store|Storefront|Produit|Product|Digital|Physique|Service|Cours|Course|Bundle|Pack|Kit|Promotion|Réduction|Code promo|Coupon|Carte cadeau|Gift card|Fidélité|Loyalty|Points|Badges|Trophées|Gamification|Affiliation|Affiliate|Commission|Référence|Referral|Parrainage|Sponsorship|Retrait|Withdrawal|Paiement|Payment|Moneroo|PayDunya|Mobile Money|Orange Money|MTN Money|Moov Money|Virement|Transfert|Carte bancaire|Credit card|PayPal|Stripe|Livraison|Shipping|Expédition|Expéditeur|Shipping service|Service de livraison|Transporteur|Carrier|Suivi|Tracking|Numéro de suivi|Tracking number|Statut|Status|État|State|En attente|Pending|En cours|In progress|En cours de traitement|Processing|Traité|Processed|Complété|Completed|Terminé|Finished|Livré|Delivered|Expédié|Shipped|En transit|In transit|Annulé|Cancelled|Annulé|Canceled|Remboursé|Refunded|Remboursement|Refund|Retour|Return|Échange|Exchange|Réclamation|Dispute|Litige|Litigation|Résolu|Resolved|Non résolu|Unresolved|En cours|In progress|Ouvert|Open|Fermé|Closed|Archivé|Archived|Supprimé|Deleted|Actif|Active|Inactif|Inactive|Désactivé|Disabled|Activé|Enabled|Visible|Hidden|Caché|Masqué|Publié|Published|Non publié|Unpublished|Brouillon|Draft|En révision|Under review|Approuvé|Approved|Rejeté|Rejected|Suspendu|Suspended|Banni|Banned|Bloqué|Blocked|Débloqué|Unblocked|Vérifié|Verified|Non vérifié|Unverified|Premium|Gratuit|Free|Payant|Paid|Abonnement|Subscription|Mensuel|Monthly|Annuel|Annual|Trimestriel|Quarterly|Hebdomadaire|Weekly|Quotidien|Daily|Ponctuel|One-time|Récurrent|Recurring|Automatique|Automatic|Manuel|Manual|Immédiat|Instant|Instantané|Instantaneous|Différé|Deferred|Programmé|Scheduled|Planifié|Planned|Urgent|Urgent|Normal|Normal|Faible|Low|Moyen|Medium|Élevé|High|Critique|Critical|Important|Important|Prioritaire|Priority|Faible priorité|Low priority|Haute priorité|High priority|Urgence|Urgency|Date|Date|Heure|Time|Jour|Day|Semaine|Week|Mois|Month|Année|Year|Aujourd'hui|Today|Hier|Yesterday|Demain|Tomorrow|Cette semaine|This week|Ce mois|This month|Cette année|This year|Dernière semaine|Last week|Dernier mois|Last month|Dernière année|Last year|Prochaine semaine|Next week|Prochain mois|Next month|Prochaine année|Next year|Début|Start|Fin|End|Début|Beginning|Fin|Ending|Début|Start date|Date de début|End date|Date de fin|Créé le|Created at|Créé|Created|Modifié le|Updated at|Modifié|Updated|Supprimé le|Deleted at|Supprimé|Deleted|Publié le|Published at|Publié|Published|Expiré le|Expires at|Expiré|Expired|Expire le|Expires|Valide jusqu'au|Valid until|Valide|Valid|Invalide|Invalid|Expiré|Expired|Actif|Active|Inactif|Inactive|Désactivé|Disabled|Activé|Enabled|Visible|Hidden|Caché|Masqué|Publié|Published|Non publié|Unpublished|Brouillon|Draft|En révision|Under review|Approuvé|Approved|Rejeté|Rejected|Suspendu|Suspended|Banni|Banned|Bloqué|Blocked|Débloqué|Unblocked|Vérifié|Verified|Non vérifié|Unverified|Premium|Gratuit|Free|Payant|Paid|Abonnement|Subscription|Mensuel|Monthly|Annuel|Annual|Trimestriel|Quarterly|Hebdomadaire|Weekly|Quotidien|Daily|Ponctuel|One-time|Récurrent|Recurring|Automatique|Automatic|Manuel|Manual|Immédiat|Instant|Instantané|Instantaneous|Différé|Deferred|Programmé|Scheduled|Planifié|Planned|Urgent|Urgent|Normal|Normal|Faible|Low|Moyen|Medium|Élevé|High|Critique|Critical|Important|Important|Prioritaire|Priority|Faible priorité|Low priority|Haute priorité|High priority|Urgence|Urgency|Date|Date|Heure|Time|Jour|Day|Semaine|Week|Mois|Month|Année|Year|Aujourd'hui|Today|Hier|Yesterday|Demain|Tomorrow|Cette semaine|This week|Ce mois|This month|Cette année|This year|Dernière semaine|Last week|Dernier mois|Last month|Dernière année|Last year|Prochaine semaine|Next week|Prochain mois|Next month|Prochaine année|Next year|Début|Start|Fin|End|Début|Beginning|Fin|Ending|Début|Start date|Date de début|End date|Date de fin|Créé le|Created at|Créé|Created|Modifié le|Updated at|Modifié|Updated|Supprimé le|Deleted at|Supprimé|Deleted|Publié le|Published at|Publié|Published|Expiré le|Expires at|Expiré|Expired|Expire le|Expires|Valide jusqu'au|Valid until|Valide|Valid|Invalide|Invalid|Expiré|Expired)['"]/gi,
  ];
  
  const hasHardcodedText = frenchPatterns.some(pattern => pattern.test(content));
  
  const issues: string[] = [];
  if (!hasI18n) {
    issues.push('Pas d\'import i18n détecté');
  }
  if (hasHardcodedText) {
    issues.push('Textes français hardcodés potentiels détectés');
  }
  
  return {
    file: relativePath,
    hasI18n,
    hasHardcodedText,
    issues,
  };
}

function scanDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Ignorer les fichiers de test et les fichiers spéciaux
      if (!file.includes('.test.') && !file.includes('.spec.') && file !== 'I18nTest.tsx') {
        const status = checkFile(filePath);
        results.push(status);
      }
    }
  }
}

// Scanner le répertoire des pages
scanDirectory(PAGES_DIR);

// Générer le rapport
const pagesWithI18n = results.filter(r => r.hasI18n);
const pagesWithoutI18n = results.filter(r => !r.hasI18n);
const pagesWithHardcodedText = results.filter(r => r.hasHardcodedText);

console.log('\n=== RAPPORT DE VÉRIFICATION I18N ===\n');
console.log(`Total de pages analysées: ${results.length}`);
console.log(`Pages avec i18n: ${pagesWithI18n.length} (${((pagesWithI18n.length / results.length) * 100).toFixed(1)}%)`);
console.log(`Pages sans i18n: ${pagesWithoutI18n.length} (${((pagesWithoutI18n.length / results.length) * 100).toFixed(1)}%)`);
console.log(`Pages avec textes hardcodés: ${pagesWithHardcodedText.length}\n`);

if (pagesWithoutI18n.length > 0) {
  console.log('\n=== PAGES SANS I18N ===\n');
  pagesWithoutI18n.forEach(page => {
    console.log(`❌ ${page.file}`);
    if (page.issues.length > 0) {
      page.issues.forEach(issue => console.log(`   - ${issue}`));
    }
  });
}

if (pagesWithHardcodedText.length > 0) {
  console.log('\n=== PAGES AVEC TEXTES HARDCODÉS POTENTIELS ===\n');
  pagesWithHardcodedText.forEach(page => {
    console.log(`⚠️  ${page.file}`);
  });
}

// Sauvegarder le rapport dans un fichier JSON
const report = {
  total: results.length,
  withI18n: pagesWithI18n.length,
  withoutI18n: pagesWithoutI18n.length,
  withHardcodedText: pagesWithHardcodedText.length,
  pagesWithoutI18n: pagesWithoutI18n.map(p => ({
    file: p.file,
    issues: p.issues,
  })),
  pagesWithHardcodedText: pagesWithHardcodedText.map(p => p.file),
  allPages: results,
};

fs.writeFileSync(
  path.join(process.cwd(), 'docs/analyses/I18N_VERIFICATION_REPORT.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Rapport sauvegardé dans: docs/analyses/I18N_VERIFICATION_REPORT.json\n');

