import api from './api';

export interface CheckoutSummary {
  cart: any;
  shipping_address: any;
  billing_address: any;
  subtotal: number;
  tax: number;
  shipping_charge: number;
  discount: number;
  grand_total: number;
}

export interface CheckoutInput {
  shipping_address_id: number;
  billing_address_id: number;
  payment_method: string;
  coupon_code?: string;
}

export const checkoutService = {
  getCheckoutSummary: (couponCode?: string) => {
    if (couponCode) {
      return api.post<any>('/checkout', { coupon_code: couponCode });
    }
    return api.get<any>('/checkout');
  },
  
  processCheckout: (data: CheckoutInput) => {
    return api.post<any>('/checkout', data);
  }
};
