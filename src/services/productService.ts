import api from './api';

export interface Product {
  id: string;
  name: string;
  cat: string; // Category string used by frontend
  price: string; // Formatted price like "RM 39.00"
  img: string;
  images?: string[]; // All uploaded images
  badge?: string;
  badgeClass?: string;
  stars: number;
  rev: number;
  old?: string; // Optional old price like "RM 45.00"
  stockStatus?: string;
  delivery?: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  _original?: any; // To hold the full backend object if needed
}

export const productService = {
  getProducts: (params?: Record<string, any>) => {
    return api.get<any>('/products', { params });
  },

  getFeaturedProducts: (params?: Record<string, any>) => {
    return api.get<any>('/products/featured', { params });
  },

  getProductById: (id: string) => {
    return api.get<any>(`/products/${id}`);
  },

  createProduct: (data: any) => {
    return api.post<any>('/products', data);
  },

  createProductVariants: (productId: string, data: any) => {
    return api.post<any>(`/products/${productId}/variants`, data);
  },

  updateProduct: (id: string, data: any) => {
    return api.patch<any>(`/products/${id}`, data);
  },

  deleteProduct: (id: string) => {
    return api.delete<any>(`/products/${id}`);
  },

  uploadProductImages: (productId: string, formData: FormData) => {
    // We cannot stringify FormData in api.post wrapper, so we need to use api's raw request or pass custom config
    // We'll use a direct fetch here to easily handle multipart/form-data with the auth token
    const token = localStorage.getItem('chennis_auth_token');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';

    return fetch(`${API_BASE_URL}/products/${productId}/images`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Image upload failed');
      return data;
    });
  },

  deleteProductImage: (productId: string, imageId: number) => {
    return api.delete<any>(`/products/${productId}/images/${imageId}`);
  },

  reorderProductImages: (productId: string, images: { id: number; sort_order: number; is_primary?: boolean }[]) => {
    return api.patch<any>(`/products/${productId}/images/reorder`, { images });
  },

  getCategories: () => {
    return api.get<any>('/products/categories');
  },

  createCategory: (data: any) => {
    return api.post<any>('/products/categories', data);
  },

  uploadCategoryImage: (categoryId: string, file: File) => {
    const token = localStorage.getItem('chennis_auth_token');
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
    const formData = new FormData();
    formData.append('image', file);

    return fetch(`${API_BASE_URL}/products/categories/${categoryId}/image`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Category image upload failed');
      return data;
    });
  },

  updateCategory: (id: string, data: any) => {
    return api.patch<any>(`/products/categories/${id}`, data);
  },

  deleteCategory: (id: string) => {
    return api.delete<any>(`/products/categories/${id}`);
  },

  getBrands: () => {
    return api.get<any>('/products/brands');
  },

  createBrand: (data: any) => {
    return api.post<any>('/products/brands', data);
  },

  updateBrand: (id: number, data: any) => {
    return api.patch<any>(`/products/brands/${id}`, data);
  },

  deleteBrand: (id: number) => {
    return api.delete<any>(`/products/brands/${id}`);
  },

  getInventoryList: (search?: string) => {
    return api.get<any>('/inventory', { params: search ? { search } : undefined });
  },

  getInventoryAnalytics: () => {
    return api.get<any>('/inventory/analytics');
  },

  updateInventoryStock: (variantId: string, data: { quantity_available: number }) => {
    return api.patch<any>(`/inventory/${variantId}`, data);
  },

  mapBackendProductToFrontend: (backendProduct: any): Product => {
    // Generate fallback image based on category
    let fallbackImg = 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80&fit=crop';

    // Check if category relation exists
    const catName = backendProduct.category?.name?.toLowerCase() || '';

    if (catName.includes('food') || catName.includes('grocery')) {
      fallbackImg = 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&q=80&fit=crop';
    } else if (catName.includes('cosmetic') || catName.includes('beauty')) {
      fallbackImg = 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&q=80&fit=crop';
    } else if (catName.includes('material') || catName.includes('construction') || catName.includes('eco')) {
      fallbackImg = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&q=80&fit=crop';
    }

    // Determine category frontend identifier
    let catId = 'featured';
    if (catName.includes('food')) catId = 'food';
    if (catName.includes('cosmetic')) catId = 'cosmetics';
    if (catName.includes('material')) catId = 'construction';

    // Map uploaded images if they exist
    let img = fallbackImg;
    let allImages = [fallbackImg];

    if (backendProduct.images && backendProduct.images.length > 0) {
      const API_HOST = (import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1').replace('/api/v1', '');

      const getFullImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
          return url;
        }
        return `${API_HOST}${url}`;
      };

      // Find primary or fallback to first
      const primaryImage = backendProduct.images.find((i: any) => i.is_primary) || backendProduct.images[0];
      img = getFullImageUrl(primaryImage.image_url);

      // Map all images
      allImages = backendProduct.images.map((i: any) => getFullImageUrl(i.image_url));
    }

    // Get the active/default variant
    const activeVariant = backendProduct.variants?.find((v: any) => v.is_active) || backendProduct.variants?.[0];
    const basePriceNum = parseFloat(backendProduct.price || 0);
    const hasDiscount = !!backendProduct.discount_price;
    const finalPrice = hasDiscount ? parseFloat(backendProduct.discount_price) : basePriceNum;
    const oldPrice = hasDiscount ? basePriceNum : basePriceNum * 1.282; // roughly 22% markup for visual mockup match

    return {
      id: backendProduct.id,
      name: backendProduct.name,
      cat: catId,
      price: `RM ${finalPrice.toFixed(2)}`,
      old: `RM ${oldPrice.toFixed(2)}`,
      img: img, // Use uploaded image or fallback
      badge: backendProduct.status === 'ACTIVE' ? 'Organic' : '',
      badgeClass: 'badge-org',
      stars: 5, // Mock data for now since reviews are not populated
      rev: Math.floor(Math.random() * 100) + 10,
      stockStatus: (backendProduct.stock == null || backendProduct.stock > 0) ? 'In Stock' : 'Out of Stock',
      delivery: 'Standard Delivery',
      variantId: activeVariant?.id,
      variantName: activeVariant?.name,
      sku: activeVariant?.sku || backendProduct.sku,
      images: allImages,
      _original: backendProduct
    };
  }
};
