import { createOrchestratedPayment } from './create-payment';
import { loadStoreForcePlatformPayments, loadStorePaymentConnections } from './load-connections';
import { resolvePaymentProvider } from './resolve-provider';

// Runtime touch pour la couverture des modules barrel.
const orchestratorBarrelLoaded = true;
void orchestratorBarrelLoaded;

export {
  resolvePaymentProvider,
  createOrchestratedPayment,
  loadStorePaymentConnections,
  loadStoreForcePlatformPayments,
};
