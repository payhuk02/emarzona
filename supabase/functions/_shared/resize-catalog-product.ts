/**
 * Redimensionne une image au format catalogue Emarzona 1536×1024 (ratio 3:2).
 * Recadrage cover centré sur fond blanc — aligné avec resize-to-catalog.ts côté client.
 */
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

export const CATALOG_PRODUCT_WIDTH = 1536;
export const CATALOG_PRODUCT_HEIGHT = 1024;

export async function resizeToCatalogProductBytes(inputBytes: Uint8Array): Promise<Uint8Array> {
  const img = await Image.decode(inputBytes);
  const targetW = CATALOG_PRODUCT_WIDTH;
  const targetH = CATALOG_PRODUCT_HEIGHT;

  const scale = Math.max(targetW / img.width, targetH / img.height);
  const scaledW = Math.max(1, Math.round(img.width * scale));
  const scaledH = Math.max(1, Math.round(img.height * scale));
  const scaled = img.resize(scaledW, scaledH);

  const cropX = Math.max(0, Math.floor((scaledW - targetW) / 2));
  const cropY = Math.max(0, Math.floor((scaledH - targetH) / 2));
  const cropped = scaled.crop(cropX, cropY, targetW, targetH);

  const canvas = new Image(targetW, targetH);
  canvas.fill(0xffffffff);
  canvas.composite(cropped, 0, 0);

  return await canvas.encodeJPEG(90);
}

export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
