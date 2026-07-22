import api from './api';

export interface Coupon {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
}

export interface CouponValidationResponse {
  success: boolean;
  message: string;
  data?: Coupon;
}

export const couponService = {
  validateCoupon: (code: string, orderTotal: number) => {
    return api.post<CouponValidationResponse>('/coupons/validate', { 
      code, 
      order_total: orderTotal 
    });
  },
};