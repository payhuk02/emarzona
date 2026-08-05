const GENERIC_LINK_NAME_PATTERNS = [
  /^Lien Google Drive$/i,
  /^Lien Dropbox$/i,
  /^Lien externe$/i,
  /^Fichier \d+$/i,
  /^Fichier principal$/i,
];

export function isGenericAutoLinkName(name?: string | null): boolean {
  const trimmed = name?.trim();
  if (!trimmed) return true;
  return GENERIC_LINK_NAME_PATTERNS.some(pattern => pattern.test(trimmed));
}

/** Label shown on customer download buttons. */
export function getCustomerDigitalFileLabel(
  name: string | undefined | null,
  index: number
): string {
  const trimmed = name?.trim();
  if (trimmed && !isGenericAutoLinkName(trimmed)) {
    return trimmed;
  }
  return `Accédez au produit ${index + 1}`;
}
