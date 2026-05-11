/**
 * Compression d'images côté client (canvas).
 * Aucune dépendance externe. Sortie en WebP/JPEG selon support navigateur.
 */

export interface CompressOptions {
  maxWidth?: number; // largeur max (px)
  maxHeight?: number; // hauteur max (px)
  quality?: number; // 0-1
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
}

const DEFAULTS: Required<CompressOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.82,
  mimeType: 'image/webp',
};

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Compresse et redimensionne une image.
 * Retourne un Blob prêt à uploader (et son data URL pour preview optionnelle).
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {},
): Promise<{ blob: Blob; width: number; height: number; ratio: number }> {
  const opts = { ...DEFAULTS, ...options };
  const img = await loadImage(file);

  let { width, height } = img;
  const ratio = Math.min(opts.maxWidth / width, opts.maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponible');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, opts.mimeType, opts.quality),
  );
  if (!blob) throw new Error('Compression échouée');

  return {
    blob,
    width,
    height,
    ratio: blob.size / file.size,
  };
}

/**
 * Convertit un Blob en File avec une extension cohérente.
 */
export function blobToFile(blob: Blob, originalName: string): File {
  const ext =
    blob.type === 'image/webp'
      ? '.webp'
      : blob.type === 'image/jpeg'
      ? '.jpg'
      : blob.type === 'image/png'
      ? '.png'
      : '';
  const base = originalName.replace(/\.[^.]+$/, '');
  return new File([blob], `${base}${ext}`, { type: blob.type });
}
