/**
 * DigitalProductStats - Statistiques personnelles du client
 * Date: 2025-01-27
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerPurchasedProducts } from '@/hooks/digital/useCustomerPurchasedProducts';
import { useUserDownloads } from '@/hooks/digital/useDownloads';
import { LazyRechartsWrapper } from '@/components/charts/LazyRechartsWrapper';
import { Package, Download, Key, TrendingUp, DollarSign, Calendar } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DigitalProductStats = () => {
  const { data: products, isLoading: productsLoading } = useCustomerPurchasedProducts();
  const { data: downloads, isLoading: downloadsLoading } = useUserDownloads();

  if (productsLoading || downloadsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Statistiques de base
  const totalProducts = products?.length || 0;
  const totalDownloads = downloads?.length || 0;
  const totalSpent = products?.reduce((sum, p) => sum + p.purchase_amount, 0) || 0;
  const totalLicenses = products?.filter(p => p.license_key).length || 0;

  // Graphique par type de produit
  const productsByType = products?.reduce((acc: Record<string, number>, product) => {
    acc[product.digital_type] = (acc[product.digital_type] || 0) + 1;
    return acc;
  }, {}) || {};

  const typeChartData = Object.entries(productsByType).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Graphique des téléchargements par jour (7 derniers jours)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'dd/MM', { locale: fr }),
      downloads: 0,
    };
  });

  const downloadsByDate = downloads?.reduce((acc: Record<string, number>, download: any) => {
    const date = format(new Date(download.download_date), 'dd/MM', { locale: fr });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {}) || {};

  const downloadsChartData = last7Days.map(day => ({
    ...day,
    downloads: downloadsByDate[day.date] || 0,
  }));

  // Top 5 produits téléchargés
  const productDownloadsCount = downloads?.reduce((acc: Record<string, number>, download: any) => {
    const productId = download.digital_product?.product?.id;
    if (productId) {
      acc[productId] = (acc[productId] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const topProducts = Object.entries(productDownloadsCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([productId, count]) => {
      const product = products?.find(p => p.product_id === productId);
      return {
        name: product?.product_name || 'Produit supprimé',
        downloads: count,
      };
    });

  return (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <div className="text-sm text-muted-foreground">Produits achetés</div>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalDownloads}</div>
                <div className="text-sm text-muted-foreground">Téléchargements</div>
              </div>
              <Download className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalLicenses}</div>
                <div className="text-sm text-muted-foreground">Licences</div>
              </div>
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{totalSpent.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total dépensé (XOF)</div>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Téléchargements par jour */}
        <Card>
          <CardHeader>
            <CardTitle>Téléchargements (7 derniers jours)</CardTitle>
            <CardDescription>Évolution de vos téléchargements</CardDescription>
          </CardHeader>
          <CardContent>
            <LazyRechartsWrapper>
              {(recharts) => (
                <recharts.ResponsiveContainer width="100%" height={300}>
                  <recharts.BarChart data={downloadsChartData}>
                    <recharts.CartesianGrid strokeDasharray="3 3" />
                    <recharts.XAxis dataKey="date" />
                    <recharts.YAxis />
                    <recharts.Tooltip />
                    <recharts.Bar dataKey="downloads" fill="#0088FE" />
                  </recharts.BarChart>
                </recharts.ResponsiveContainer>
              )}
            </LazyRechartsWrapper>
          </CardContent>
        </Card>

        {/* Produits par type */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type</CardTitle>
            <CardDescription>Vos produits digitaux par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            <LazyRechartsWrapper>
              {(recharts) => (
                <recharts.ResponsiveContainer width="100%" height={300}>
                  <recharts.PieChart>
                    <recharts.Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeChartData.map((entry, index) => (
                        <recharts.Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </recharts.Pie>
                    <recharts.Tooltip />
                  </recharts.PieChart>
                </recharts.ResponsiveContainer>
              )}
            </LazyRechartsWrapper>
          </CardContent>
        </Card>
      </div>

      {/* Top produits */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 produits téléchargés</CardTitle>
          <CardDescription>Vos produits les plus téléchargés</CardDescription>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun téléchargement enregistré
            </p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.downloads} téléchargement{product.downloads > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

