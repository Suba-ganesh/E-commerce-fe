import api from './api';

export interface KPIData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  wholesaleBuyers: number;
  inventoryValue: number;
  overallGrowth: number;
}

export interface RevenueTrend {
  month: string;
  revenue: number;
  orders: number;
}

export interface ProductPerformance {
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface InventoryHealth {
  fastMoving: { percentage: number; threshold: string };
  lowStock: { count: number };
  slowMoving: { percentage: number; threshold: string };
}

export interface CustomerAnalytics {
  returningPercentage: number;
  newPercentage: number;
  segments: {
    highRollers: { percentage: number; range: string };
    regulars: { percentage: number; range: string };
    casual: { percentage: number; range: string };
  };
}

export interface WholesaleAnalytics {
  topDistributors: { name: string; revenue: number }[];
  regionalSplit: { region: string; percentage: number }[];
}

export interface VelocityMatrix {
  dailySalesAverage: number;
  weeklySalesAverage: number;
  conversionRate: number;
}

export interface FilteredAnalytics {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueTrends: { month: string; revenue: number; orders: number }[];
  topProducts: { productName: string; units: number; revenue: number }[];
}

export const analyticsService = {
  // KPI Dashboard
  getKPIDashboard: () => {
    return api.get<{ success: boolean; data: KPIData }>('/dashboard/analytics/kpi');
  },

  // Revenue Trends
  getRevenueTrends: (months: number = 6) => {
    return api.get<{ success: boolean; data: RevenueTrend[] }>('/dashboard/analytics/revenue-trends', {
      params: { months: months.toString() },
    });
  },

  // Product Performance
  getProductPerformance: (limit: number = 10) => {
    return api.get<{ success: boolean; data: ProductPerformance[] }>('/dashboard/analytics/product-performance', {
      params: { limit: limit.toString() },
    });
  },

  // Inventory Health
  getInventoryHealth: () => {
    return api.get<{ success: boolean; data: InventoryHealth }>('/dashboard/analytics/inventory-health');
  },

  // Customer Analytics
  getCustomerAnalytics: () => {
    return api.get<{ success: boolean; data: CustomerAnalytics }>('/dashboard/analytics/customer-analytics');
  },

  // Wholesale Analytics
  getWholesaleAnalytics: () => {
    return api.get<{ success: boolean; data: WholesaleAnalytics }>('/dashboard/analytics/wholesale-analytics');
  },

  // Velocity Matrix
  getVelocityMatrix: () => {
    return api.get<{ success: boolean; data: VelocityMatrix }>('/dashboard/analytics/velocity-matrix');
  },

  // Filtered Analytics
  getFilteredAnalytics: (filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    customerType?: string;
    distributorId?: string;
    productSearch?: string;
  }) => {
    return api.get<{ success: boolean; data: FilteredAnalytics }>('/dashboard/analytics/filtered', {
      params: filters,
    });
  },
};