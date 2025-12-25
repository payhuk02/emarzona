/**
 * Update Stats Component
 * Date: 28 Janvier 2025
 * 
 * Statistiques des mises à jour d'un produit digital
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  TrendingUp,
  Users,
  Calendar,
  Package,
  Sparkles,
} from '@/components/icons';
import { supabase } from '@/integrations/supabase/client';
import { DigitalProductUpdate } from '@/hooks/digital/useProductUpdates';

interface UpdateStatsProps {
  digitalProductId: string;
}

export function UpdateStats({ digitalProductId }: UpdateStatsProps) {
  const { data: updates = [], isLoading } = useQuery({
    queryKey: ['productUpdates', digitalProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_product_updates')
        .select('*')
        .eq('digital_product_id', digitalProductId)
        .order('release_date', { ascending: false });

      if (error) throw error;
      return (data || []) as DigitalProductUpdate[];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalDownloads = updates.reduce((sum, update) => sum + (update.download_count || 0), 0);
  const publishedUpdates = updates.filter((u) => u.is_published).length;
  const forcedUpdates = updates.filter((u) => u.is_forced).length;
  const latestUpdate = updates[0];

  const stats = [
    {
      title: 'Total téléchargements',
      value: totalDownloads.toLocaleString(),
      icon: Download,
      color: 'text-blue-500',
    },
    {
      title: 'Mises à jour publiées',
      value: publishedUpdates,
      icon: Package,
      color: 'text-green-500',
    },
    {
      title: 'Mises à jour forcées',
      value: forcedUpdates,
      icon: Sparkles,
      color: 'text-purple-500',
    },
    {
      title: 'Dernière mise à jour',
      value: latestUpdate
        ? new Date(latestUpdate.release_date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })
        : 'Aucune',
      icon: Calendar,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Updates by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type</CardTitle>
          <CardDescription>Nombre de mises à jour par type de release</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['major', 'minor', 'patch', 'hotfix'].map((type) => {
              const count = updates.filter((u) => u.release_type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className="text-3xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{type}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

