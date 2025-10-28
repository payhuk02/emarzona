/**
 * Digital Product Analytics Dashboard
 * Date: 27 octobre 2025
 * 
 * Dashboard analytics professionnel pour produits digitaux
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Shield,
  HardDrive,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  useDigitalProductAnalytics,
  useDownloadTrends,
  useTopDownloadedFiles,
  useUserDownloadStats,
  useLicenseAnalytics,
} from '@/hooks/digital/useDigitalAnalytics';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { subDays } from 'date-fns';

interface DigitalAnalyticsDashboardProps {
  productId: string;
  digitalProductId: string;
}

export const DigitalAnalyticsDashboard = ({
  productId,
  digitalProductId,
}: DigitalAnalyticsDashboardProps) => {
  const [dateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useDigitalProductAnalytics(productId, dateRange);
  const { data: trends } = useDownloadTrends(digitalProductId, 30);
  const { data: topFiles } = useTopDownloadedFiles(digitalProductId, 5);
  const { data: userStats } = useUserDownloadStats(digitalProductId, 10);
  const { data: licenseAnalytics } = useLicenseAnalytics(digitalProductId);

  if (analyticsLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_downloads || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.unique_downloaders || 0} utilisateurs uniques
            </p>
            <div className="mt-2">
              <Badge variant={analytics && analytics.success_rate > 90 ? 'default' : 'destructive'}>
                {analytics?.success_rate.toFixed(1)}% succès
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.total_revenue.toLocaleString() || 0} XOF
            </div>
            <p className="text-xs text-muted-foreground">
              30 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Licenses</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics?.active_licenses || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.expired_licenses || 0} expirées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bande passante</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.bandwidth_used_gb.toFixed(2) || 0} GB
            </div>
            <p className="text-xs text-muted-foreground">
              Utilisée ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different analytics views */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="files">Fichiers</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="licenses">Licenses</TabsTrigger>
        </TabsList>

        {/* Download Trends */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendance des téléchargements</CardTitle>
              <CardDescription>30 derniers jours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: fr })}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => format(new Date(value as string), 'dd MMMM yyyy', { locale: fr })}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="downloads"
                    stroke="#8884d8"
                    name="Téléchargements"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="unique_users"
                    stroke="#82ca9d"
                    name="Utilisateurs uniques"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Files */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fichiers les plus téléchargés</CardTitle>
              <CardDescription>Top 5 des fichiers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topFiles && topFiles.length > 0 ? (
                  topFiles.map((file, index) => (
                    <div key={file.file_id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{file.file_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {file.size_mb.toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{file.downloads}</p>
                        <p className="text-xs text-muted-foreground">téléchargements</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun téléchargement pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Stats */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top utilisateurs</CardTitle>
              <CardDescription>Top 10 des téléchargeurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userStats && userStats.length > 0 ? (
                  userStats.map((user, index) => (
                    <div key={user.user_id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{user.user_email}</h4>
                          <p className="text-xs text-muted-foreground">
                            Dernier téléchargement: {format(new Date(user.last_download), 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{user.total_downloads}</p>
                        <p className="text-xs text-muted-foreground">downloads</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun utilisateur pour le moment
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Analytics */}
        <TabsContent value="licenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {licenseAnalytics?.total_licenses || 0}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activations</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {licenseAnalytics?.active_activations || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  sur {licenseAnalytics?.total_activations || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {licenseAnalytics?.average_activations_per_license.toFixed(1) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  activations/license
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Répartition des licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={[
                    {
                      name: 'Actives',
                      value: licenseAnalytics?.active_licenses || 0,
                      fill: '#10b981',
                    },
                    {
                      name: 'Expirées',
                      value: licenseAnalytics?.expired_licenses || 0,
                      fill: '#ef4444',
                    },
                    {
                      name: 'Suspendues',
                      value: licenseAnalytics?.suspended_licenses || 0,
                      fill: '#f59e0b',
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

