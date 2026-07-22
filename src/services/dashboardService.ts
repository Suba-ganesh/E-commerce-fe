import api from './api';

export const dashboardService = {
  getSummary: () => {
    return api.get<any>('/dashboard/summary');
  },
  
  getRecentOrders: () => {
    return api.get<any>('/dashboard/recent-orders');
  },
  
  getLowStock: () => {
    return api.get<any>('/dashboard/low-stock');
  },
  
  getSalesOverview: () => {
    return api.get<any>('/dashboard/sales');
  }
};
