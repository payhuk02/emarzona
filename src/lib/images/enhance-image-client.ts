/**
 * Client pour l'edge function `enhance-image` :
 * préparation d'image, parsing d'erreurs, appel typé.
 */

import { supabase } from '@/integrations/supabase/client';
import { compressImage } from '@/lib/images/compress';
import { imageUrlToBlob } from '@/lib/images/imageUrlToBlob';

const INFERENCE_MAX_PX = 2048;
const MAX_DATA_URL_CHARS = 10_000_000;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Lecture de l'image impossible"));
    reader.readAsDataURL(blob);
  });
}

async function compressBlobToDataUrl(blob: Blob, maxPx: number): Promise<string> {
  const file = new File([blob], 'studio-input.jpg', {
    type: blob.type.startsWith('image/') ? blob.type : 'image/jpeg',
  });
  const { blob: compressed } = await compressImage(file, {
    maxWidth: maxPx,
    maxHeight: maxPx,
    quality: 0.85,
    mimeType: 'image/jpeg',
  });
  return blobToDataUrl(compressed);
}

/**
 * Redimensionne l'image avant envoi à l'IA (moins de latence, coût et échecs payload).
 */
export async function prepareImageForAI(
  sourceUrl: string,
  sourceFile: File | null,
  maxPx = INFERENCE_MAX_PX
): Promise<string> {
  if (sourceFile) {
    return compressBlobToDataUrl(sourceFile, maxPx);
  }

  if (sourceUrl.startsWith('blob:')) {
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error("Impossible de lire l'image locale");
    return compressBlobToDataUrl(await res.blob(), maxPx);
  }

  if (sourceUrl.startsWith('data:') || sourceUrl.startsWith('http')) {
    const blob = sourceUrl.startsWith('data:')
      ? await imageUrlToBlob(sourceUrl)
      : await (await fetch(sourceUrl)).blob();
    return compressBlobToDataUrl(blob, maxPx);
  }

  return sourceUrl;
}

async function parseEdgeFunctionError(error: unknown, data: unknown): Promise<string> {
  const fromData =
    data && typeof data === 'object' && 'error' in data
      ? String((data as { error: unknown }).error)
      : null;
  if (fromData) return fromData;

  const err = error as { message?: string; context?: Response | { error?: string } };
  if (err?.context instanceof Response) {
    try {
      const json = await err.context.json();
      if (json?.error) return String(json.error);
    } catch {
      /* ignore */
    }
  }
  if (err?.context && typeof err.context === 'object' && 'error' in err.context) {
    return String((err.context as { error: unknown }).error);
  }

  const msg = err?.message ?? '';
  if (msg.includes('402')) return "Crédits IA épuisés. Contactez l'administrateur.";
  if (msg.includes('403')) return "L'amélioration d'image est désactivée ou non autorisée.";
  if (msg.includes('429')) return 'Trop de requêtes. Patientez quelques secondes.';
  if (msg.includes('401')) return 'Connectez-vous pour utiliser le Studio IA.';

  return msg || "Échec de l'amélioration IA";
}

export interface EnhanceImageResult {
  imageUrl: string;
  model?: string;
}

export async function invokeEnhanceImage(
  imageUrl: string,
  instruction: string
): Promise<EnhanceImageResult> {
  if (imageUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error('Image trop volumineuse après compression. Essayez une image plus petite.');
  }

  const { data, error } = await supabase.functions.invoke('enhance-image', {
    body: { imageUrl, instruction: instruction.trim() },
  });

  if (error) {
    throw new Error(await parseEdgeFunctionError(error, data));
  }

  const body = data as { imageUrl?: string; error?: string; model?: string } | null;
  if (body?.error) throw new Error(body.error);
  if (!body?.imageUrl) throw new Error("Aucune image renvoyée par l'IA");

  return { imageUrl: body.imageUrl, model: body.model };
}
