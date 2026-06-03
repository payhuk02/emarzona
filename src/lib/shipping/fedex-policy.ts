/**
 * Politique FedEx côté client : pas de mock transparent en build production.
 */

export class FedexUnavailableError extends Error {
  constructor(message = 'FedEx indisponible — tarif forfaitaire appliqué') {
    super(message);
    this.name = 'FedexUnavailableError';
  }
}

export function isFedexMockAllowed(): boolean {
  const explicit = import.meta.env.VITE_FEDEX_ALLOW_MOCK;
  if (explicit === 'true') return true;
  if (explicit === 'false') return false;
  return !import.meta.env.PROD;
}

export function assertFedexResponseNotMock(source?: string): void {
  if (!isFedexMockAllowed() && source === 'mock') {
    throw new FedexUnavailableError(
      'Les tarifs FedEx simulés sont désactivés en production. Configurez les clés API ou les zones vendeur.'
    );
  }
}
