import api from './api';

export const cartService = {
  getCart: () => {
    return api.get<any>('/cart');
  },
  
  addToCart: (variantId: string, quantity: number) => {
    return api.post<any>('/cart/items', { variant_id: variantId, quantity });
  },
  
  updateCartItem: (itemId: number, quantity: number) => {
    return api.patch<any>(`/cart/items/${itemId}`, { quantity });
  },
  
  removeCartItem: (itemId: number) => {
    return api.delete<any>(`/cart/items/${itemId}`);
  },
  
  clearCart: () => {
    return api.delete<any>('/cart');
  }
};
