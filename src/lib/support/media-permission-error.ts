/**
 * Human-readable errors for getUserMedia mic/camera failures.
 */
export function describeMediaPermissionError(
  err: unknown,
  kind: 'microphone' | 'camera' = 'microphone'
): string {
  const label = kind === 'microphone' ? 'micro' : 'caméra';
  if (!(err instanceof Error)) {
    return `Autorisez le ${label} pour continuer.`;
  }

  const msg = (err.message || '').toLowerCase();
  const name = err.name || '';

  if (
    msg.includes('permissions policy') ||
    msg.includes('permission policy') ||
    msg.includes('policy violation') ||
    msg.includes('not allowed in this document')
  ) {
    return `L'accès au ${label} est bloqué par la politique de sécurité du site. Réessayez après le prochain déploiement.`;
  }

  if (
    name === 'NotAllowedError' ||
    name === 'PermissionDeniedError' ||
    msg.includes('permission denied')
  ) {
    return `Permission refusée. Autorisez le ${label} dans les paramètres du navigateur (cadenas à gauche de l'URL), puis réessayez.`;
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return kind === 'microphone'
      ? 'Aucun microphone détecté sur cet appareil.'
      : 'Aucune caméra détectée sur cet appareil.';
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return `Le ${label} est déjà utilisé par une autre application.`;
  }

  if (name === 'SecurityError' || msg.includes('secure context') || msg.includes('https')) {
    return `Le ${label} nécessite une connexion sécurisée (HTTPS).`;
  }

  return err.message || `Autorisez le ${label} pour continuer.`;
}
