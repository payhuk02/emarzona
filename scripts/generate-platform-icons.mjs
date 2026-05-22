/**
 * Génère logo plateforme + icônes PWA/favicon depuis le logo Emarzona source.
 * Usage: node scripts/generate-platform-icons.mjs [chemin-source.png]
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const defaultSource = path.join(
  root,
  '..',
  '.cursor',
  'projects',
  'c-emarzona',
  'assets',
  'c__Users_pc_AppData_Roaming_Cursor_User_workspaceStorage_7dd367ccfe3b9a239c36d72378991886_images_Logo_Emarzona.-98f60645-4a78-4542-a567-2c718ba17c21.png'
);

const sourcePath = process.argv[2]
  ? path.resolve(process.argv[2])
  : fs.existsSync(defaultSource)
    ? defaultSource
    : path.join(root, 'public', 'emarzona-logo.png');

if (!fs.existsSync(sourcePath)) {
  console.error('Source logo introuvable:', sourcePath);
  process.exit(1);
}

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const ROOT_ICON_SIZES = [16, 32, 180];

async function writePng(buffer, outPath, size) {
  await sharp(buffer)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(outPath);
}

async function main() {
  const source = sharp(sourcePath);
  const meta = await source.metadata();
  console.log('Source:', sourcePath, `${meta.width}x${meta.height}`);

  const logoMax = 1024;
  const logoOutPublic = path.join(root, 'public', 'emarzona-logo.png');
  const logoOutAsset = path.join(root, 'src', 'assets', 'brand', 'emarzona-logo.png');
  const optimizedDir = path.join(root, 'public', 'optimized');
  const iconsDir = path.join(root, 'public', 'icons');

  fs.mkdirSync(optimizedDir, { recursive: true });
  fs.mkdirSync(iconsDir, { recursive: true });

  await source
    .clone()
    .resize(logoMax, logoMax, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toFile(logoOutPublic);
  fs.copyFileSync(logoOutPublic, logoOutAsset);

  await source
    .clone()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .webp({ quality: 90 })
    .toFile(path.join(optimizedDir, 'emarzona-logo.webp'));

  const squareBuffer = await source
    .clone()
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();

  for (const size of PWA_SIZES) {
    const name = `icon-${size}x${size}.png`;
    await writePng(squareBuffer, path.join(iconsDir, name), size);
    if (size === 192 || size === 512) {
      await writePng(squareBuffer, path.join(root, 'public', name), size);
    }
  }

  for (const size of ROOT_ICON_SIZES) {
    const name = size === 180 ? 'apple-touch-icon.png' : `icon-${size}x${size}.png`;
    await writePng(squareBuffer, path.join(root, 'public', name), size);
  }

  await writePng(squareBuffer, path.join(root, 'public', 'badge-72x72.png'), 72);

  const shortcutNames = ['shortcut-cart', 'shortcut-marketplace', 'shortcut-orders'];
  for (const name of shortcutNames) {
    await writePng(squareBuffer, path.join(iconsDir, `${name}.png`), 96);
  }

  const favicon32 = path.join(root, 'public', 'icon-32x32.png');
  await writePng(squareBuffer, favicon32, 32);
  fs.copyFileSync(favicon32, path.join(root, 'public', 'favicon.ico'));

  const legacyCta = path.join(root, 'src', 'assets', 'landing', 'cta-emarzona-logo.webp');
  if (fs.existsSync(legacyCta)) {
    fs.unlinkSync(legacyCta);
    console.log('Removed:', legacyCta);
  }

  for (const junk of ['.png', '.ico']) {
    const junkPath = path.join(root, 'public', junk);
    if (fs.existsSync(junkPath)) {
      const stat = fs.statSync(junkPath);
      if (stat.isFile() && junk === '.png' && stat.size > 200000) {
        fs.unlinkSync(junkPath);
        console.log('Removed junk file:', junkPath);
      }
    }
  }

  console.log('Done. Logo + PWA icons generated.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
