import {
  resolveScriptIntegrity,
  shouldUseAnonymousCrossOrigin,
} from '@/lib/security/external-script-integrity';

export interface LoadExternalScriptOptions {
  id?: string;
  async?: boolean;
  defer?: boolean;
  /** Forcer ou désactiver l'intégrité (défaut : résolution automatique via registre). */
  integrity?: string | null;
  onLoad?: () => void;
  onError?: (event: Event | string) => void;
}

/**
 * Charge un script externe avec SRI lorsque l'URL est dans le registre stable.
 */
export function loadExternalScript(
  src: string,
  options: LoadExternalScriptOptions = {}
): HTMLScriptElement {
  if (typeof document === 'undefined') {
    throw new Error('loadExternalScript requires a browser environment');
  }

  if (options.id && document.getElementById(options.id)) {
    return document.getElementById(options.id) as HTMLScriptElement;
  }

  const script = document.createElement('script');
  script.src = src;
  script.type = 'text/javascript';

  if (options.id) {
    script.id = options.id;
  }
  if (options.async !== false) {
    script.async = true;
  }
  if (options.defer) {
    script.defer = true;
  }

  const integrity =
    options.integrity === null ? undefined : (options.integrity ?? resolveScriptIntegrity(src));

  if (integrity) {
    script.integrity = integrity;
    script.crossOrigin = 'anonymous';
  } else if (shouldUseAnonymousCrossOrigin(src)) {
    script.crossOrigin = 'anonymous';
  }

  if (options.onLoad) {
    script.addEventListener('load', () => options.onLoad?.(), { once: true });
  }
  if (options.onError) {
    script.addEventListener('error', event => options.onError?.(event), { once: true });
  }

  document.head.appendChild(script);
  return script;
}
