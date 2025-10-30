export * from './mockFedexService';
export * from './FedexService';

// Factory helper for consumers
import { fedexService } from './FedexService';
export const getFedexService = () => fedexService;


