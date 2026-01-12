import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Fonction pour créer une icône SVG simple
function createSVGIcon(size, text = 'E') {
  return `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" fill="white" text-anchor="middle" dy=".35em" font-weight="bold">${text}</text>
</svg>
`;
}

// Tailles d'icônes requises par le manifest
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Générer toutes les icônes
async function generateIcons() {
  console.log('Génération des icônes PWA...');

  for (const size of iconSizes) {
    const svgBuffer = Buffer.from(createSVGIcon(size));
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

    try {
      await sharp(svgBuffer)
        .png()
        .toFile(outputPath);

      console.log(`✓ Générée: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ Erreur pour icon-${size}x${size}.png:`, error.message);
    }
  }

  // Générer les icônes de raccourcis
  const shortcutSizes = [96];
  for (const size of shortcutSizes) {
    const svgBuffer = Buffer.from(createSVGIcon(size, 'M'));
    const outputPath = path.join(iconsDir, `shortcut-marketplace.png`);

    try {
      await sharp(svgBuffer)
        .png()
        .toFile(outputPath);

      console.log(`✓ Générée: shortcut-marketplace.png`);
    } catch (error) {
      console.error(`✗ Erreur pour shortcut-marketplace.png:`, error.message);
    }

    // Icône panier
    const cartSvgBuffer = Buffer.from(createSVGIcon(size, 'C'));
    const cartOutputPath = path.join(iconsDir, `shortcut-cart.png`);

    try {
      await sharp(cartSvgBuffer)
        .png()
        .toFile(cartOutputPath);

      console.log(`✓ Générée: shortcut-cart.png`);
    } catch (error) {
      console.error(`✗ Erreur pour shortcut-cart.png:`, error.message);
    }

    // Icône commandes
    const ordersSvgBuffer = Buffer.from(createSVGIcon(size, 'O'));
    const ordersOutputPath = path.join(iconsDir, `shortcut-orders.png`);

    try {
      await sharp(ordersSvgBuffer)
        .png()
        .toFile(ordersOutputPath);

      console.log(`✓ Générée: shortcut-orders.png`);
    } catch (error) {
      console.error(`✗ Erreur pour shortcut-orders.png:`, error.message);
    }
  }

  console.log('Génération des icônes terminée !');
}

generateIcons().catch(console.error);