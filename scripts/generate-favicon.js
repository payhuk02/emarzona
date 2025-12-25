/**
 * Script pour générer automatiquement le favicon à partir du logo Emarzona
 * 
 * Usage:
 *   node scripts/generate-favicon.js
 * 
 * Prérequis:
 *   - Le fichier public/emarzona-logo.png doit exister
 *   - npm install sharp (pour la conversion d'images)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '../public');
const LOGO_PATH = path.join(PUBLIC_DIR, 'emarzona-logo.png');
const FAVICON_PATH = path.join(PUBLIC_DIR, 'favicon.ico');

// Tailles pour le favicon (ICO supporte plusieurs tailles)
const FAVICON_SIZES = [16, 32, 48];

/**
 * Génère un favicon ICO à partir du logo PNG
 */
async function generateFavicon() {
  try {
    // Vérifier que le logo existe
    if (!fs.existsSync(LOGO_PATH)) {
      console.error('❌ Erreur: Le fichier public/emarzona-logo.png n\'existe pas.');
      console.log('📝 Veuillez d\'abord placer votre logo dans public/emarzona-logo.png');
      process.exit(1);
    }

    console.log('🔄 Génération du favicon à partir du logo...');
    console.log(`📁 Logo source: ${LOGO_PATH}`);

    // Lire le logo
    const logoBuffer = await sharp(LOGO_PATH)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparence
      })
      .png()
      .toBuffer();

    // Générer les différentes tailles pour le favicon
    const faviconImages = await Promise.all(
      FAVICON_SIZES.map(async (size) => {
        const buffer = await sharp(logoBuffer)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer();
        return { size, buffer };
      })
    );

    // Pour créer un vrai fichier ICO, on utilise la première taille (32x32)
    // Note: sharp ne supporte pas directement ICO, donc on crée un PNG
    // qui sera renommé en .ico (la plupart des navigateurs l'acceptent)
    const favicon32 = await sharp(logoBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Sauvegarder le favicon
    fs.writeFileSync(FAVICON_PATH, favicon32);
    console.log(`✅ Favicon généré avec succès: ${FAVICON_PATH}`);

    // Générer aussi un favicon PNG pour une meilleure compatibilité
    const faviconPngPath = path.join(PUBLIC_DIR, 'favicon-32x32.png');
    fs.writeFileSync(faviconPngPath, favicon32);
    console.log(`✅ Favicon PNG généré: ${faviconPngPath}`);

    // Générer aussi un favicon 16x16
    const favicon16 = await sharp(logoBuffer)
      .resize(16, 16, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const favicon16Path = path.join(PUBLIC_DIR, 'favicon-16x16.png');
    fs.writeFileSync(favicon16Path, favicon16);
    console.log(`✅ Favicon 16x16 généré: ${favicon16Path}`);

    // Générer Apple Touch Icon (180x180)
    const appleTouchIcon = await sharp(logoBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Fond blanc pour iOS
      })
      .png()
      .toBuffer();

    const appleTouchIconPath = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
    fs.writeFileSync(appleTouchIconPath, appleTouchIcon);
    console.log(`✅ Apple Touch Icon généré: ${appleTouchIconPath}`);

    console.log('\n✨ Génération terminée avec succès!');
    console.log('\n📋 Fichiers générés:');
    console.log('   - favicon.ico (32x32)');
    console.log('   - favicon-32x32.png');
    console.log('   - favicon-16x16.png');
    console.log('   - apple-touch-icon.png (180x180)');
    console.log('\n💡 Note: Pour un vrai fichier ICO multi-tailles, utilisez un outil en ligne comme favicon.io');

  } catch (error) {
    console.error('❌ Erreur lors de la génération du favicon:', error.message);
    console.log('\n💡 Alternative: Utilisez un outil en ligne:');
    console.log('   - https://favicon.io/favicon-converter/');
    console.log('   - https://realfavicongenerator.net/');
    process.exit(1);
  }
}

// Exécuter le script
generateFavicon();

