/**
 * Shipping Integrations Export
 */

export { default as DHLService } from './dhl';
export { default as FedExService } from './fedex';
export { default as UPSService } from './ups';
export { default as ChronopostService } from './chronopost';
export { default as ColissimoService } from './colissimo';
export type {
  DHLRateRequest,
  DHLRate,
  DHLLabelRequest,
  DHLLabelResponse,
} from './dhl';
export type {
  FedExRateRequest,
  FedExRate,
  FedExLabelRequest,
  FedExLabelResponse,
} from './fedex';
export type {
  UPSRateRequest,
  UPSRate,
  UPSLabelRequest,
  UPSLabelResponse,
} from './ups';
export type {
  ChronopostRateRequest,
  ChronopostRate,
  ChronopostLabelRequest,
  ChronopostLabelResponse,
} from './chronopost';
export type {
  ColissimoRateRequest,
  ColissimoRate,
  ColissimoLabelRequest,
  ColissimoLabelResponse,
} from './colissimo';

