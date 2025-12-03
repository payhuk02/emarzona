/**
 * Script simple pour générer le favicon (sans dépendances externes)
 * Utilise uniquement Node.js natif pour copier et renommer le logo
 * 
 * Usage:
 *   node scripts/generate-favicon-simple.js
 * 
 * Prérequis:
 *   - Le fichier public/emarzona-logo.png doit exister
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'emarzona-logo.png');
const FAVICON_PATH = path.join(PUBLIC_DIR, 'favicon.ico');

/**
 * Génère un favicon simple en copiant le logo
 * Note: Ce script crée une copie du logo. Pour un vrai ICO, utilisez generate-favicon.js ou un outil en ligne
 */
function generateFaviconSimple() {
  try {
    // Vérifier que le logo existe
    if (!fs.existsSync(LOGO_PATH)) {
      console.error('❌ Erreur: Le fichier public/emarzona-logo.png n\'existe pas.');
      console.log('📝 Veuillez d\'abord placer votre logo dans public/emarzona-logo.png');
      process.exit(1);
    }

    console.log('🔄 Génération du favicon (méthode simple)...');
    console.log(`📁 Logo source: ${LOGO_PATH}`);

    // Copier le logo comme favicon
    // Note: Les navigateurs modernes acceptent PNG comme favicon même avec l'extension .ico
    fs.copyFileSync(LOGO_PATH, FAVICON_PATH);
    console.log(`✅ Favicon créé: ${FAVICON_PATH}`);

    // Créer aussi une copie PNG pour compatibilité
    const faviconPngPath = path.join(PUBLIC_DIR, 'favicon.png');
    fs.copyFileSync(LOGO_PATH, faviconPngPath);
    console.log(`✅ Favicon PNG créé: ${faviconPngPath}`);

    console.log('\n✨ Génération terminée!');
    console.log('\n💡 Note: Pour optimiser les tailles et créer un vrai fichier ICO, utilisez:');
    console.log('   - node scripts/generate-favicon.js (nécessite: npm install sharp)');
    console.log('   - https://favicon.io/favicon-converter/');
    console.log('   - https://realfavicongenerator.net/');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
generateFaviconSimple();

