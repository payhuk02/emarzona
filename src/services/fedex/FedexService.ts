import { mockFedexService, type FedexRateRequest, type FedexRate, type FedexShipmentRequest, type FedexShipmentResponse, type FedexTrackingResponse } from './mockFedexService';

/**
 * Minimal real FedEx service wrapper (skeleton).
 * If VITE_FEDEX_API_KEY is not set, we transparently fallback to mock service.
 */
export class FedexService {
  private readonly apiKey = import.meta.env.VITE_FEDEX_API_KEY as string | undefined;
  private readonly baseUrl = 'https://apis.fedex.com';

  private get isConfigured(): boolean {
    return !!this.apiKey;
  }

  async getRates(request: FedexRateRequest): Promise<FedexRate[]> {
    if (!this.isConfigured) return mockFedexService.getRates(request);
    // TODO: Implement real API call
    return await mockFedexService.getRates(request);
  }

  async createShipment(request: FedexShipmentRequest): Promise<FedexShipmentResponse> {
    if (!this.isConfigured) return mockFedexService.createShipment(request);
    // TODO: Implement real API call
    return await mockFedexService.createShipment(request);
  }

  async getTracking(trackingNumber: string): Promise<FedexTrackingResponse> {
    if (!this.isConfigured) return mockFedexService.getTracking(trackingNumber);
    // TODO: Implement real API call
    return await mockFedexService.getTracking(trackingNumber);
  }

  async cancelShipment(trackingNumber: string): Promise<{ success: boolean }> {
    if (!this.isConfigured) return mockFedexService.cancelShipment(trackingNumber);
    // TODO: Implement real API call
    return await mockFedexService.cancelShipment(trackingNumber);
  }
}

export const fedexService = new FedexService();


