/**
 * Page wrapper pour CustomerLoyalty - Route directe
 * Permet d'accéder directement au programme de fidélité depuis la sidebar
 * Note: CustomerLoyalty inclut déjà son propre layout avec SidebarProvider
 */

import CustomerLoyalty from './CustomerLoyalty';

export default function CustomerLoyaltyPage() {
  return <CustomerLoyalty />;
}

