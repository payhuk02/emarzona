/**
 * Analytics prestataire — RPC get_service_analytics_summary
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useStore } from '@/hooks/useStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import ServiceAnalyticsDashboard from '@/components/service/ServiceAnalyticsDashboard';

export default function ServiceAnalyticsPage() {
  const { serviceId: routeServiceId } = useParams<{ serviceId?: string }>();
  const navigate = useNavigate();
  const { store } = useStore();
  const [selectedId, setSelectedId] = useState(routeServiceId || '');

  const { data: services, isLoading } = useQuery({
    queryKey: ['store-services-analytics', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('store_id', store.id)
        .eq('product_type', 'service')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!store?.id,
  });

  useEffect(() => {
    if (routeServiceId) {
      setSelectedId(routeServiceId);
      return;
    }
    if (!selectedId && services?.[0]?.id) {
      setSelectedId(services[0].id);
    }
  }, [routeServiceId, selectedId, services]);

  const selectedName = services?.find(s => s.id === selectedId)?.name;

  return (
    <AppPageShell mainClassName="overflow-x-hidden">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/services')}
              className="mb-1 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Services
            </Button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics services
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Réservations, revenus et taux d’occupation des 30 derniers jours
              {selectedName ? ` — ${selectedName}` : ''}.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !services?.length ? (
          <p className="text-sm text-muted-foreground">
            Créez un service pour consulter les analytics.
          </p>
        ) : (
          <>
            <div className="max-w-md space-y-2">
              <Label htmlFor="service-analytics-select">Service</Label>
              <Select
                value={selectedId}
                onValueChange={id => {
                  setSelectedId(id);
                  navigate(`/dashboard/services/${id}/analytics`, { replace: true });
                }}
              >
                <SelectTrigger id="service-analytics-select">
                  <SelectValue placeholder="Choisir un service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedId ? <ServiceAnalyticsDashboard serviceId={selectedId} /> : null}
          </>
        )}
      </div>
    </AppPageShell>
  );
}
