import api from './api';

export interface Address {
  id: number;
  user_id: string;
  address_type: 'SHIPPING' | 'BILLING';
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

export const userService = {
  getAddresses: () => {
    return api.get<any>('/users/addresses');
  },
  
  createAddress: (data: any) => {
    return api.post<any>('/users/addresses', data);
  },
  
  updateAddress: (id: number, data: Partial<Address>) => {
    return api.patch<any>(`/users/addresses/${id}`, data);
  },
  
  deleteAddress: (id: number) => {
    return api.delete<any>(`/users/addresses/${id}`);
  },

  // Admin Customer Management
  getAdminCustomers: (params?: Record<string, any>) => {
    const queryStr = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return api.get<any>(`/users/admin/customers${queryStr}`);
  },

  getAdminCustomerStats: () => {
    return api.get<any>('/users/admin/customers/stats');
  },

  getAdminCustomerDetails: (id: string) => {
    return api.get<any>(`/users/admin/customers/${id}`);
  },

  updateAdminCustomerStatus: (id: string, status: string) => {
    return api.patch<any>(`/users/admin/customers/${id}/status`, { status });
  },

  updateProfile: (data: any) => {
    return api.patch<any>('/users/profile', data);
  },

  uploadAvatar: (formData: FormData) => {
    return api.patch<any>('/users/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};
