import api from './api';

export interface ReviewListParams {
  page?: number;
  limit?: number;
  search?: string;
  rating?: number;
  status?: string;
}

export interface ReviewUser {
  id: string;
  first_name: string;
  last_name: string;
  profile_image?: string | null;
  addresses?: Array<{ city: string }>;
}

export interface ReviewProduct {
  id: string;
  name: string;
  category?: string | { id?: string; name?: string; slug?: string } | null;
}

export interface Review {
  id: number;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  user: ReviewUser;
  product: ReviewProduct;
}

export interface ReviewPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ReviewsResponse {
  success: boolean;
  message: string;
  data: {
    reviews: Review[];
    pagination: ReviewPagination;
  };
}

export interface ReviewStats {
  total_reviews: number;
  reviews_this_month: number;
  average_rating: number;
  rating_counts: Array<{
    rating: number;
    _count: {
      rating: number;
    };
  }>;
}

export interface RatingDistributionItem {
  stars: number;
  count: number;
  pct: number;
}

export interface TopRatedProductItem {
  product_id: string;
  product_name: string;
  average_rating: number;
  review_count: number;
}

export const reviewService = {
  getAdminReviews: (params?: ReviewListParams) => {
    const queryParams: Record<string, string> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = String(params.page);
      if (params.limit !== undefined) queryParams.limit = String(params.limit);
      if (params.search) queryParams.search = params.search;
      if (params.rating !== undefined) queryParams.rating = String(params.rating);
      if (params.status) queryParams.status = params.status;
    }
    return api.get<ReviewsResponse>('/reviews/admin/list', { params: queryParams });
  },

  getAdminReviewStats: () => {
    return api.get<{ success: boolean; data: ReviewStats }>('/reviews/admin/stats');
  },

  getAdminRatingDistribution: () => {
    return api.get<{ success: boolean; data: RatingDistributionItem[] }>('/reviews/admin/distribution');
  },

  getAdminTopRatedProducts: (limit?: number) => {
    const queryParams: Record<string, string> = {};
    if (limit !== undefined) queryParams.limit = String(limit);
    return api.get<{ success: boolean; data: TopRatedProductItem[] }>('/reviews/admin/top-rated', { params: queryParams });
  },

  adminDeleteReview: (id: number) => {
    return api.delete<{ success: boolean; data: { deleted: boolean } }>(`/reviews/admin/${id}`);
  },

  getRecentReviews: (limit?: number) => {
    const params: Record<string, string> = {};
    if (limit !== undefined) params.limit = String(limit);
    return api.get<{ success: boolean; message: string; data: Review[] }>('/reviews/recent', { params });
  },

  getProductReviews: (productId: string, page?: number, limit?: number) => {
    const params: Record<string, string> = {};
    if (page !== undefined) params.page = String(page);
    if (limit !== undefined) params.limit = String(limit);
    return api.get<ReviewsResponse>(`/reviews/products/${productId}/reviews`, { params });
  },

  createReview: (productId: string, data: { rating: number; title?: string; description?: string }) => {
    return api.post<{ success: boolean; message: string; data: any }>(`/reviews/products/${productId}/reviews`, data);
  },
};
