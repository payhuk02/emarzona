/**
 * Service de transformation des données dashboard
 * Extrait de useDashboardStats.ts pour réduire la taille du hook
 */

import type {
  DashboardStats,
  OptimizedDashboardData,
  DashboardBaseStats,
  DashboardOrdersStats,
  DashboardCustomersStats,
} from '@/types/dashboard-stats';

const ZERO_BASE: DashboardBaseStats = {
  totalProducts: 0, activeProducts: 0, digitalProducts: 0, physicalProducts: 0,
  serviceProducts: 0, courseProducts: 0, artistProducts: 0, avgProductPrice: 0,
};

const ZERO_ORDERS: DashboardOrdersStats = {
  totalOrders: 0, completedOrders: 0, pendingOrders: 0, cancelledOrders: 0,
  totalRevenue: 0, avgOrderValue: 0, revenue30d: 0, orders30d: 0,
  revenue7d: 0, orders7d: 0, revenue90d: 0, orders90d: 0,
};

const ZERO_CUSTOMERS: DashboardCustomersStats = {
  totalCustomers: 0, newCustomers30d: 0, newCustomers7d: 0, newCustomers90d: 0,
  customersWithOrders: 0,
};

const ZERO_PERF = { conversionRate: 0, averageOrderValue: 0, customerRetention: 0 };

function calcGrowth(recent: number, total: number, base: number): number {
  return total > 0 ? Math.round(((recent - base) / total) * 100) : 0;
}

function buildRevenueByMonth(orders: OptimizedDashboardData['recentOrders']) {
  const map: Record<string, { revenue: number; orders: number; customers: Set<string> }> = {};
  for (const order of orders) {
    if (!order.createdAt) continue;
    const month = new Date(order.createdAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
    if (!map[month]) map[month] = { revenue: 0, orders: 0, customers: new Set() };
    map[month].revenue += Number(order.totalAmount) || 0;
    map[month].orders += 1;
    if (order.customer?.id) map[month].customers.add(order.customer.id);
  }
  return Object.entries(map)
    .map(([month, d]) => ({ month, revenue: d.revenue, orders: d.orders, customers: d.customers.size }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function buildRevenueByTypeAndMonth(data: OptimizedDashboardData) {
  const map: Record<string, Record<string, number>> = {};
  for (const order of data.recentOrders || []) {
    if (!order.createdAt || !order.productTypes?.length) continue;
    const month = new Date(order.createdAt).toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
    if (!map[month]) map[month] = { digital: 0, physical: 0, service: 0, course: 0, artist: 0 };
    const perType = (Number(order.totalAmount) || 0) / order.productTypes.length;
    for (const t of order.productTypes) {
      if (t in map[month]) map[month][t] += perType;
    }
  }
  if (Object.keys(map).length === 0 && data.productPerformance?.length) {
    const month = new Date().toLocaleString('fr-FR', { month: 'short', year: 'numeric' });
    map[month] = { digital: 0, physical: 0, service: 0, course: 0, artist: 0 };
    for (const p of data.productPerformance) {
      if (p.type in map[month]) map[month][p.type] = p.revenue;
    }
  }
  return Object.entries(map)
    .map(([month, d]) => ({ month, digital: d.digital || 0, physical: d.physical || 0, service: d.service || 0, course: d.course || 0, artist: d.artist || 0 }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
}

function reduceByType<T>(perfs: OptimizedDashboardData['productPerformance'], getter: (p: { type: string; orders: number; revenue: number }) => T, zero: Record<string, T>): Record<string, T> {
  const result = { ...zero };
  for (const p of perfs || []) {
    if (p.type in result) (result as Record<string, T>)[p.type] = getter(p);
  }
  return result;
}

export function transformOptimizedData(data: OptimizedDashboardData): DashboardStats {
  const base = data.baseStats || ZERO_BASE;
  const orders = data.ordersStats || ZERO_ORDERS;
  const customers = data.customersStats || ZERO_CUSTOMERS;

  const basePrevRevenue30d = ((orders.revenue90d - orders.revenue30d) / 60) * 30;
  const basePrevOrders30d = ((orders.orders90d - orders.orders30d) / 60) * 30;

  const performanceByType = reduceByType(
    data.productPerformance,
    (p) => ({
      conversionRate: customers.totalCustomers > 0 ? Math.round((p.orders / customers.totalCustomers) * 100) : 0,
      averageOrderValue: p.orders > 0 ? p.revenue / p.orders : 0,
      customerRetention: customers.customersWithOrders > 0 ? Math.round((customers.customersWithOrders / customers.totalCustomers) * 100) : 0,
    }),
    { digital: { ...ZERO_PERF }, physical: { ...ZERO_PERF }, service: { ...ZERO_PERF }, course: { ...ZERO_PERF }, artist: { ...ZERO_PERF } }
  );

  return {
    totalProducts: base.totalProducts,
    activeProducts: base.activeProducts,
    totalOrders: orders.totalOrders,
    pendingOrders: orders.pendingOrders,
    completedOrders: orders.completedOrders,
    cancelledOrders: orders.cancelledOrders,
    totalCustomers: customers.totalCustomers,
    totalRevenue: orders.totalRevenue,
    recentOrders: (data.recentOrders || []).map(o => ({
      id: o.id, order_number: o.orderNumber, total_amount: o.totalAmount,
      status: o.status, created_at: o.createdAt,
      customers: o.customer ? { name: o.customer.name, email: o.customer.email } : null,
      product_types: o.productTypes,
    })),
    topProducts: (data.topProducts || []).map(p => ({
      id: p.id, name: p.name, price: p.price, image_url: p.imageUrl,
      product_type: p.productType, orderCount: p.orderCount, revenue: p.revenue,
    })),
    revenueByMonth: buildRevenueByMonth(data.recentOrders || []),
    ordersByStatus: [
      { status: 'Completed', count: orders.completedOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.completedOrders / orders.totalOrders) * 100) : 0 },
      { status: 'Pending', count: orders.pendingOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.pendingOrders / orders.totalOrders) * 100) : 0 },
      { status: 'Cancelled', count: orders.cancelledOrders, percentage: orders.totalOrders > 0 ? Math.round((orders.cancelledOrders / orders.totalOrders) * 100) : 0 },
    ],
    recentActivity: [
      ...(data.recentOrders || []).slice(0, 3).map(o => ({
        id: `order-${o.id}`, type: 'order' as const,
        message: `Nouvelle commande #${o.orderNumber} de ${o.totalAmount} FCFA`,
        timestamp: o.createdAt, status: o.status,
      })),
      ...(data.topProducts || []).slice(0, 2).map(p => ({
        id: `product-${p.id}`, type: 'product' as const,
        message: `Produit "${p.name}" populaire`,
        timestamp: new Date().toISOString(), status: 'success',
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    performanceMetrics: {
      conversionRate: customers.totalCustomers > 0 ? Math.round((orders.completedOrders / customers.totalCustomers) * 100) : 0,
      averageOrderValue: orders.avgOrderValue,
      customerRetention: customers.customersWithOrders > 0 ? Math.round((customers.customersWithOrders / customers.totalCustomers) * 100) : 0,
      pageViews: orders.totalOrders * 10,
      bounceRate: Math.max(20 - orders.totalOrders * 0.5, 10),
      sessionDuration: Math.floor(180 + orders.totalOrders * 2),
    },
    trends: {
      revenueGrowth: calcGrowth(orders.revenue30d, orders.totalRevenue, basePrevRevenue30d),
      orderGrowth: calcGrowth(orders.orders30d, orders.totalOrders, basePrevOrders30d),
      customerGrowth: customers.totalCustomers > 0 ? Math.round((customers.newCustomers30d / customers.totalCustomers) * 100) : 0,
      productGrowth: base.activeProducts > 0 ? Math.round(base.activeProducts * 0.1 * 100) : 0,
    },
    productsByType: {
      digital: base.digitalProducts, physical: base.physicalProducts,
      service: base.serviceProducts, course: base.courseProducts, artist: base.artistProducts,
    },
    revenueByType: reduceByType(data.productPerformance, p => p.revenue, { digital: 0, physical: 0, service: 0, course: 0, artist: 0 }) as any,
    ordersByType: reduceByType(data.productPerformance, p => p.orders, { digital: 0, physical: 0, service: 0, course: 0, artist: 0 }) as any,
    performanceMetricsByType: performanceByType as any,
    revenueByTypeAndMonth: buildRevenueByTypeAndMonth(data),
  };
}
