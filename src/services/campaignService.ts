import api from './api';

export interface PromotionSetting {
  id: string;
  key: string;
  title: string;
  description: string | null;
  image_url: string | null;
  promo_code: string | null;
  discount_percent: number;
  target_date: string | null;
  is_active: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LiveCounter {
  id: string;
  key: string;
  label: string;
  value: string;
  icon: string | null;
}

export const campaignService = {
  getPromotions: () => {
    return api.get<{ success: boolean; data: PromotionSetting[] }>('/campaigns/promotions');
  },

  updatePromotions: (data: FormData | Partial<PromotionSetting>) => {
    // If sending FormData (e.g. including files), don't set Content-Type header manually
    const isFormData = data instanceof FormData;
    return api.put<{ success: boolean; data: PromotionSetting }>('/campaigns/promotions', isFormData ? data : data, {
      headers: isFormData ? { 'Content-Type': 'none' } : undefined
    });
  },

  subscribeNewsletter: (email: string) => {
    return api.post<{ success: boolean; data: NewsletterSubscriber }>('/campaigns/newsletter/subscribe', { email });
  },

  getSubscribers: () => {
    return api.get<{ success: boolean; data: NewsletterSubscriber[] }>('/campaigns/newsletter/subscribers');
  },

  getCounters: () => {
    return api.get<{ success: boolean; data: LiveCounter[] }>('/campaigns/counters');
  },

  updateCounter: (key: string, value: string, label?: string) => {
    return api.put<{ success: boolean; data: LiveCounter }>('/campaigns/counters', { key, value, label });
  }
};
