/**
 * Convertit une URL d'image (data:, blob:) en Blob sans fetch réseau inutile.
 * Les URLs HTTPS distantes ne sont pas fetchées côté client (bloquées par la CSP).
 */

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma < 0) throw new Error('Data URL invalide');

  const header = dataUrl.slice(0, comma);
  const payload = dataUrl.slice(comma + 1);
  const mime = header.match(/^data:([^;,]+)/)?.[1]?.trim() || 'application/octet-stream';
  const isBase64 = /;base64/i.test(header);

  if (isBase64) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  return new Blob([decodeURIComponent(payload)], { type: mime });
}

export async function imageUrlToBlob(url: string): Promise<Blob> {
  if (url.startsWith('data:')) {
    return dataUrlToBlob(url);
  }

  if (url.startsWith('blob:')) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Impossible de lire l'image locale");
    return res.blob();
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    throw new Error(
      "L'image IA n'est pas au bon format pour l'enregistrement. Relancez l'amélioration puis réessayez."
    );
  }

  throw new Error("Format d'image non supporté");
}
