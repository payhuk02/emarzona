import { mockFedexService, type FedexRateRequest, type FedexRate, type FedexShipmentRequest, type FedexShipmentResponse, type FedexTrackingResponse } from './mockFedexService';

/**
 * Minimal real FedEx service wrapper (skeleton).
 * If VITE_FEDEX_API_KEY is not set, we transparently fallback to mock service.
 */
export class FedexService {
  private readonly apiKey = import.meta.env.VITE_FEDEX_API_KEY as string | undefined;
  private readonly apiSecret = import.meta.env.VITE_FEDEX_API_SECRET as string | undefined;
  private readonly accountNumber = import.meta.env.VITE_FEDEX_ACCOUNT_NUMBER as string | undefined;
  private readonly forceMockMode = import.meta.env.VITE_FEDEX_FORCE_MOCK === 'true';

  private get isConfigured(): boolean {
    return !!this.apiKey && !!this.apiSecret && !!this.accountNumber;
  }

  private get shouldUseMock(): boolean {
    return this.forceMockMode || !this.isConfigured;
  }

  private ensureOperationalMode(operation: string): void {
    if (this.shouldUseMock) {
      if (this.forceMockMode) return;

      // Legacy behavior: no credentials => mock for local/dev.
      // If only partial credentials are set, we fail fast to avoid false production confidence.
      const hasAnyCredential = !!this.apiKey || !!this.apiSecret || !!this.accountNumber;
      const hasAllCredentials = this.isConfigured;

      if (hasAnyCredential && !hasAllCredentials) {
        throw new Error(
          `FedEx ${operation} refused: incomplete credentials. Set VITE_FEDEX_API_KEY, VITE_FEDEX_API_SECRET and VITE_FEDEX_ACCOUNT_NUMBER or enable VITE_FEDEX_FORCE_MOCK=true for development.`
        );
      }
    }
  }

  async getRates(request: FedexRateRequest): Promise<FedexRate[]> {
    this.ensureOperationalMode('getRates');
    if (this.shouldUseMock) return mockFedexService.getRates(request);
    // TODO: Implement real API call
    return await mockFedexService.getRates(request);
  }

  async createShipment(request: FedexShipmentRequest): Promise<FedexShipmentResponse> {
    this.ensureOperationalMode('createShipment');
    if (this.shouldUseMock) return mockFedexService.createShipment(request);
    // TODO: Implement real API call
    return await mockFedexService.createShipment(request);
  }

  async getTracking(trackingNumber: string): Promise<FedexTrackingResponse> {
    this.ensureOperationalMode('getTracking');
    if (this.shouldUseMock) return mockFedexService.getTracking(trackingNumber);
    // TODO: Implement real API call
    return await mockFedexService.getTracking(trackingNumber);
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean }> {
    this.ensureOperationalMode('cancelShipment');
    if (this.shouldUseMock) return mockFedexService.cancelShipment(trackingNumber);
    // TODO: Implement real API call
    return await mockFedexService.cancelShipment(trackingNumber);
  }
}

export const fedexService = new FedexService();








