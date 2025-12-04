/**
 * Page Admin - Monitoring en Temps Réel
 * Affiche le dashboard de monitoring avec les métriques et alertes
 */

import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';

export default function AdminMonitoring() {
  const { t } = useTranslation();
  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <MonitoringDashboard />
      </div>
    </AdminLayout>
  );
}

