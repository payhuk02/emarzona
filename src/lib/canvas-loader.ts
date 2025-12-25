/**
 * Lazy loader pour html2canvas
 * Charge seulement quand nécessaire pour réduire le bundle initial
 */

let html2canvasModule: typeof import('html2canvas') | null = null;

/**
 * Charge html2canvas de manière asynchrone
 */
export const loadHtml2Canvas = async () => {
  if (!html2canvasModule) {
    html2canvasModule = await import('html2canvas');
  }
  return html2canvasModule;
};

