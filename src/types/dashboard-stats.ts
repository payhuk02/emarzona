/**
 * Types pour les statistiques du dashboard
 */

export interface DashboardOperational {
  pendingOrders: number;
  processingOrders: number;
  draftProducts: number;
  lowStockProducts: number;
  pendingReviews: number;
  ordersToFulfill: number;
}

export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  operational: DashboardOperational;
  periodLabel: string;
  recentOrders: Array<{
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
    customers: { name: string; email: string } | null;
    product_types?: string[];
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    product_type?: string;
    orderCount: number;
    revenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'product' | 'customer' | 'payment';
    message: string;
    timestamp: string;
    status?: string;
  }>;
  performanceMetrics: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    pageViews: number;
    bounceRate: number;
    sessionDuration: number;
  };
  trends: {
    revenueGrowth: number;
    orderGrowth: number;
    customerGrowth: number;
    productGrowth: number;
  };
  productsByType: ProductTypeCount;
  revenueByType: ProductTypeCount;
  ordersByType: ProductTypeCount;
  performanceMetricsByType: Record<
    string,
    {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    }
  >;
  revenueByTypeAndMonth: Array<{
    month: string;
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  }>;
}

export interface ProductTypeCount {
  digital: number;
  physical: number;
  service: number;
  course: number;
  artist: number;
}

export interface DashboardBaseStats {
  totalProducts: number;
  activeProducts: number;
  digitalProducts: number;
  physicalProducts: number;
  serviceProducts: number;
  courseProducts: number;
  artistProducts: number;
  avgProductPrice: number;
  newProductsInPeriod?: number;
  previousNewProductsInPeriod?: number;
}

export interface DashboardOrdersStats {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  revenue30d: number;
  orders30d: number;
  revenue7d: number;
  orders7d: number;
  revenue90d: number;
  orders90d: number;
  previousPeriodRevenue?: number;
  previousPeriodOrders?: number;
  previousPeriodCustomers?: number;
}

export interface DashboardCustomersStats {
  totalCustomers: number;
  newCustomers30d: number;
  newCustomers7d: number;
  newCustomers90d: number;
  customersWithOrders: number;
}

export interface ProductPerformance {
  type: string;
  orders: number;
  revenue: number;
  quantity: number;
  avgOrderValue: number;
  productsSold: number;
  orders30d: number;
  revenue30d: number;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  productType: string;
  revenue: number;
  quantity: number;
  orderCount: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer: { id: string; name: string; email: string } | null;
  productTypes: string[];
}

export interface DashboardWebMetrics {
  pageViews: number;
  previousPeriodPageViews: number;
  bounceRate: number;
  sessionDuration: number;
}

export interface OptimizedDashboardData {
  baseStats: DashboardBaseStats | null;
  ordersStats: DashboardOrdersStats | null;
  customersStats: DashboardCustomersStats | null;
  productPerformance: ProductPerformance[];
  topProducts: TopProduct[];
  recentOrders: RecentOrder[];
  operational: DashboardOperational;
  webMetrics?: DashboardWebMetrics | null;
  generatedAt: string;
  periodDays: number;
  periodLabel: string;
}

export interface UseDashboardStatsOptions {
  period?: '7d' | '30d' | '90d' | 'custom';
  customStartDate?: Date;
  customEndDate?: Date;
  /** Évite un second appel useStore() quand le parent fournit déjà l’ID boutique */
  storeId?: string | null;
}

// Zero-value fallback stats
const ZERO_TYPE_METRICS = { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 };

export function getFallbackStats(): DashboardStats {
  return {
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    operational: {
      pendingOrders: 0,
      processingOrders: 0,
      draftProducts: 0,
      lowStockProducts: 0,
      pendingReviews: 0,
      ordersToFulfill: 0,
    },
    periodLabel: '30 derniers jours',
    recentOrders: [],
    topProducts: [],
    revenueByMonth: [],
    ordersByStatus: [],
    recentActivity: [
      {
        id: 'fallback-1',
        type: 'order',
        message: 'Tableau de bord initialisé',
        timestamp: new Date().toISOString(),
        status: 'success',
      },
    ],
    performanceMetrics: {
      conversionRate: 0,
      averageOrderValue: 0,
      customerRetention: 0,
      pageViews: 0,
      bounceRate: 0,
      sessionDuration: 0,
    },
    trends: { revenueGrowth: 0, orderGrowth: 0, customerGrowth: 0, productGrowth: 0 },
    productsByType: { digital: 0, physical: 0, service: 0, course: 0, artist: 0 },
    revenueByType: { digital: 0, physical: 0, service: 0, course: 0, artist: 0 },
    ordersByType: { digital: 0, physical: 0, service: 0, course: 0, artist: 0 },
    performanceMetricsByType: {
      digital: { ...ZERO_TYPE_METRICS },
      physical: { ...ZERO_TYPE_METRICS },
      service: { ...ZERO_TYPE_METRICS },
      course: { ...ZERO_TYPE_METRICS },
      artist: { ...ZERO_TYPE_METRICS },
    },
    revenueByTypeAndMonth: [],
  };
}
