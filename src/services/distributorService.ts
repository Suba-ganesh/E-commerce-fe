import api from './api';

// ==================== DISTRIBUTOR TYPES ====================

export interface Distributor {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person: string;       // Driver name
  email: string;
  phone_number: string;
  vehicle_no?: string;          // Vehicle number
  region: string;               // Distribution area
  territory?: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  commission_rate: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  total_orders: number;
  total_revenue: number;
  notes?: string;
  joined_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  active_orders?: number;
  user?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface DistributorStats {
  total_distributors: number;
  active_distributors: number;
  pending_distributors: number;
  new_distributors_this_month: number;
  total_revenue: number;
  total_commission: number;
  top_performers: Array<{
    id: string;
    company_name: string;
    contact_person: string;
    total_revenue: number;
    total_orders: number;
    tier: string;
  }>;
  regional_distribution: Array<{
    region: string;
    count: number;
  }>;
}

export interface DistributorFormData {
  contact_person: string;
  phone_number: string;
  email: string;
  vehicle_no: string;
  region: string;
  territory: string;
  company_name: string;
  notes: string;
}

// ==================== API CALLS ====================

export const createDistributor = (data: DistributorFormData) => {
  return api.post<any>('/distributors', data);
};

export const getDistributors = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  region?: string;
  tier?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const stringParams: Record<string, string> = {};
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        stringParams[key] = String(value);
      }
    });
  }
  return api.get<any>('/distributors', { params: stringParams });
};

export const getDistributorById = (id: string) => {
  return api.get<any>(`/distributors/${id}`);
};

export const updateDistributor = (id: string, data: Partial<Distributor>) => {
  return api.patch<any>(`/distributors/${id}`, data);
};

export const updateDistributorStatus = (id: string, status: string) => {
  return api.patch<any>(`/distributors/${id}/status`, { status });
};

export const deleteDistributor = (id: string) => {
  return api.delete<any>(`/distributors/${id}`);
};

export const getDistributorStats = () => {
  return api.get<any>('/distributors/stats');
};

export const updateDistributorTier = (id: string, tier: string) => {
  return api.patch<any>(`/distributors/${id}/tier`, { tier });
};