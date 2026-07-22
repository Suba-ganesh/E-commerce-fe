import api from './api';

export const wishlistService = {
  getWishlist: () => {
    return api.get<any>('/wishlist');
  },
  
  addToWishlist: (productId: string) => {
    return api.post<any>('/wishlist', { product_id: productId });
  },
  
  removeFromWishlist: (productId: string) => {
    return api.delete<any>(`/wishlist/${productId}`);
  },
  
  clearWishlist: () => {
    return api.delete<any>('/wishlist/clear');
  }
};
