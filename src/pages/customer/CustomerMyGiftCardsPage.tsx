/**
 * Page wrapper pour CustomerMyGiftCards - Route directe
 * Permet d'accéder directement aux cartes cadeaux depuis la sidebar
 * Note: CustomerMyGiftCards est un composant simple sans layout, donc on ajoute le layout ici
 */

import { useTranslation } from 'react-i18next';
import { AppPageShell } from '@/components/layout/AppPageShell';
import CustomerMyGiftCards from './CustomerMyGiftCards';

export default function CustomerMyGiftCardsPage() {
  const { t } = useTranslation();
  return (
    <AppPageShell shellClassName="bg-gray-50 dark:bg-gray-900" mainClassName="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <CustomerMyGiftCards />
      </div>
    </AppPageShell>
  );
}
