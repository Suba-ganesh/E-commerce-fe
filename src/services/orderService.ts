import api from './api';

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  dateRange?: string;
}

export interface OrderItem {
  id: number;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string | null;
  product_sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
  product: {
    name: string;
    images?: Array<{ image_url: string }>;
  };
}

export interface OrderUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface OrderAddress {
  id: number;
  full_name: string;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  user_id: string;
  shipping_address_id: number;
  billing_address_id: number;
  order_status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  payment_status: string;
  subtotal: string;
  tax_amount: string;
  shipping_charge: string;
  discount_amount: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  user: OrderUser;
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  items: OrderItem[];
  payment?: {
    payment_method: string;
    payment_status: string;
    paid_at: string | null;
  } | null;
  type: 'Wholesale' | 'Retail';
  category: string;
  total_items: number;
}

export interface OrderStats {
  total_orders: number;
  pending: number;
  packed: number;
  shipped: number;
  delivered: number;
  wholesale_orders: number;
}

export const orderService = {
  getAdminOrders: (params?: OrderListParams) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = String(params.page);
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.search) queryParams.search = params.search;
      if (params.status) queryParams.status = params.status;
      if (params.type) queryParams.type = params.type;
      if (params.dateRange) queryParams.dateRange = params.dateRange;
    }
    return api.get<{ success: boolean; data: { orders: AdminOrder[]; pagination: { total: number; total_pages: number } } }>('/orders/admin/list', { params: queryParams });
  },

  getAdminOrderStats: () => {
    return api.get<{ success: boolean; data: OrderStats }>('/orders/admin/stats');
  },

  updateOrderStatus: (orderId: string, status: string) => {
    return api.patch<{ success: boolean; data: any }>(`/orders/${orderId}/status`, { order_status: status });
  },

  cancelOrder: (orderId: string, reason?: string) => {
    return api.patch<{ success: boolean; data: any }>(`/orders/${orderId}/cancel`, { reason });
  },

  getOrderById: (id: string) => {
    return api.get<any>(`/orders/${id}`);
  },

  getOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = String(params.page);
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.status) queryParams.status = params.status;
      if (params.search) queryParams.search = params.search;
    }
    return api.get<any>('/orders', { params: queryParams });
  },

  createOrder: (data: any) => {
    return api.post<any>('/orders', data);
  }
};
