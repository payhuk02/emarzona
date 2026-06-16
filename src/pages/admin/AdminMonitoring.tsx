/**
 * Page Admin - Monitoring en Temps Réel
 * Affiche le dashboard de monitoring avec les métriques et alertes
 */

import { AdminLayout } from '@/components/admin/AdminLayout';
import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { CacheMonitoringDashboard } from '@/components/monitoring/CacheMonitoringDashboard';

export default function AdminMonitoring() {
  return (
    <AdminLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-8">
        <CacheMonitoringDashboard />
        <MonitoringDashboard />
      </div>
    </AdminLayout>
  );
}
