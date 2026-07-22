import api from './api';

export interface WholesaleApplication {
  id: string;
  user_id: string;
  company_name: string;
  company_registration: string;
  business_type: string;
  estimated_volume?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  assigned_discount?: number;
  assigned_tier?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number?: string;
  };
}

export const wholesaleService = {
  submitApplication: (data: {
    company_name: string;
    company_registration: string;
    business_type: string;
    estimated_volume?: string;
    notes?: string;
  }) => {
    return api.post<{ success: boolean; data: WholesaleApplication }>('/wholesale-applications', data);
  },

  getMyApplication: () => {
    return api.get<{ success: boolean; data: WholesaleApplication | null }>('/wholesale-applications/my');
  },

  adminGetApplications: (query?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const cleanParams: Record<string, any> = {};
    if (query) {
      Object.entries(query).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          cleanParams[key] = val;
        }
      });
    }
    return api.get<{
      success: boolean;
      applications: WholesaleApplication[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/wholesale-applications/admin', { params: cleanParams });
  },

  adminUpdateApplicationStatus: (
    id: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    extra?: { assigned_discount?: number; assigned_tier?: string }
  ) => {
    return api.patch<{ success: boolean; data: WholesaleApplication }>(`/wholesale-applications/admin/${id}/status`, {
      status,
      assigned_discount: extra?.assigned_discount,
      assigned_tier: extra?.assigned_tier,
    });
  },

  adminUpdateApplication: (id: string, data: Partial<WholesaleApplication>) => {
    return api.patch<{ success: boolean; data: WholesaleApplication }>(`/wholesale-applications/admin/${id}`, data);
  },

  adminDeleteApplication: (id: string) => {
    return api.delete<{ success: boolean; message: string }>(`/wholesale-applications/admin/${id}`);
  },
};
