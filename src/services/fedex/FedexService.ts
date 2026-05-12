import { mockFedexService, type FedexRateRequest, type FedexRate, type FedexShipmentRequest, type FedexShipmentResponse, type FedexTrackingResponse } from './mockFedexService';

/**
 * Minimal real FedEx service wrapper (skeleton).
 * If VITE_FEDEX_API_KEY is not set, we transparently fallback to mock service.
 */
export class FedexService {
  // Les clés secrètes doivent résider UNIQUEMENT côté serveur (Edge Functions)
  private readonly forceMockMode = true; // Forcé en mock en attendant l'implémentation complète via Edge Function

  private get shouldUseMock(): boolean {
    return this.forceMockMode;
  }

  private ensureOperationalMode(operation: string): void {
    if (!this.shouldUseMock) {
      throw new Error(`FedEx ${operation} must be implemented via a secure Supabase Edge Function.`);
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








