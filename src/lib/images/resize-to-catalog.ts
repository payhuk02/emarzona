/**
 * Redimensionne une image au format catalogue Emarzona (1536×1024, ratio 3:2).
 * Recadrage « cover » centré sur fond blanc.
 */

import { IMAGE_FORMATS } from '@/config/image-formats';
import { blobToFile } from '@/lib/images/compress';

const TARGET = IMAGE_FORMATS.product;

function loadImageSource(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire l'image"));
    };
    img.src = url;
  });
}

/**
 * Produit une image exactement 1536×1024 en WebP (qualité catalogue).
 */
export async function resizeToCatalogProduct(
  file: File | Blob,
  originalName = 'catalog.webp'
): Promise<File> {
  const img = await loadImageSource(file);
  const targetW = TARGET.width;
  const targetH = TARGET.height;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const dx = (targetW - sw) / 2;
  const dy = (targetH - sh) / 2;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, dx, dy, sw, sh);

  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/webp', 0.88)
  );
  if (!blob) throw new Error('Échec du redimensionnement catalogue');

  return blobToFile(blob, originalName);
}
