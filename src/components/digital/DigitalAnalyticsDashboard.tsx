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
  FileDown,
  Globe,
  Code,
} from 'lucide-react';
import {
  useDigitalProductAnalytics,
  useDownloadTrends,
  useTopDownloadedFiles,
  useUserDownloadStats,
  useLicenseAnalytics,
  useGeographicAnalytics,
  useVersionAnalytics,
  DownloadTrend,
  TopFile,
} from '@/hooks/digital/useDigitalAnalytics';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportAnalyticsToPDF, exportAnalyticsToExcel, exportAnalyticsToCSV } from '@/utils/exportDigitalAnalytics';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface DigitalAnalyticsDashboardProps {
  productId: string;
  digitalProductId: string;
}

export const DigitalAnalyticsDashboard = ({
  productId,
  digitalProductId,
}: DigitalAnalyticsDashboardProps) => {
  const { toast } = useToast();
  const [dateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useDigitalProductAnalytics(productId, dateRange);
  const { data: trends } = useDownloadTrends(digitalProductId, 30);
  const { data: topFiles } = useTopDownloadedFiles(digitalProductId, 5);
  const { data: userStats } = useUserDownloadStats(digitalProductId, 10);
  const { data: licenseAnalytics } = useLicenseAnalytics(digitalProductId);
  const { data: geographicAnalytics } = useGeographicAnalytics(digitalProductId, dateRange);
  const { data: versionAnalytics } = useVersionAnalytics(digitalProductId, dateRange);
  
  // Export handlers
  const handleExportPDF = async () => {
    try {
      await exportAnalyticsToPDF(
        {
          total_downloads: analytics?.total_downloads || 0,
          unique_downloaders: analytics?.unique_downloaders || 0,
          success_rate: analytics?.success_rate || 0,
          total_revenue: analytics?.total_revenue || 0,
          total_bandwidth: analytics?.total_bandwidth || 0,
          trends: trends?.map((t: DownloadTrend) => ({
            date: t.date,
            downloads: t.downloads,
            users: t.users,
          })),
          topFiles: topFiles?.map((f: TopFile) => ({
            filename: f.filename,
            downloads: f.downloads,
            size: f.size,
          })),
          licenseStats: licenseAnalytics ? {
            total: licenseAnalytics.total_licenses || 0,
            active: licenseAnalytics.active_licenses || 0,
            expired: licenseAnalytics.expired_licenses || 0,
            suspended: licenseAnalytics.suspended_licenses || 0,
          } : undefined,
        },
        {
          format: 'pdf',
          dateRange,
          includeCharts: true,
        }
      );
      toast({
        title: 'Export réussi',
        description: 'Le rapport PDF a été téléchargé avec succès',
      });
    } catch (error) {
      logger.error('Erreur lors de l\'export PDF', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport PDF',
        variant: 'destructive',
      });
    }
  };
  
  const handleExportExcel = () => {
    try {
      exportAnalyticsToExcel(
        {
          total_downloads: analytics?.total_downloads || 0,
          unique_downloaders: analytics?.unique_downloaders || 0,
          success_rate: analytics?.success_rate || 0,
          total_revenue: analytics?.total_revenue || 0,
          total_bandwidth: analytics?.total_bandwidth || 0,
          trends: trends?.map((t: DownloadTrend) => ({
            date: t.date,
            downloads: t.downloads,
            users: t.users,
          })),
          topFiles: topFiles?.map((f: TopFile) => ({
            filename: f.filename,
            downloads: f.downloads,
            size: f.size,
          })),
          licenseStats: licenseAnalytics ? {
            total: licenseAnalytics.total_licenses || 0,
            active: licenseAnalytics.active_licenses || 0,
            expired: licenseAnalytics.expired_licenses || 0,
            suspended: licenseAnalytics.suspended_licenses || 0,
          } : undefined,
        },
        {
          format: 'excel',
          dateRange,
        }
      );
      toast({
        title: 'Export réussi',
        description: 'Le rapport Excel a été téléchargé avec succès',
      });
    } catch (error) {
      logger.error('Erreur lors de l\'export Excel', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport Excel',
        variant: 'destructive',
      });
    }
  };
  
  const handleExportCSV = () => {
    try {
      exportAnalyticsToCSV(
        {
          total_downloads: analytics?.total_downloads || 0,
          unique_downloaders: analytics?.unique_downloaders || 0,
          success_rate: analytics?.success_rate || 0,
          total_revenue: analytics?.total_revenue || 0,
          total_bandwidth: analytics?.total_bandwidth || 0,
          trends: trends?.map((t: DownloadTrend) => ({
            date: t.date,
            downloads: t.downloads,
            users: t.users,
          })),
          topFiles: topFiles?.map((f: TopFile) => ({
            filename: f.filename,
            downloads: f.downloads,
            size: f.size,
          })),
          licenseStats: licenseAnalytics ? {
            total: licenseAnalytics.total_licenses || 0,
            active: licenseAnalytics.active_licenses || 0,
            expired: licenseAnalytics.expired_licenses || 0,
            suspended: licenseAnalytics.suspended_licenses || 0,
          } : undefined,
        },
        {
          format: 'csv',
          dateRange,
        }
      );
      toast({
        title: 'Export réussi',
        description: 'Le rapport CSV a été téléchargé avec succès',
      });
    } catch (error) {
      logger.error('Erreur lors de l\'export CSV', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport CSV',
        variant: 'destructive',
      });
    }
  };

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
      {/* Export Button */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileText className="h-4 w-4 mr-2" />
              Export Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileText className="h-4 w-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
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
          <TabsTrigger value="geographic">Géographique</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
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
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={300}>
                    <recharts.LineChart data={trends || []}>
                      <recharts.CartesianGrid strokeDasharray="3 3" />
                      <recharts.XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'dd MMM', { locale: fr })}
                      />
                      <recharts.YAxis />
                      <recharts.Tooltip
                        labelFormatter={(value) => format(new Date(value as string), 'dd MMMM yyyy', { locale: fr })}
                      />
                      <recharts.Legend />
                      <recharts.Line
                        type="monotone"
                        dataKey="downloads"
                        stroke="#8884d8"
                        name="Téléchargements"
                        strokeWidth={2}
                      />
                      <recharts.Line
                        type="monotone"
                        dataKey="unique_users"
                        stroke="#82ca9d"
                        name="Utilisateurs uniques"
                        strokeWidth={2}
                      />
                    </recharts.LineChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Geographic Analytics */}
        <TabsContent value="geographic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Géographiques</CardTitle>
              <CardDescription>Répartition des téléchargements par pays</CardDescription>
            </CardHeader>
            <CardContent>
              {geographicAnalytics && geographicAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {/* Bar Chart */}
                  <LazyRechartsWrapper>
                    {(recharts) => (
                      <recharts.ResponsiveContainer width="100%" height={300}>
                        <recharts.BarChart data={geographicAnalytics.slice(0, 10)}>
                          <recharts.CartesianGrid strokeDasharray="3 3" />
                          <recharts.XAxis 
                            dataKey="country" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <recharts.YAxis />
                          <recharts.Tooltip />
                          <recharts.Legend />
                          <recharts.Bar dataKey="downloads" fill="#8884d8" name="Téléchargements" />
                          <recharts.Bar dataKey="unique_users" fill="#82ca9d" name="Utilisateurs uniques" />
                        </recharts.BarChart>
                      </recharts.ResponsiveContainer>
                    )}
                  </LazyRechartsWrapper>

                  {/* Pie Chart */}
                  <LazyRechartsWrapper>
                    {(recharts) => (
                      <recharts.ResponsiveContainer width="100%" height={300}>
                        <recharts.PieChart>
                          <recharts.Pie
                            data={geographicAnalytics.slice(0, 10)}
                            dataKey="downloads"
                            nameKey="country"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `${entry.country}: ${entry.downloads}`}
                          >
                            {geographicAnalytics.slice(0, 10).map((entry, index) => (
                              <recharts.Cell key={`cell-${index}`} fill={`hsl(${index * 36}, 70%, 50%)`} />
                            ))}
                          </recharts.Pie>
                          <recharts.Tooltip />
                          <recharts.Legend />
                        </recharts.PieChart>
                      </recharts.ResponsiveContainer>
                    )}
                  </LazyRechartsWrapper>

                  {/* Table */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Top Pays</h4>
                    <div className="space-y-2">
                      {geographicAnalytics.slice(0, 10).map((geo, index) => (
                        <div key={geo.country} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{geo.country}</h4>
                              <p className="text-xs text-muted-foreground">
                                {geo.unique_users} utilisateurs uniques
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{geo.downloads}</p>
                            <p className="text-xs text-muted-foreground">
                              {geo.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune donnée géographique disponible
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Version Analytics */}
        <TabsContent value="versions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics par Version</CardTitle>
              <CardDescription>Répartition des téléchargements par version de fichier</CardDescription>
            </CardHeader>
            <CardContent>
              {versionAnalytics && versionAnalytics.length > 0 ? (
                <div className="space-y-4">
                  {/* Bar Chart */}
                  <LazyRechartsWrapper>
                    {(recharts) => (
                      <recharts.ResponsiveContainer width="100%" height={300}>
                        <recharts.BarChart data={versionAnalytics}>
                          <recharts.CartesianGrid strokeDasharray="3 3" />
                          <recharts.XAxis dataKey="version" />
                          <recharts.YAxis />
                          <recharts.Tooltip />
                          <recharts.Legend />
                          <recharts.Bar dataKey="downloads" fill="#8884d8" name="Téléchargements" />
                          <recharts.Bar dataKey="unique_users" fill="#82ca9d" name="Utilisateurs uniques" />
                        </recharts.BarChart>
                      </recharts.ResponsiveContainer>
                    )}
                  </LazyRechartsWrapper>

                  {/* Table */}
                  <div className="space-y-2">
                    <h4 className="font-medium">Versions</h4>
                    <div className="space-y-2">
                      {versionAnalytics.map((version, index) => (
                        <div key={version.version} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">Version {version.version}</h4>
                              <p className="text-xs text-muted-foreground">
                                {version.unique_users} utilisateurs uniques • {version.success_rate.toFixed(1)}% succès
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{version.downloads}</p>
                            <p className="text-xs text-muted-foreground">
                              {version.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aucune donnée de version disponible
                </p>
              )}
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
              <LazyRechartsWrapper>
                {(recharts) => (
                  <recharts.ResponsiveContainer width="100%" height={250}>
                    <recharts.BarChart
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
                      <recharts.CartesianGrid strokeDasharray="3 3" />
                      <recharts.XAxis dataKey="name" />
                      <recharts.YAxis />
                      <recharts.Tooltip />
                      <recharts.Bar dataKey="value" />
                    </recharts.BarChart>
                  </recharts.ResponsiveContainer>
                )}
              </LazyRechartsWrapper>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

